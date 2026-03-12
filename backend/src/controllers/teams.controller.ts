import type { Request, Response, NextFunction } from 'express';
import { createTeam, updateTeam, findTeamById, getTeamMembers, generateCode, getTeamCodes, revokeCode, getTeams } from '../services/teams.service';
import { assignTeamAdmin } from '../services/auth.service';
import { getCodes, findUserById } from '../services/storage.service';
import { AppError } from '../middleware/error.middleware';

export async function create(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const team = await createTeam(req.body, req.user!.userId);
    res.status(201).json({ success: true, data: team });
  } catch (err) {
    next(err);
  }
}

export async function getOne(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const team = await findTeamById(req.params.teamId);
    if (!team) throw new AppError(404, 'TEAM_NOT_FOUND', 'Team not found');
    if (req.user!.role !== 'master_admin' && team.id !== req.user!.teamId) {
      throw new AppError(403, 'FORBIDDEN', 'Not your team');
    }
    res.json({ success: true, data: team });
  } catch (err) {
    next(err);
  }
}

export async function update(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const team = await updateTeam(req.params.teamId, req.body);
    res.json({ success: true, data: team });
  } catch (err) {
    next(err);
  }
}

export async function listMembers(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const members = await getTeamMembers(req.params.teamId);
    res.json({ success: true, data: members });
  } catch (err) {
    next(err);
  }
}

export async function setAdmin(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const user = await assignTeamAdmin(req.params.userId, req.params.teamId);
    res.json({ success: true, data: user });
  } catch (err) {
    next(err);
  }
}

export async function createCode(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const createdBy = req.user!.userId === 'admin' ? null : req.user!.userId;
    const code = await generateCode(req.params.teamId, createdBy, req.body);
    res.status(201).json({ success: true, data: code });
  } catch (err) {
    next(err);
  }
}

export async function listCodes(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const codes = await getTeamCodes(req.params.teamId);
    res.json({ success: true, data: codes });
  } catch (err) {
    next(err);
  }
}

export async function deleteCode(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    await revokeCode(req.params.codeId, req.params.teamId);
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
}

export async function listAll(_req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const teams = await getTeams();
    res.json({ success: true, data: teams });
  } catch (err) {
    next(err);
  }
}

export async function listAllCodes(_req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
    const [allCodes, allTeams] = await Promise.all([getCodes(), getTeams()]);

    const recentCodes = allCodes
      .filter((c) => c.createdAt >= sevenDaysAgo)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));

    const teamMap = new Map(allTeams.map((t) => [t.id, t.name]));

    const results = await Promise.all(
      recentCodes.map(async (c) => {
        const usedByUser = c.usedBy ? await findUserById(c.usedBy) : null;
        return {
          id: c.id,
          code: c.code,
          teamId: c.teamId,
          teamName: teamMap.get(c.teamId) ?? c.teamId,
          createdAt: c.createdAt,
          expiresAt: c.expiresAt,
          usedBy: usedByUser
            ? { userId: usedByUser.id, nickname: usedByUser.nickname, profileImageUrl: usedByUser.profileImageUrl }
            : null,
        };
      }),
    );

    res.json({ success: true, data: results });
  } catch (err) {
    next(err);
  }
}
