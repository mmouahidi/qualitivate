import { Router } from 'express';
import { authenticate } from '../middlewares/auth.middleware';
import { listIndustries, listJobPositions } from '../controllers/reference.controller';

const router = Router();

router.get('/industries', authenticate, listIndustries);
router.get('/job-positions', authenticate, listJobPositions);

export default router;
