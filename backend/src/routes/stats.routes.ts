import { Router } from 'express';
import { teamStats } from '../controllers/fines.controller';
import { authMiddleware } from '../middleware/auth.middleware';

const router = Router();

router.use(authMiddleware);

router.get('/team/:teamId', teamStats);

export default router;
