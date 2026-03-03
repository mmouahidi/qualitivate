import { Response } from 'express';
import db from '../config/database';
import { AuthRequest } from '../middlewares/auth.middleware';
import logger from '../config/logger';
import { v4 as uuidv4 } from 'uuid';

// All available permissions in the system
const ALL_PERMISSIONS = [
    'companies:read',
    'companies:write',
    'sites:write',
    'sites:update',
    'departments:write',
    'users:read',
    'users:write',
    'users:delete',
    'surveys:write',
    'questions:write',
    'templates:write',
    'templates:use',
    'analytics:read',
    'analytics:export',
];

// Roles that can be configured (super_admin always has everything)
const CONFIGURABLE_ROLES = ['company_admin', 'site_admin', 'department_admin', 'user'];

// GET /api/rbac/permissions - Get the full permissions matrix
export const getPermissionsMatrix = async (req: AuthRequest, res: Response) => {
    try {
        const permissions = await db('role_permissions').select('role', 'permission');

        // Build matrix: { [role]: [permission1, permission2, ...] }
        const matrix: Record<string, string[]> = {};
        for (const role of CONFIGURABLE_ROLES) {
            matrix[role] = [];
        }
        for (const row of permissions) {
            if (!matrix[row.role]) matrix[row.role] = [];
            matrix[row.role].push(row.permission);
        }

        res.json({
            roles: CONFIGURABLE_ROLES,
            permissions: ALL_PERMISSIONS,
            matrix,
        });
    } catch (error: any) {
        logger.error('Error fetching permissions matrix:', { error });
        res.status(500).json({ error: 'Failed to fetch permissions matrix' });
    }
};

// PUT /api/rbac/permissions - Update permissions for a role
export const updateRolePermissions = async (req: AuthRequest, res: Response) => {
    try {
        const { role, permissions } = req.body;

        if (!role || !Array.isArray(permissions)) {
            return res.status(400).json({ error: 'role and permissions[] are required' });
        }

        if (role === 'super_admin') {
            return res.status(400).json({ error: 'super_admin permissions cannot be modified' });
        }

        if (!CONFIGURABLE_ROLES.includes(role)) {
            return res.status(400).json({ error: `Invalid role: ${role}` });
        }

        // Validate all permission names
        const invalidPerms = permissions.filter((p: string) => !ALL_PERMISSIONS.includes(p));
        if (invalidPerms.length > 0) {
            return res.status(400).json({ error: `Invalid permissions: ${invalidPerms.join(', ')}` });
        }

        const trx = await db.transaction();

        try {
            // Remove all existing permissions for this role
            await trx('role_permissions').where('role', role).delete();

            // Insert new permissions
            if (permissions.length > 0) {
                const rows = permissions.map((permission: string) => ({
                    id: uuidv4(),
                    role,
                    permission,
                }));
                await trx('role_permissions').insert(rows);
            }

            await trx.commit();

            // Invalidate the permission cache
            const { invalidatePermissionCache } = require('../middlewares/auth.middleware');
            invalidatePermissionCache();

            res.json({ message: `Permissions updated for role: ${role}`, role, permissions });
        } catch (error) {
            await trx.rollback();
            throw error;
        }
    } catch (error: any) {
        logger.error('Error updating role permissions:', { error });
        res.status(500).json({ error: 'Failed to update role permissions' });
    }
};
