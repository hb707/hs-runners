import { supabase } from '../lib/supabase';
import { AppError } from '../middleware/error.middleware';
import type { User, Team, InvitationCode, RunRecord, Fine } from '../types';

type UserRow = {
  id: string;
  kakao_id: string;
  nickname: string;
  profile_image_url: string;
  role: User['role'];
  team_id: string | null;
  created_at: string;
  updated_at: string;
};

type TeamRow = {
  id: string;
  name: string;
  admin_user_id: string;
  weekly_required_count: number;
  fine_amount_per_shortfall: number;
  created_at: string;
  updated_at: string;
};

type InvitationCodeRow = {
  id: string;
  code: string;
  team_id: string;
  created_by: string | null;
  used_by: string | null;
  used_at: string | null;
  expires_at: string;
  created_at: string;
};

type RunRecordRow = {
  id: string;
  user_id: string;
  team_id: string;
  image_url: string;
  distance_km: number | null;
  vision_raw: string | null;
  vision_confidence: RunRecord['visionConfidence'];
  manual_distance_km: number | null;
  recorded_at: string;
  week_number: string;
  created_at: string;
};

type FineRow = {
  id: string;
  user_id: string;
  team_id: string;
  week_number: string;
  required_count: number;
  actual_count: number;
  shortfall: number;
  fine_amount_per_shortfall: number;
  total_fine: number;
  is_paid: boolean;
  paid_at: string | null;
  confirmed_by: string | null;
  created_at: string;
};

export async function uploadToStorage(bucket: string, filename: string, buffer: Buffer, mimetype: string): Promise<string> {
  const { error } = await supabase.storage.from(bucket).upload(filename, buffer, {
    contentType: mimetype,
    upsert: true,
  });
  if (error) throwDbError(error, `Failed to upload to storage bucket: ${bucket}`);
  const { data } = supabase.storage.from(bucket).getPublicUrl(filename);
  return data.publicUrl;
}

function throwDbError(error: unknown, fallbackMessage: string): never {
  if (error && typeof error === 'object' && 'message' in error) {
    throw new AppError(500, 'DB_ERROR', String((error as { message: string }).message));
  }
  throw new AppError(500, 'DB_ERROR', fallbackMessage);
}

