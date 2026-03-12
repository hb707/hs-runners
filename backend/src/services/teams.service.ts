import { ulid } from 'ulid';
import { getTeams, upsertTeam, findTeamById, getCodes, saveCodes, upsertCode, getUsers } from './storage.service';
import { generateInvitationCode } from '../utils/code.utils';
import { AppError } from '../middleware/error.middleware';
import type { Team, InvitationCode } from '../types';
import type { CreateTeamInput, UpdateTeamInput, GenerateCodeInput } from '../validators/team.validator';

export async function createTeam(input: CreateTeamInput, creatorId: string): Promise<Team> {
  const now = new Date().toISOString();
  const team: Team = {
    id: `team_${ulid()}`,
    name: input.name,
    adminUserId: creatorId,
    weeklyRequiredCount: input.weeklyRequiredCount,
    fineAmountPerShortfall: input.fineAmountPerShortfall,
    createdAt: now,
    updatedAt: now,
  };
  await upsertTeam(team);
  return team;
}

export async function updateTeam(teamId: string, input: UpdateTeamInput): Promise<Team> {
  const team = await findTeamById(teamId);
  if (!team) throw new AppError(404, 'TEAM_NOT_FOUND', 'Team not found');

  const updated: Team = { ...team, ...input, updatedAt: new Date().toISOString() };
  await upsertTeam(updated);
  return updated;
}

export async function getTeamMembers(teamId: string) {
  const users = await getUsers();
  return users.filter((u) => u.teamId === teamId);
}

export async function generateCode(teamId: string, createdBy: string | null, input: GenerateCodeInput): Promise<InvitationCode> {
  const team = await findTeamById(teamId);
  if (!team) throw new AppError(404, 'TEAM_NOT_FOUND', 'Team not found');

  const now = new Date();
  const expiresAt = new Date(now.getTime() + input.expiresInDays * 24 * 60 * 60 * 1000).toISOString();

  const inviteCode: InvitationCode = {
    id: `code_${ulid()}`,
    code: generateInvitationCode(),
    teamId,
    createdBy,
    usedBy: null,
    usedAt: null,
    expiresAt,
    createdAt: now.toISOString(),
  };

  await upsertCode(inviteCode);
  return inviteCode;
}

export async function getTeamCodes(teamId: string): Promise<InvitationCode[]> {
  const codes = await getCodes();
  return codes.filter((c) => c.teamId === teamId);
}

export async function revokeCode(codeId: string, teamId: string): Promise<void> {
  const codes = await getCodes();
  const code = codes.find((c) => c.id === codeId);
  if (!code) throw new AppError(404, 'CODE_NOT_FOUND', 'Code not found');
  if (code.teamId !== teamId) throw new AppError(403, 'FORBIDDEN', 'Not your team code');

  await saveCodes(codes.filter((c) => c.id !== codeId));
}

export { findTeamById, getTeams };
