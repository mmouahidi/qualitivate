import { Router } from 'express';
import * as surveyController from '../controllers/survey.controller';
import { saveAsTemplate } from '../controllers/template.controller';
import { authenticate, authorize } from '../middlewares/auth.middleware';
import { validate } from '../middlewares/validation.middleware';
import {
    createSurveySchema,
    updateSurveySchema,
    surveyIdSchema,
    listSurveysSchema,
    duplicateSurveySchema,
} from '../validators/survey.validator';

const router = Router();

router.get('/', authenticate, validate(listSurveysSchema), surveyController.listSurveys);
router.get('/:id', authenticate, validate(surveyIdSchema), surveyController.getSurvey);
router.post('/', authenticate, authorize('super_admin', 'company_admin', 'site_admin', 'department_admin'), validate(createSurveySchema), surveyController.createSurvey);
router.put('/:id', authenticate, authorize('super_admin', 'company_admin', 'site_admin', 'department_admin'), validate(updateSurveySchema), surveyController.updateSurvey);
router.delete('/:id', authenticate, authorize('super_admin', 'company_admin', 'site_admin', 'department_admin'), validate(surveyIdSchema), surveyController.deleteSurvey);
router.post('/:id/duplicate', authenticate, authorize('super_admin', 'company_admin', 'site_admin', 'department_admin'), validate(duplicateSurveySchema), surveyController.duplicateSurvey);
router.post('/:id/save-as-template', authenticate, authorize('super_admin', 'company_admin'), validate(surveyIdSchema), saveAsTemplate);

export default router;

