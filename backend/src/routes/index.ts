import { Router } from 'express';
import authRoutes from './auth.routes';
import usersRoutes from './users.routes';
import teamsRoutes from './teams.routes';
import recordsRoutes from './records.routes';
import finesRoutes from './fines.routes';
import statsRoutes from './stats.routes';

const router = Router();

router.use('/auth', authRoutes);
router.use('/users', usersRoutes);
router.use('/teams', teamsRoutes);
router.use('/records', recordsRoutes);
router.use('/fines', finesRoutes);
router.use('/stats', statsRoutes);

export default router;
