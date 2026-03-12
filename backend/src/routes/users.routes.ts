import { Router } from 'express';
import { getMe, updateMe, updateAvatar, getTeamUsers } from '../controllers/users.controller';
import { authMiddleware } from '../middleware/auth.middleware';
import { uploadMiddleware } from '../config/multer';

const router = Router();

router.use(authMiddleware);

router.get('/me', getMe);
router.patch('/me', updateMe);
router.post('/me/avatar', uploadMiddleware.single('image'), updateAvatar);
router.get('/team', getTeamUsers);

export default router;
