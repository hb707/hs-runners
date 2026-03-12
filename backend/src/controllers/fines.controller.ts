import type { Request, Response, NextFunction } from 'express';
import { getFinesByTeam, getFinesByUser } from '../services/storage.service';
import { markFinePaid, calculateWeeklyFines, getTeamStats } from '../services/fines.service';
import { AppError } from '../middleware/error.middleware';

export async function listTeamFines(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { teamId } = req.params;
    if (req.user!.role !== 'master_admin' && req.user!.teamId !== teamId) {
      throw new AppError(403, 'FORBIDDEN', 'Not your team');
    }
    const fines = await getFinesByTeam(teamId);
    res.json({ success: true, data: fines });
  } catch (err) {
    next(err);
  }
}

export async function listMyFines(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const fines = await getFinesByUser(req.user!.userId);
    res.json({ success: true, data: fines });
  } catch (err) {
    next(err);
  }
}

export async function payFine(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.user!.teamId) throw new AppError(403, 'NO_TEAM', 'Not in a team');
    const fine = await markFinePaid(req.params.fineId, req.user!.userId, req.user!.teamId);
    res.json({ success: true, data: fine });
  } catch (err) {
    next(err);
  }
}

export async function triggerCalculation(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { teamId } = req.params;
    const { weekNumber } = req.body;
    if (!weekNumber) throw new AppError(400, 'MISSING_WEEK', 'weekNumber is required (YYYY-Www)');

    const fines = await calculateWeeklyFines(teamId, weekNumber);
    res.json({ success: true, data: fines });
  } catch (err) {
    next(err);
  }
}

export async function teamStats(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { teamId } = req.params;
    if (req.user!.role !== 'master_admin' && req.user!.teamId !== teamId) {
      throw new AppError(403, 'FORBIDDEN', 'Not your team');
    }
    const month = req.query.month as string | undefined;
    const year = req.query.year as string | undefined;
    const stats = await getTeamStats(teamId, month, year);
    res.json({ success: true, data: stats });
  } catch (err) {
    next(err);
  }
}
