import { Router } from 'express';
import { authenticate, authorize } from '../middlewares/auth.middleware';
import {
  getSurveyAnalytics,
  getQuestionAnalytics,
  getResponses,
  getResponseDetails,
  exportResponses,
  getCompanyAnalytics,
  getRoleDashboard
} from '../controllers/analytics.controller';

const router = Router();

// All analytics routes require authentication
router.use(authenticate);

// Role-specific dashboard (available to all authenticated users)
router.get('/my-dashboard', getRoleDashboard);

// Company-wide analytics dashboard
router.get(
  '/company',
  authorize('super_admin', 'company_admin', 'site_admin'),
  getCompanyAnalytics
);

// Survey-specific analytics
router.get(
  '/surveys/:surveyId',
  authorize('super_admin', 'company_admin', 'site_admin', 'department_admin'),
  getSurveyAnalytics
);

// Question-level analytics for a survey
router.get(
  '/surveys/:surveyId/questions',
  authorize('super_admin', 'company_admin', 'site_admin', 'department_admin'),
  getQuestionAnalytics
);

// Get list of responses for a survey
router.get(
  '/surveys/:surveyId/responses',
  authorize('super_admin', 'company_admin', 'site_admin', 'department_admin'),
  getResponses
);

// Get single response details
router.get(
  '/responses/:responseId',
  authorize('super_admin', 'company_admin', 'site_admin', 'department_admin'),
  getResponseDetails
);

// Export responses
router.get(
  '/surveys/:surveyId/export',
  authorize('super_admin', 'company_admin', 'site_admin'),
  exportResponses
);

export default router;
