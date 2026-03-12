import { Router } from 'express';
import { analyzeImage, create, listTeamRecords, listMyRecords, getOne, updateDistance, remove } from '../controllers/records.controller';
import { authMiddleware } from '../middleware/auth.middleware';
import { requireRole, requireTeamMember } from '../middleware/role.middleware';
import { validateBody } from '../middleware/validate.middleware';
import { updateDistanceSchema, createRecordSchema } from '../validators/record.validator';
import { uploadMiddleware } from '../config/multer';

const router = Router();

router.use(authMiddleware);

router.post('/analyze', requireTeamMember, uploadMiddleware.single('image'), analyzeImage);
router.post('/', requireTeamMember, validateBody(createRecordSchema), create);
router.get('/team', requireTeamMember, listTeamRecords);
router.get('/me', listMyRecords);
router.get('/:recordId', requireTeamMember, getOne);
router.patch('/:recordId/distance', requireRole('team_admin', 'master_admin'), validateBody(updateDistanceSchema), updateDistance);
router.delete('/:recordId', remove);

export default router;
