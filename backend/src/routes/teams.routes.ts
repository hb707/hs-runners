import { Router } from 'express';
import { create, getOne, update, listMembers, setAdmin, createCode, listCodes, deleteCode, listAll, listAllCodes } from '../controllers/teams.controller';
import { authMiddleware } from '../middleware/auth.middleware';
import { requireRole } from '../middleware/role.middleware';
import { validateBody } from '../middleware/validate.middleware';
import { createTeamSchema, updateTeamSchema, generateCodeSchema } from '../validators/team.validator';

const router = Router();

router.use(authMiddleware);

router.get('/', requireRole('master_admin'), listAll);
router.get('/codes', requireRole('master_admin'), listAllCodes);
router.post('/', requireRole('master_admin'), validateBody(createTeamSchema), create);
router.get('/:teamId', getOne);
router.patch('/:teamId', requireRole('master_admin'), validateBody(updateTeamSchema), update);
router.get('/:teamId/members', listMembers);
router.post('/:teamId/admin/:userId', requireRole('master_admin'), setAdmin);
router.post('/:teamId/invitation-codes', requireRole('master_admin'), validateBody(generateCodeSchema), createCode);
router.get('/:teamId/invitation-codes', requireRole('master_admin'), listCodes);
router.delete('/:teamId/invitation-codes/:codeId', requireRole('master_admin'), deleteCode);

export default router;
