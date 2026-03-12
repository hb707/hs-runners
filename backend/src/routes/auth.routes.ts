import { Router } from 'express';
import { kakaoRedirect, kakaoCallback, onboarding, adminLogin, logout } from '../controllers/auth.controller';
import { authMiddleware } from '../middleware/auth.middleware';

const router = Router();

router.get('/kakao', kakaoRedirect);
router.get('/kakao/callback', kakaoCallback);
router.post('/onboarding', onboarding);
router.post('/admin', adminLogin);
router.post('/logout', authMiddleware, logout);

export default router;
