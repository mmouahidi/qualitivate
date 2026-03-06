import { Router } from 'express';
import { authenticate, authorize } from '../middlewares/auth.middleware';
import { getRoles, getPermissionsMatrix, updateRolePermissions } from '../controllers/rbac.controller';

const router = Router();

// All RBAC routes require authentication + super_admin
router.use(authenticate);

// List roles with metadata (for Roles management page)
router.get('/roles', authorize('super_admin'), getRoles);

// Get full permissions matrix
router.get('/permissions', authorize('super_admin'), getPermissionsMatrix);

// Update permissions for a specific role
router.put('/permissions', authorize('super_admin'), updateRolePermissions);

export default router;
