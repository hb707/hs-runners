import { ulid } from 'ulid';
import { upsertRecord, findRecordById, getRecordsByTeam, getRecordsByUser, deleteRecord as deleteRecordFromStore, uploadToStorage } from './storage.service';
import { analyzeRunningImage } from './vision.service';
import { getISOWeekNumber } from '../utils/date.utils';
import { AppError } from '../middleware/error.middleware';
import type { RunRecord, VisionConfidence } from '../types';
import type { CreateRecordInput } from '../validators/record.validator';

export async function analyzeRecordImage(buffer: Buffer, originalName: string, mimetype: string) {
  const ext = originalName.split('.').pop()?.toLowerCase() ?? 'jpg';
  const filename = `rec_${ulid()}.${ext}`;
  const [imageUrl, visionResult] = await Promise.all([
    uploadToStorage('run-records', filename, buffer, mimetype),
    analyzeRunningImage(buffer),
  ]);
  return {
    imageUrl,
    distanceKm: visionResult.distanceKm,
    recordedDate: visionResult.recordedDate,
    visionRaw: visionResult.visionRaw,
    visionConfidence: visionResult.visionConfidence,
  };
}

export async function createRecord(userId: string, teamId: string, input: CreateRecordInput): Promise<RunRecord> {
  const now = new Date().toISOString();
  const id = `rec_${ulid()}`;
  const recordedAt = input.recordedAt;

  const record: RunRecord = {
    id,
    userId,
    teamId,
    imageUrl: input.imageUrl,
    distanceKm: input.distanceKm,
    visionRaw: input.visionRaw ?? null,
    visionConfidence: (input.visionConfidence ?? 'failed') as VisionConfidence,
    manualDistanceKm: null,
    recordedAt,
    weekNumber: getISOWeekNumber(new Date(recordedAt)),
    createdAt: now,
  };

  await upsertRecord(record);
  return record;
}

export async function getTeamRecordsByMonth(teamId: string, month: string): Promise<RunRecord[]> {
  const records = await getRecordsByTeam(teamId);
  return records.filter((r) => r.recordedAt.startsWith(month));
}

export async function getUserRecordsByMonth(userId: string, month: string): Promise<RunRecord[]> {
  const records = await getRecordsByUser(userId);
  return records.filter((r) => r.recordedAt.startsWith(month));
}

export async function getRecord(recordId: string, requesterTeamId: string): Promise<RunRecord> {
  const record = await findRecordById(recordId);
  if (!record) throw new AppError(404, 'RECORD_NOT_FOUND', 'Record not found');
  if (record.teamId !== requesterTeamId) throw new AppError(403, 'FORBIDDEN', 'Not your team record');
  return record;
}

export async function updateRecordDistance(recordId: string, distanceKm: number, requesterTeamId: string): Promise<RunRecord> {
  const record = await findRecordById(recordId);
  if (!record) throw new AppError(404, 'RECORD_NOT_FOUND', 'Record not found');
  if (record.teamId !== requesterTeamId) throw new AppError(403, 'FORBIDDEN', 'Not your team record');

  const updated: RunRecord = { ...record, manualDistanceKm: distanceKm };
  await upsertRecord(updated);
  return updated;
}

export async function removeRecord(recordId: string, requesterId: string, requesterRole: string, requesterTeamId: string): Promise<void> {
  const record = await findRecordById(recordId);
  if (!record) throw new AppError(404, 'RECORD_NOT_FOUND', 'Record not found');

  const isOwner = record.userId === requesterId;
  const isTeamAdmin = requesterRole === 'team_admin' && record.teamId === requesterTeamId;
  const isMasterAdmin = requesterRole === 'master_admin';

  if (!isOwner && !isTeamAdmin && !isMasterAdmin) {
    throw new AppError(403, 'FORBIDDEN', 'Cannot delete this record');
  }

  await deleteRecordFromStore(recordId);
}
