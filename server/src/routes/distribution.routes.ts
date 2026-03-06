import { Router } from 'express';
import { authenticate, authorize } from '../middlewares/auth.middleware';
import {
  listDistributions,
  createLinkDistribution,
  createQRDistribution,
  createEmbedDistribution,
  createEmailDistribution,
  sendToGroup,
  getDistributionStats,
  deleteDistribution
} from '../controllers/distribution.controller';

const router = Router();

// All routes require authentication
router.use(authenticate);

// List distributions for a survey
router.get('/survey/:surveyId', authorize('super_admin', 'distributions:read'), listDistributions);

// Create different distribution types
router.post('/survey/:surveyId/link', authorize('super_admin', 'distributions:write'), createLinkDistribution);
router.post('/survey/:surveyId/qr', authorize('super_admin', 'distributions:write'), createQRDistribution);
router.post('/survey/:surveyId/embed', authorize('super_admin', 'distributions:write'), createEmbedDistribution);
router.post('/survey/:surveyId/email', authorize('super_admin', 'distributions:write'), createEmailDistribution);
router.post('/survey/:surveyId/group', authorize('super_admin', 'distributions:write'), sendToGroup);

// Distribution stats and management
router.get('/:distributionId/stats', authorize('super_admin', 'distributions:read'), getDistributionStats);
router.delete('/:distributionId', authorize('super_admin', 'distributions:write'), deleteDistribution);

export default router;
