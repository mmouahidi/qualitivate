import { Router } from 'express';
import { authenticate } from '../middlewares/auth.middleware';
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
router.get('/survey/:surveyId', listDistributions);

// Create different distribution types
router.post('/survey/:surveyId/link', createLinkDistribution);
router.post('/survey/:surveyId/qr', createQRDistribution);
router.post('/survey/:surveyId/embed', createEmbedDistribution);
router.post('/survey/:surveyId/email', createEmailDistribution);
router.post('/survey/:surveyId/group', sendToGroup);

// Distribution stats and management
router.get('/:distributionId/stats', getDistributionStats);
router.delete('/:distributionId', deleteDistribution);

export default router;
