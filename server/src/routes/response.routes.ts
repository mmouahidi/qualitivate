import { Router } from 'express';
import { authenticate, optionalAuthenticate } from '../middlewares/auth.middleware';
import {
  getPublicSurvey,
  startResponse,
  saveAnswer,
  submitAnswers,
  completeResponse,
  getSurveyLanguages,
  getResponseProgress,
  getSurveySettings,
  getUserSurveyStatus,
  getUserCompletedSurveys
} from '../controllers/response.controller';

const router = Router();

// Authenticated routes - for tracking user completions
router.get('/user/status', authenticate, getUserSurveyStatus);
router.get('/user/completed', authenticate, getUserCompletedSurveys);

// Public routes - optionalAuthenticate parses JWT when present (needed for private survey checks)
router.get('/survey/:surveyId/public', optionalAuthenticate, getPublicSurvey);
router.get('/survey/:surveyId/languages', getSurveyLanguages);
router.get('/survey/:surveyId/settings', getSurveySettings);
// Use optional auth to capture respondent_id if user is logged in
router.post('/survey/:surveyId/start', optionalAuthenticate, startResponse);
router.get('/:responseId/progress', getResponseProgress);
router.post('/:responseId/answer', saveAnswer);
router.post('/:responseId/submit', submitAnswers);
router.post('/:responseId/complete', completeResponse);

export default router;
