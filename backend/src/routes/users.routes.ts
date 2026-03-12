import { Router } from 'express';
import { getMe, updateMe, getTeamUsers } from '../controllers/users.controller';
import { authMiddleware } from '../middleware/auth.middleware';

const router = Router();

router.use(authMiddleware);

router.get('/me', getMe);
router.patch('/me', updateMe);
router.get('/team', getTeamUsers);

export default router;
