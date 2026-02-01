import { Router } from 'express';
import { authenticate, authorize } from '../middlewares/auth.middleware';
import {
  listTemplates,
  getTemplate,
  createTemplate,
  updateTemplate,
  deleteTemplate,
  createSurveyFromTemplate,
  saveAsTemplate,
  getTemplateCategories,
} from '../controllers/template.controller';

const router = Router();

// All routes require authentication
router.use(authenticate);

// List templates (global + company-specific)
router.get('/', listTemplates);

// Get template categories
router.get('/categories', getTemplateCategories);

// Get single template
router.get('/:id', getTemplate);

// Create template (company_admin+ only)
router.post('/', authorize('super_admin', 'company_admin'), createTemplate);

// Update template
router.put('/:id', authorize('super_admin', 'company_admin'), updateTemplate);

// Delete template
router.delete('/:id', authorize('super_admin', 'company_admin'), deleteTemplate);

// Create survey from template
router.post('/:id/create-survey', authorize('super_admin', 'company_admin', 'site_admin', 'department_admin'), createSurveyFromTemplate);

export default router;
