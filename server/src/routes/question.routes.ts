import { Router } from 'express';
import * as questionController from '../controllers/question.controller';
import { authenticate, authorize } from '../middlewares/auth.middleware';

const router = Router();

router.get('/survey/:surveyId', authenticate, questionController.listQuestions);
router.post('/survey/:surveyId', authenticate, authorize('super_admin', 'company_admin', 'site_admin', 'department_admin'), questionController.createQuestion);
router.put('/:id', authenticate, authorize('super_admin', 'company_admin', 'site_admin', 'department_admin'), questionController.updateQuestion);
router.delete('/:id', authenticate, authorize('super_admin', 'company_admin', 'site_admin', 'department_admin'), questionController.deleteQuestion);
router.post('/survey/:surveyId/reorder', authenticate, authorize('super_admin', 'company_admin', 'site_admin', 'department_admin'), questionController.reorderQuestions);
router.get('/:id/translations', authenticate, questionController.getTranslations);
router.post('/:id/translations', authenticate, authorize('super_admin', 'company_admin', 'site_admin', 'department_admin'), questionController.createTranslation);

export default router;
