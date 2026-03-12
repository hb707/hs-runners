import path from 'path';
import { readJsonFile } from '../utils/file.utils';
import { supabase } from '../lib/supabase';
import { env } from '../config/env';
import type { User, Team, InvitationCode, RunRecord, Fine } from '../types';

type UsersStore = { users: User[] };
type TeamsStore = { teams: Team[] };
type CodesStore = { codes: InvitationCode[] };
type RecordsStore = { records: RunRecord[] };
type FinesStore = { fines: Fine[] };

function filePath(name: string): string {
  return path.resolve('./data', `${name}.json`);
}

async function upsertAll<T>(table: string, rows: T[]): Promise<void> {
  if (rows.length === 0) return;
  const { error } = await supabase.from(table).upsert(rows as never[], { onConflict: 'id' });
  if (error) throw new Error(`[${table}] ${error.message}`);
}

async function run(): Promise<void> {
  console.log('[Migration] Loading local JSON data...');

  const [users, teams, codes, records, fines] = await Promise.all([
    readJsonFile<UsersStore>(filePath('users'), { users: [] }),
    readJsonFile<TeamsStore>(filePath('teams'), { teams: [] }),
    readJsonFile<CodesStore>(filePath('invitation-codes'), { codes: [] }),
    readJsonFile<RecordsStore>(filePath('records'), { records: [] }),
    readJsonFile<FinesStore>(filePath('fines'), { fines: [] }),
  ]);

  await upsertAll('teams', teams.teams.map((t) => ({
    id: t.id,
    name: t.name,
    admin_user_id: t.adminUserId,
    weekly_required_count: t.weeklyRequiredCount,
    fine_amount_per_shortfall: t.fineAmountPerShortfall,
    created_at: t.createdAt,
    updated_at: t.updatedAt,
  })));

  await upsertAll('users', users.users.map((u) => ({
    id: u.id,
    kakao_id: u.kakaoId,
    nickname: u.nickname,
    profile_image_url: u.profileImageUrl,
    role: u.role,
    team_id: u.teamId,
    created_at: u.createdAt,
    updated_at: u.updatedAt,
  })));

  await upsertAll('invitation_codes', codes.codes.map((c) => ({
    id: c.id,
    code: c.code,
    team_id: c.teamId,
    created_by: c.createdBy,
    used_by: c.usedBy,
    used_at: c.usedAt,
    expires_at: c.expiresAt,
    created_at: c.createdAt,
  })));

  await upsertAll('records', records.records.map((r) => ({
    id: r.id,
    user_id: r.userId,
    team_id: r.teamId,
    image_url: r.imageUrl,
    distance_km: r.distanceKm,
    vision_raw: r.visionRaw,
    vision_confidence: r.visionConfidence,
    manual_distance_km: r.manualDistanceKm,
    recorded_at: r.recordedAt,
    week_number: r.weekNumber,
    created_at: r.createdAt,
  })));

  await upsertAll('fines', fines.fines.map((f) => ({
    id: f.id,
    user_id: f.userId,
    team_id: f.teamId,
    week_number: f.weekNumber,
    required_count: f.requiredCount,
    actual_count: f.actualCount,
    shortfall: f.shortfall,
    fine_amount_per_shortfall: f.fineAmountPerShortfall,
    total_fine: f.totalFine,
    is_paid: f.isPaid,
    paid_at: f.paidAt,
    confirmed_by: f.confirmedBy,
    created_at: f.createdAt,
  })));

  console.log('[Migration] Completed successfully.');
  console.log(`[Migration] Supabase URL: ${env.SUPABASE_URL}`);
}

run().catch((err) => {
  console.error('[Migration] Failed:', err);
  process.exit(1);
});
