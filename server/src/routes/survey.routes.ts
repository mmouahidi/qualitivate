import { Router } from 'express';
import * as surveyController from '../controllers/survey.controller';
import { saveAsTemplate } from '../controllers/template.controller';
import { authenticate, authorize } from '../middlewares/auth.middleware';

const router = Router();

router.get('/', authenticate, surveyController.listSurveys);
router.get('/:id', authenticate, surveyController.getSurvey);
router.post('/', authenticate, authorize('super_admin', 'company_admin', 'site_admin', 'department_admin'), surveyController.createSurvey);
router.put('/:id', authenticate, authorize('super_admin', 'company_admin', 'site_admin', 'department_admin'), surveyController.updateSurvey);
router.delete('/:id', authenticate, authorize('super_admin', 'company_admin', 'site_admin', 'department_admin'), surveyController.deleteSurvey);
router.post('/:id/duplicate', authenticate, authorize('super_admin', 'company_admin', 'site_admin', 'department_admin'), surveyController.duplicateSurvey);
router.post('/:id/save-as-template', authenticate, authorize('super_admin', 'company_admin'), saveAsTemplate);

export default router;
