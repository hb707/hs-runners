import type { Request, Response, NextFunction } from 'express';
import { analyzeRecordImage, createRecord, getTeamRecordsByMonth, getUserRecordsByMonth, getRecord, updateRecordDistance, removeRecord } from '../services/records.service';
import { AppError } from '../middleware/error.middleware';

export async function analyzeImage(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.file) throw new AppError(400, 'NO_FILE', 'Image file is required');
    if (!req.user!.teamId) throw new AppError(403, 'NO_TEAM', 'Must be in a team to upload records');

    const result = await analyzeRecordImage(req.file.path);
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
}

export async function create(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.user!.teamId) throw new AppError(403, 'NO_TEAM', 'Must be in a team to upload records');

    const record = await createRecord(req.user!.userId, req.user!.teamId, req.body);
    res.status(201).json({ success: true, data: record });
  } catch (err) {
    next(err);
  }
}

export async function listTeamRecords(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.user!.teamId) throw new AppError(403, 'NO_TEAM', 'Not in a team');
    const month = req.query.month as string | undefined;
    if (!month) throw new AppError(400, 'MISSING_MONTH', 'month query param required (YYYY-MM)');

    const records = await getTeamRecordsByMonth(req.user!.teamId, month);
    res.json({ success: true, data: records });
  } catch (err) {
    next(err);
  }
}

export async function listMyRecords(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const month = req.query.month as string | undefined;
    if (!month) throw new AppError(400, 'MISSING_MONTH', 'month query param required (YYYY-MM)');

    const records = await getUserRecordsByMonth(req.user!.userId, month);
    res.json({ success: true, data: records });
  } catch (err) {
    next(err);
  }
}

export async function getOne(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.user!.teamId) throw new AppError(403, 'NO_TEAM', 'Not in a team');
    const record = await getRecord(req.params.recordId, req.user!.teamId);
    res.json({ success: true, data: record });
  } catch (err) {
    next(err);
  }
}

export async function updateDistance(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.user!.teamId) throw new AppError(403, 'NO_TEAM', 'Not in a team');
    const record = await updateRecordDistance(req.params.recordId, req.body.distanceKm, req.user!.teamId);
    res.json({ success: true, data: record });
  } catch (err) {
    next(err);
  }
}

export async function remove(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    await removeRecord(req.params.recordId, req.user!.userId, req.user!.role, req.user!.teamId ?? '');
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
}
