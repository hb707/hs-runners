import { Router } from 'express';
import { listTeamFines, listMyFines, payFine, triggerCalculation, teamStats } from '../controllers/fines.controller';
import { authMiddleware } from '../middleware/auth.middleware';
import { requireRole } from '../middleware/role.middleware';

const router = Router();

router.use(authMiddleware);

router.get('/team/:teamId', listTeamFines);
router.get('/me', listMyFines);
router.patch('/:fineId/paid', requireRole('team_admin', 'master_admin'), payFine);
router.post('/team/:teamId/calculate', requireRole('master_admin'), triggerCalculation);

export default router;
