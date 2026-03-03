import { Router } from 'express';
import { authenticate, authorize } from '../middlewares/auth.middleware';
import { getPermissionsMatrix, updateRolePermissions } from '../controllers/rbac.controller';

const router = Router();

// All RBAC routes require authentication + super_admin
router.use(authenticate);

// Get full permissions matrix
router.get('/permissions', authorize('super_admin'), getPermissionsMatrix);

// Update permissions for a specific role
router.put('/permissions', authorize('super_admin'), updateRolePermissions);

export default router;
