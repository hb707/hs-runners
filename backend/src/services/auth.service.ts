import axios from 'axios';
import { ulid } from 'ulid';
import { env } from '../config/env';
import { getUsers, findUserByKakaoId, upsertUser, findUserById, getCodes, upsertCode } from './storage.service';
import { signAccessToken, signRefreshToken, signOnboardingToken, verifyOnboardingToken } from '../utils/token.utils';
import { AppError } from '../middleware/error.middleware';
import type { User, AuthTokenPayload, InvitationCode } from '../types';

interface KakaoTokenResponse {
  access_token: string;
  token_type: string;
  refresh_token: string;
  expires_in: number;
}

interface KakaoProfile {
  id: number;
  properties?: {
    nickname?: string;
    profile_image?: string;
  };
  kakao_account?: {
    profile?: {
      nickname?: string;
      profile_image_url?: string;
    };
  };
}

export function getKakaoAuthUrl(): string {
  const params = new URLSearchParams({
    client_id: env.KAKAO_CLIENT_ID,
    redirect_uri: env.KAKAO_REDIRECT_URI,
    response_type: 'code',
  });
  return `https://kauth.kakao.com/oauth/authorize?${params.toString()}`;
}

type KakaoProfileInfo = {
  kakaoId: string;
  nickname: string;
  profileImageUrl: string;
};

type KakaoLoginResult =
  | { type: 'authenticated'; accessToken: string; refreshToken: string; user: User }
  | { type: 'onboarding_required'; onboardingToken: string };

async function getKakaoProfileInfo(code: string): Promise<KakaoProfileInfo> {
  const tokenRes = await axios.post<KakaoTokenResponse>(
    'https://kauth.kakao.com/oauth/token',
    new URLSearchParams({
      grant_type: 'authorization_code',
      client_id: env.KAKAO_CLIENT_ID,
      client_secret: env.KAKAO_CLIENT_SECRET,
      redirect_uri: env.KAKAO_REDIRECT_URI,
      code,
    }),
    { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
  );

  const profileRes = await axios.get<KakaoProfile>(
    'https://kapi.kakao.com/v2/user/me',
    { headers: { Authorization: `Bearer ${tokenRes.data.access_token}` } }
  );

  return {
    kakaoId: String(profileRes.data.id),
    nickname:
    profileRes.data.kakao_account?.profile?.nickname ??
    profileRes.data.properties?.nickname ??
    '러너',
    profileImageUrl:
    profileRes.data.kakao_account?.profile?.profile_image_url ??
    profileRes.data.properties?.profile_image ??
    '',
  };
}

function assertValidInvitationCode(codes: InvitationCode[], codeValue: string): InvitationCode {
  const code = codes.find((c) => c.code === codeValue);
  if (!code) throw new AppError(400, 'INVALID_CODE', 'Invalid invitation code');
  if (code.usedBy) throw new AppError(400, 'CODE_USED', 'Invitation code already used');
  if (new Date(code.expiresAt) < new Date()) throw new AppError(400, 'CODE_EXPIRED', 'Invitation code expired');
  return code;
}

export async function handleKakaoCallback(code: string): Promise<KakaoLoginResult> {
  const profile = await getKakaoProfileInfo(code);
  let user = await findUserByKakaoId(profile.kakaoId);
  const now = new Date().toISOString();

  if (!user) {
    return {
      type: 'onboarding_required',
      onboardingToken: signOnboardingToken(profile),
    };
  }

  user = { ...user, updatedAt: now };
  await upsertUser(user);

  const payload: AuthTokenPayload = { userId: user.id, role: user.role, teamId: user.teamId };
  return {
    type: 'authenticated',
    accessToken: signAccessToken(payload),
    refreshToken: signRefreshToken(payload),
    user,
  };
}

export async function processOnboarding(userId: string, codeValue: string): Promise<{ accessToken: string; user: User }> {
  const codes = await getCodes();
  const code = assertValidInvitationCode(codes, codeValue);

  const user = await findUserById(userId);
  if (!user) throw new AppError(404, 'USER_NOT_FOUND', 'User not found');
  if (user.teamId) throw new AppError(400, 'ALREADY_IN_TEAM', 'Already in a team');

  const now = new Date().toISOString();
  const updatedUser: User = { ...user, teamId: code.teamId, updatedAt: now };
  const updatedCode = { ...code, usedBy: userId, usedAt: now };

  await upsertUser(updatedUser);
  await upsertCode(updatedCode);

  const payload: AuthTokenPayload = { userId: updatedUser.id, role: updatedUser.role, teamId: updatedUser.teamId };
  return { accessToken: signAccessToken(payload), user: updatedUser };
}

export async function processOnboardingWithToken(codeValue: string, onboardingToken: string): Promise<{ accessToken: string; user: User }> {
  let profile: KakaoProfileInfo;
  try {
    profile = verifyOnboardingToken(onboardingToken);
  } catch {
    throw new AppError(401, 'INVALID_ONBOARDING_TOKEN', 'Invalid or expired onboarding token');
  }

  const existing = await findUserByKakaoId(profile.kakaoId);
  if (existing) {
    return processOnboarding(existing.id, codeValue);
  }

  const codes = await getCodes();
  const code = assertValidInvitationCode(codes, codeValue);
  const users = await getUsers();
  const isFirstUser = users.length === 0;
  const now = new Date().toISOString();

  const newUser: User = {
    id: `usr_${ulid()}`,
    kakaoId: profile.kakaoId,
    nickname: profile.nickname,
    profileImageUrl: profile.profileImageUrl,
    role: isFirstUser ? 'master_admin' : 'user',
    teamId: code.teamId,
    createdAt: now,
    updatedAt: now,
  };

  await upsertUser(newUser);
  await upsertCode({ ...code, usedBy: newUser.id, usedAt: now });

  const payload: AuthTokenPayload = { userId: newUser.id, role: newUser.role, teamId: newUser.teamId };
  return { accessToken: signAccessToken(payload), user: newUser };
}

export async function assignTeamAdmin(targetUserId: string, teamId: string): Promise<User> {
  const user = await findUserById(targetUserId);
  if (!user) throw new AppError(404, 'USER_NOT_FOUND', 'User not found');
  if (user.teamId !== teamId) throw new AppError(400, 'NOT_IN_TEAM', 'User is not in this team');

  const allUsers = await getUsers();
  const prevAdmin = allUsers.find((u) => u.teamId === teamId && u.role === 'team_admin');
  if (prevAdmin) {
    await upsertUser({ ...prevAdmin, role: 'user', updatedAt: new Date().toISOString() });
  }

  const updated: User = { ...user, role: 'team_admin', updatedAt: new Date().toISOString() };
  await upsertUser(updated);
  return updated;
}
