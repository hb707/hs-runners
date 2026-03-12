import type { Request, Response, NextFunction } from 'express';
import { ulid } from 'ulid';
import { findUserById, upsertUser, uploadToStorage } from '../services/storage.service';
import { getTeamMembers } from '../services/teams.service';
import { AppError } from '../middleware/error.middleware';

export async function getMe(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const user = await findUserById(req.user!.userId);
    if (!user) throw new AppError(404, 'USER_NOT_FOUND', 'User not found');
    res.json({ success: true, data: user });
  } catch (err) {
    next(err);
  }
}

export async function updateMe(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const user = await findUserById(req.user!.userId);
    if (!user) throw new AppError(404, 'USER_NOT_FOUND', 'User not found');

    const nickname = typeof req.body.nickname === 'string' ? req.body.nickname.trim().slice(0, 20) : user.nickname;
    const profileImageUrl = typeof req.body.profileImageUrl === 'string' ? req.body.profileImageUrl : user.profileImageUrl;
    const updated = { ...user, nickname, profileImageUrl, updatedAt: new Date().toISOString() };
    await upsertUser(updated);
    res.json({ success: true, data: updated });
  } catch (err) {
    next(err);
  }
}

export async function updateAvatar(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.file) throw new AppError(400, 'NO_FILE', 'Image file is required');
    const user = await findUserById(req.user!.userId);
    if (!user) throw new AppError(404, 'USER_NOT_FOUND', 'User not found');

    const ext = req.file.originalname.split('.').pop()?.toLowerCase() ?? 'jpg';
    const filename = `avatar_${ulid()}.${ext}`;
    const profileImageUrl = await uploadToStorage('profile-images', filename, req.file.buffer, req.file.mimetype);

    const updated = { ...user, profileImageUrl, updatedAt: new Date().toISOString() };
    await upsertUser(updated);
    res.json({ success: true, data: updated });
  } catch (err) {
    next(err);
  }
}

export async function getTeamUsers(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.user!.teamId) throw new AppError(403, 'NO_TEAM', 'Not in a team');
    const members = await getTeamMembers(req.user!.teamId);
    res.json({ success: true, data: members });
  } catch (err) {
    next(err);
  }
}
