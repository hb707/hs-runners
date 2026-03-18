import { ulid } from 'ulid';
import { getTeams, getUsers, getRecords, getRecordsByTeam, getRecordsByTeamInRange, getFinesByTeam, getFines, saveFines, upsertFine, findFineById, findTeamById } from './storage.service';
import { getWeekBoundaries, getPreviousWeek, getISOWeekNumber } from '../utils/date.utils';
import { AppError } from '../middleware/error.middleware';
import type { Fine } from '../types';

export async function calculateWeeklyFines(teamId: string, weekNumber: string): Promise<Fine[]> {
  const team = await findTeamById(teamId);
  if (!team) throw new AppError(404, 'TEAM_NOT_FOUND', 'Team not found');

  const existingFines = await getFinesByTeam(teamId);
  const alreadyCalculated = existingFines.some((f) => f.weekNumber === weekNumber);
  if (alreadyCalculated) return existingFines.filter((f) => f.weekNumber === weekNumber);

  const { start, end } = getWeekBoundaries(weekNumber);
  const [allRecords, users] = await Promise.all([getRecords(), getUsers()]);

  const weekRecords = allRecords.filter((r) => {
    if (r.teamId !== teamId) return false;
    const recDate = new Date(r.recordedAt);
    return recDate >= start && recDate <= end;
  });

  const teamMembers = users.filter((u) => u.teamId === teamId && new Date(u.createdAt) <= end);

  const createdFines: Fine[] = [];
  const now = new Date().toISOString();

  for (const member of teamMembers) {
    const memberJoinDate = new Date(member.createdAt);
    const effectiveStart = memberJoinDate > start ? memberJoinDate : start;
    const actualCount = weekRecords.filter(
      (r) => r.userId === member.id && new Date(r.recordedAt) >= effectiveStart
    ).length;
    const shortfall = Math.max(0, team.weeklyRequiredCount - actualCount);

    if (shortfall > 0) {
      createdFines.push({
        id: `fine_${ulid()}`,
        userId: member.id,
        teamId,
        weekNumber,
        requiredCount: team.weeklyRequiredCount,
        actualCount,
        shortfall,
        fineAmountPerShortfall: team.fineAmountPerShortfall,
        totalFine: shortfall * team.fineAmountPerShortfall,
        isPaid: false,
        paidAt: null,
        confirmedBy: null,
        createdAt: now,
      });
    }
  }

  if (createdFines.length > 0) {
    const allFines = await getFines();
    await saveFines([...allFines, ...createdFines]);
  }

  return createdFines;
}

export async function calculateAllTeamsFines(): Promise<void> {
  const teams = await getTeams();
  const lastWeek = getPreviousWeek(getISOWeekNumber(new Date()));

  for (const team of teams) {
    try {
      await calculateWeeklyFines(team.id, lastWeek);
    } catch (err) {
      console.error(`Failed to calculate fines for team ${team.id}:`, err);
    }
  }
}

export async function markFinePaid(fineId: string, confirmedBy: string, requesterTeamId: string): Promise<Fine> {
  const fine = await findFineById(fineId);
  if (!fine) throw new AppError(404, 'FINE_NOT_FOUND', 'Fine not found');
  if (fine.teamId !== requesterTeamId) throw new AppError(403, 'FORBIDDEN', 'Not your team fine');

  const updated: Fine = { ...fine, isPaid: true, paidAt: new Date().toISOString(), confirmedBy };
  await upsertFine(updated);
  return updated;
}

export async function getTeamStats(teamId: string, month?: string, year?: string, week?: string) {
  const weekBounds = week ? getWeekBoundaries(week) : null;

  const [users, allRecords, allFines] = await Promise.all([
    getUsers(),
    weekBounds
      ? getRecordsByTeamInRange(teamId, weekBounds.start, weekBounds.end)
      : getRecordsByTeam(teamId),
    getFinesByTeam(teamId),
  ]);
  const teamMembers = users.filter((u) => u.teamId === teamId);

  const stats = teamMembers.map((member) => {
    const memberRecords = allRecords.filter((r) => {
      if (r.userId !== member.id) return false;
      if (weekBounds) return true; // already filtered at DB level
      if (month) return r.recordedAt.startsWith(month);
      if (year) return r.recordedAt.startsWith(year);
      return true;
    });

    const memberFines = allFines.filter((f) => {
      if (f.userId !== member.id) return false;
      if (week) return f.weekNumber === week;
      if (month) {
        const { start } = getWeekBoundaries(f.weekNumber);
        const fineMonth = `${start.getUTCFullYear()}-${String(start.getUTCMonth() + 1).padStart(2, '0')}`;
        return fineMonth === month;
      }
      if (year) return f.weekNumber.startsWith(year);
      return true;
    });

    const totalKm = memberRecords.reduce((sum, r) => {
      return sum + (r.manualDistanceKm ?? r.distanceKm ?? 0);
    }, 0);

    const totalFineAmount = memberFines.reduce((sum, f) => sum + f.totalFine, 0);

    return {
      userId: member.id,
      nickname: member.nickname,
      profileImageUrl: member.profileImageUrl,
      totalRecords: memberRecords.length,
      totalKm: Math.round(totalKm * 100) / 100,
      totalFineAmount,
    };
  });

  return stats;
}
