import type { Request, Response, NextFunction } from 'express';
import { getKakaoAuthUrl, handleKakaoCallback, processOnboarding, processOnboardingWithToken } from '../services/auth.service';
import { onboardingSchema } from '../validators/auth.validator';
import { AppError } from '../middleware/error.middleware';
import { env } from '../config/env';
import { verifyAccessToken, signAdminAccessToken } from '../utils/token.utils';
import type { User } from '../types';

export async function kakaoRedirect(_req: Request, res: Response): Promise<void> {
  res.redirect(getKakaoAuthUrl());
}

export async function kakaoCallback(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const code = req.query.code as string;
    if (!code) throw new AppError(400, 'MISSING_CODE', 'Authorization code missing');

    const loginResult = await handleKakaoCallback(code);
    const redirectUrl = new URL(`${env.FRONTEND_URL}/auth/callback`);

    if (loginResult.type === 'authenticated') {
      res.cookie('refresh_token', loginResult.refreshToken, {
        httpOnly: true,
        secure: env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000,
      });

      redirectUrl.searchParams.set('token', loginResult.accessToken);
      redirectUrl.searchParams.set('hasTeam', loginResult.user.teamId ? 'true' : 'false');
    } else {
      redirectUrl.searchParams.set('needsOnboarding', 'true');
      redirectUrl.searchParams.set('onboardingToken', loginResult.onboardingToken);
    }

    res.redirect(redirectUrl.toString());
  } catch (err) {
    next(err);
  }
}

export async function onboarding(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const parsed = onboardingSchema.safeParse(req.body);
    if (!parsed.success) {
      throw new AppError(400, 'VALIDATION_ERROR', parsed.error.issues.map((i) => i.message).join(', '));
    }

    const authHeader = req.headers.authorization;
    const bearerToken = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;

    let accessToken: string;
    let user: User;

    if (bearerToken) {
      const auth = verifyAccessToken(bearerToken);
      const result = await processOnboarding(auth.userId, parsed.data.code);
      accessToken = result.accessToken;
      user = result.user;
    } else {
      if (!parsed.data.onboardingToken) {
        throw new AppError(401, 'ONBOARDING_TOKEN_REQUIRED', 'Onboarding token is required');
      }
      const result = await processOnboardingWithToken(parsed.data.code, parsed.data.onboardingToken);
      accessToken = result.accessToken;
      user = result.user;
    }

    res.json({ success: true, data: { accessToken, user } });
  } catch (err) {
    next(err);
  }
}

export async function adminLogin(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { code } = req.body;
    if (!code || typeof code !== 'string') {
      throw new AppError(400, 'MISSING_CODE', 'Admin code is required');
    }
    if (code !== env.ADMIN_CODE) {
      throw new AppError(401, 'INVALID_CODE', 'Invalid admin code');
    }
    const accessToken = signAdminAccessToken();
    res.json({ success: true, data: { accessToken } });
  } catch (err) {
    next(err);
  }
}

export async function logout(req: Request, res: Response): Promise<void> {
  res.clearCookie('refresh_token');
  res.json({ success: true });
}