function toUser(row: UserRow): User {
  return {
    id: row.id,
    kakaoId: row.kakao_id,
    nickname: row.nickname,
    profileImageUrl: row.profile_image_url,
    role: row.role,
    teamId: row.team_id,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function toUserRow(user: User): UserRow {
  return {
    id: user.id,
    kakao_id: user.kakaoId,
    nickname: user.nickname,
    profile_image_url: user.profileImageUrl,
    role: user.role,
    team_id: user.teamId,
    created_at: user.createdAt,
    updated_at: user.updatedAt,
  };
}

function toTeam(row: TeamRow): Team {
  return {
    id: row.id,
    name: row.name,
    adminUserId: row.admin_user_id,
    weeklyRequiredCount: row.weekly_required_count,
    fineAmountPerShortfall: row.fine_amount_per_shortfall,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function toTeamRow(team: Team): TeamRow {
  return {
    id: team.id,
    name: team.name,
    admin_user_id: team.adminUserId,
    weekly_required_count: team.weeklyRequiredCount,
    fine_amount_per_shortfall: team.fineAmountPerShortfall,
    created_at: team.createdAt,
    updated_at: team.updatedAt,
  };
}

function toInvitationCode(row: InvitationCodeRow): InvitationCode {
  return {
    id: row.id,
    code: row.code,
    teamId: row.team_id,
    createdBy: row.created_by,
    usedBy: row.used_by,
    usedAt: row.used_at,
    expiresAt: row.expires_at,
    createdAt: row.created_at,
  };
}

function toInvitationCodeRow(code: InvitationCode): InvitationCodeRow {
  return {
    id: code.id,
    code: code.code,
    team_id: code.teamId,
    created_by: code.createdBy,
    used_by: code.usedBy,
    used_at: code.usedAt,
    expires_at: code.expiresAt,
    created_at: code.createdAt,
  };
}

function toRunRecord(row: RunRecordRow): RunRecord {
  return {
    id: row.id,
    userId: row.user_id,
    teamId: row.team_id,
    imageUrl: row.image_url,
    distanceKm: row.distance_km,
    visionRaw: row.vision_raw,
    visionConfidence: row.vision_confidence,
    manualDistanceKm: row.manual_distance_km,
    recordedAt: row.recorded_at,
    weekNumber: row.week_number,
    createdAt: row.created_at,
  };
}

function toRunRecordRow(record: RunRecord): RunRecordRow {
  return {
    id: record.id,
    user_id: record.userId,
    team_id: record.teamId,
    image_url: record.imageUrl,
    distance_km: record.distanceKm,
    vision_raw: record.visionRaw,
    vision_confidence: record.visionConfidence,
    manual_distance_km: record.manualDistanceKm,
    recorded_at: record.recordedAt,
    week_number: record.weekNumber,
    created_at: record.createdAt,
  };
}

function toFine(row: FineRow): Fine {
  return {
    id: row.id,
    userId: row.user_id,
    teamId: row.team_id,
    weekNumber: row.week_number,
    requiredCount: row.required_count,
    actualCount: row.actual_count,
    shortfall: row.shortfall,
    fineAmountPerShortfall: row.fine_amount_per_shortfall,
    totalFine: row.total_fine,
    isPaid: row.is_paid,
    paidAt: row.paid_at,
    confirmedBy: row.confirmed_by,
    createdAt: row.created_at,
  };
}

function toFineRow(fine: Fine): FineRow {
  return {
    id: fine.id,
    user_id: fine.userId,
    team_id: fine.teamId,
    week_number: fine.weekNumber,
    required_count: fine.requiredCount,
    actual_count: fine.actualCount,
    shortfall: fine.shortfall,
    fine_amount_per_shortfall: fine.fineAmountPerShortfall,
    total_fine: fine.totalFine,
    is_paid: fine.isPaid,
    paid_at: fine.paidAt,
    confirmed_by: fine.confirmedBy,
    created_at: fine.createdAt,
  };
}

// ── Users ──────────────────────────────────────────────────────────────────

export async function getUsers(): Promise<User[]> {
  const { data, error } = await supabase.from('users').select('*').order('created_at', { ascending: true });
  if (error) throwDbError(error, 'Failed to load users');
  return (data as UserRow[]).map(toUser);
}

export async function saveUsers(users: User[]): Promise<void> {
  const { error: deleteError } = await supabase.from('users').delete().neq('id', '');
  if (deleteError) throwDbError(deleteError, 'Failed to clear users');
  if (users.length === 0) return;
  const { error: upsertError } = await supabase.from('users').upsert(users.map(toUserRow), { onConflict: 'id' });
  if (upsertError) throwDbError(upsertError, 'Failed to save users');
}

export async function findUserById(id: string): Promise<User | undefined> {
  const { data, error } = await supabase.from('users').select('*').eq('id', id).maybeSingle();
  if (error) throwDbError(error, 'Failed to load user');
  return data ? toUser(data as UserRow) : undefined;
}

export async function findUserByKakaoId(kakaoId: string): Promise<User | undefined> {
  const { data, error } = await supabase.from('users').select('*').eq('kakao_id', kakaoId).maybeSingle();
  if (error) throwDbError(error, 'Failed to load user by kakao id');
  return data ? toUser(data as UserRow) : undefined;
}

export async function upsertUser(user: User): Promise<void> {
  const { error } = await supabase.from('users').upsert(toUserRow(user), { onConflict: 'id' });
  if (error) throwDbError(error, 'Failed to save user');
}

// ── Teams ──────────────────────────────────────────────────────────────────

export async function getTeams(): Promise<Team[]> {
  const { data, error } = await supabase.from('teams').select('*').order('created_at', { ascending: true });
  if (error) throwDbError(error, 'Failed to load teams');
  return (data as TeamRow[]).map(toTeam);
}

export async function saveTeams(teams: Team[]): Promise<void> {
  const { error: deleteError } = await supabase.from('teams').delete().neq('id', '');
  if (deleteError) throwDbError(deleteError, 'Failed to clear teams');
  if (teams.length === 0) return;
  const { error: upsertError } = await supabase.from('teams').upsert(teams.map(toTeamRow), { onConflict: 'id' });
  if (upsertError) throwDbError(upsertError, 'Failed to save teams');
}

export async function findTeamById(id: string): Promise<Team | undefined> {
  const { data, error } = await supabase.from('teams').select('*').eq('id', id).maybeSingle();
  if (error) throwDbError(error, 'Failed to load team');
  return data ? toTeam(data as TeamRow) : undefined;
}

export async function upsertTeam(team: Team): Promise<void> {
  const { error } = await supabase.from('teams').upsert(toTeamRow(team), { onConflict: 'id' });
  if (error) throwDbError(error, 'Failed to save team');
}

// ── Invitation Codes ───────────────────────────────────────────────────────

export async function getCodes(): Promise<InvitationCode[]> {
  const { data, error } = await supabase.from('invitation_codes').select('*').order('created_at', { ascending: false });
  if (error) throwDbError(error, 'Failed to load invitation codes');
  return (data as InvitationCodeRow[]).map(toInvitationCode);
}

export async function saveCodes(codes: InvitationCode[]): Promise<void> {
  const { error: deleteError } = await supabase.from('invitation_codes').delete().neq('id', '');
  if (deleteError) throwDbError(deleteError, 'Failed to clear invitation codes');
  if (codes.length === 0) return;
  const { error: upsertError } = await supabase
    .from('invitation_codes')
    .upsert(codes.map(toInvitationCodeRow), { onConflict: 'id' });
  if (upsertError) throwDbError(upsertError, 'Failed to save invitation codes');
}

export async function findCodeByValue(code: string): Promise<InvitationCode | undefined> {
  const { data, error } = await supabase.from('invitation_codes').select('*').eq('code', code).maybeSingle();
  if (error) throwDbError(error, 'Failed to load invitation code');
  return data ? toInvitationCode(data as InvitationCodeRow) : undefined;
}

export async function upsertCode(code: InvitationCode): Promise<void> {
  const { error } = await supabase.from('invitation_codes').upsert(toInvitationCodeRow(code), { onConflict: 'id' });
  if (error) throwDbError(error, 'Failed to save invitation code');
}

// ── Records ────────────────────────────────────────────────────────────────

export async function getRecords(): Promise<RunRecord[]> {
  const { data, error } = await supabase.from('records').select('*').order('recorded_at', { ascending: false });
  if (error) throwDbError(error, 'Failed to load records');
  return (data as RunRecordRow[]).map(toRunRecord);
}

export async function saveRecords(records: RunRecord[]): Promise<void> {
  const { error: deleteError } = await supabase.from('records').delete().neq('id', '');
  if (deleteError) throwDbError(deleteError, 'Failed to clear records');
  if (records.length === 0) return;
  const { error: upsertError } = await supabase.from('records').upsert(records.map(toRunRecordRow), { onConflict: 'id' });
  if (upsertError) throwDbError(upsertError, 'Failed to save records');
}

export async function findRecordById(id: string): Promise<RunRecord | undefined> {
  const { data, error } = await supabase.from('records').select('*').eq('id', id).maybeSingle();
  if (error) throwDbError(error, 'Failed to load record');
  return data ? toRunRecord(data as RunRecordRow) : undefined;
}

export async function getRecordsByTeam(teamId: string): Promise<RunRecord[]> {
  const { data, error } = await supabase
    .from('records')
    .select('*')
    .eq('team_id', teamId)
    .order('recorded_at', { ascending: false });
  if (error) throwDbError(error, 'Failed to load team records');
  return (data as RunRecordRow[]).map(toRunRecord);
}

export async function getRecordsByUser(userId: string): Promise<RunRecord[]> {
  const { data, error } = await supabase
    .from('records')
    .select('*')
    .eq('user_id', userId)
    .order('recorded_at', { ascending: false });
  if (error) throwDbError(error, 'Failed to load user records');
  return (data as RunRecordRow[]).map(toRunRecord);
}

export async function upsertRecord(record: RunRecord): Promise<void> {
  const { error } = await supabase.from('records').upsert(toRunRecordRow(record), { onConflict: 'id' });
  if (error) throwDbError(error, 'Failed to save record');
}

export async function deleteRecord(id: string): Promise<boolean> {
  const { data, error } = await supabase.from('records').delete().eq('id', id).select('id');
  if (error) throwDbError(error, 'Failed to delete record');
  return (data ?? []).length > 0;
}

// ── Fines ──────────────────────────────────────────────────────────────────

export async function getFines(): Promise<Fine[]> {
  const { data, error } = await supabase.from('fines').select('*').order('created_at', { ascending: false });
  if (error) throwDbError(error, 'Failed to load fines');
  return (data as FineRow[]).map(toFine);
}

export async function saveFines(fines: Fine[]): Promise<void> {
  const { error: deleteError } = await supabase.from('fines').delete().neq('id', '');
  if (deleteError) throwDbError(deleteError, 'Failed to clear fines');
  if (fines.length === 0) return;
  const { error: upsertError } = await supabase.from('fines').upsert(fines.map(toFineRow), { onConflict: 'id' });
  if (upsertError) throwDbError(upsertError, 'Failed to save fines');
}

export async function findFineById(id: string): Promise<Fine | undefined> {
  const { data, error } = await supabase.from('fines').select('*').eq('id', id).maybeSingle();
  if (error) throwDbError(error, 'Failed to load fine');
  return data ? toFine(data as FineRow) : undefined;
}

export async function getFinesByTeam(teamId: string): Promise<Fine[]> {
  const { data, error } = await supabase
    .from('fines')
    .select('*')
    .eq('team_id', teamId)
    .order('created_at', { ascending: false });
  if (error) throwDbError(error, 'Failed to load team fines');
  return (data as FineRow[]).map(toFine);
}

export async function getFinesByUser(userId: string): Promise<Fine[]> {
  const { data, error } = await supabase
    .from('fines')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  if (error) throwDbError(error, 'Failed to load user fines');
  return (data as FineRow[]).map(toFine);
}

export async function upsertFine(fine: Fine): Promise<void> {
  const { error } = await supabase.from('fines').upsert(toFineRow(fine), { onConflict: 'id' });
  if (error) throwDbError(error, 'Failed to save fine');
}
