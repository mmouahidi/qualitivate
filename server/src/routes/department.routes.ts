import { Router } from 'express';
import * as departmentController from '../controllers/department.controller';
import { authenticate, authorize } from '../middlewares/auth.middleware';

const router = Router();

router.get('/', authenticate, departmentController.listDepartments);
router.get('/:id', authenticate, departmentController.getDepartment);
router.post('/', authenticate, authorize('super_admin', 'company_admin', 'site_admin'), departmentController.createDepartment);
router.put('/:id', authenticate, authorize('super_admin', 'company_admin', 'site_admin'), departmentController.updateDepartment);
router.delete('/:id', authenticate, authorize('super_admin', 'company_admin', 'site_admin'), departmentController.deleteDepartment);

export default router;
