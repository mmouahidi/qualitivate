import { Router } from 'express';
import * as userController from '../controllers/user.controller';
import { authenticate, authorize } from '../middlewares/auth.middleware';

const router = Router();

// All user routes require at least site_admin role for listing/viewing
router.get('/', authenticate, authorize('super_admin', 'company_admin', 'site_admin', 'department_admin'), userController.listUsers);
router.get('/:id', authenticate, authorize('super_admin', 'company_admin', 'site_admin', 'department_admin'), userController.getUser);
router.post('/invite', authenticate, authorize('super_admin', 'company_admin', 'site_admin', 'department_admin'), userController.inviteUser);
router.post('/bulk', authenticate, authorize('super_admin', 'company_admin', 'site_admin', 'department_admin'), userController.bulkCreateUsers);
router.put('/:id', authenticate, authorize('super_admin', 'company_admin', 'site_admin', 'department_admin'), userController.updateUser);
// Allow department_admin to delete users they invited (controller handles scope check)
router.delete('/:id', authenticate, authorize('super_admin', 'company_admin', 'site_admin'), userController.deleteUser);

export default router;
