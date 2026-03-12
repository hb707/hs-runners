import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import type { AuthTokenPayload, OnboardingTokenPayload } from '../types';

export function signAccessToken(payload: AuthTokenPayload): string {
  return jwt.sign(payload, env.JWT_ACCESS_SECRET, {
    expiresIn: env.JWT_ACCESS_EXPIRES_IN as jwt.SignOptions['expiresIn'],
  });
}

export function signRefreshToken(payload: AuthTokenPayload): string {
  return jwt.sign(payload, env.JWT_REFRESH_SECRET, {
    expiresIn: env.JWT_REFRESH_EXPIRES_IN as jwt.SignOptions['expiresIn'],
  });
}

export function verifyAccessToken(token: string): AuthTokenPayload {
  return jwt.verify(token, env.JWT_ACCESS_SECRET) as AuthTokenPayload;
}

export function verifyRefreshToken(token: string): AuthTokenPayload {
  return jwt.verify(token, env.JWT_REFRESH_SECRET) as AuthTokenPayload;
}

export function signAdminAccessToken(): string {
  return jwt.sign(
    { userId: 'admin', role: 'master_admin', teamId: null },
    env.JWT_ACCESS_SECRET,
    { expiresIn: '8h' },
  );
}

export function signOnboardingToken(payload: OnboardingTokenPayload): string {
  return jwt.sign(payload, env.JWT_ACCESS_SECRET, { expiresIn: '15m' });
}

export function verifyOnboardingToken(token: string): OnboardingTokenPayload {
  return jwt.verify(token, env.JWT_ACCESS_SECRET) as OnboardingTokenPayload;
}
