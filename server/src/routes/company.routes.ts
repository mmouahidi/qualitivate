import { Router } from 'express';
import * as companyController from '../controllers/company.controller';
import { authenticate, authorize } from '../middlewares/auth.middleware';

const router = Router();

router.get('/', authenticate, companyController.listCompanies);
router.get('/:id', authenticate, companyController.getCompany);
router.post('/', authenticate, authorize('super_admin'), companyController.createCompany);
router.put('/:id', authenticate, authorize('super_admin', 'company_admin'), companyController.updateCompany);
router.delete('/:id', authenticate, authorize('super_admin'), companyController.deleteCompany);

export default router;
