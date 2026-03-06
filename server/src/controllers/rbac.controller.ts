import { Response } from 'express';
import db from '../config/database';
import { AuthRequest, invalidatePermissionCache } from '../middlewares/auth.middleware';
import logger from '../config/logger';
import { v4 as uuidv4 } from 'uuid';

// Roles that can be configured (super_admin always has everything)
const CONFIGURABLE_ROLES = ['company_admin', 'site_admin', 'department_admin', 'user'];

// Role metadata for the Roles management page
const ROLE_META: Record<string, { label: string; description: string }> = {
    super_admin: {
        label: 'Super Admin',
        description: 'Full platform access. Manages companies, roles, and permissions. Cannot be modified.',
    },
    company_admin: {
        label: 'Company Admin',
        description: 'Manages a single company: sites, departments, users, surveys, templates, and analytics.',
    },
    site_admin: {
        label: 'Site Admin',
        description: 'Manages a single site: departments, users, surveys, and analytics within that site.',
    },
    department_admin: {
        label: 'Department Admin',
        description: 'Manages a single department: users, surveys, and analytics within that department.',
    },
    user: {
        label: 'User',
        description: 'Basic access: view assigned content, respond to surveys, and receive notifications.',
    },
};

// GET /api/rbac/roles - List roles with metadata (for Roles management page)
export const getRoles = async (req: AuthRequest, res: Response) => {
    try {
        const roles = ['super_admin', ...CONFIGURABLE_ROLES].map((role) => ({
            id: role,
            name: role,
            label: ROLE_META[role]?.label || role,
            description: ROLE_META[role]?.description || '',
            configurable: role !== 'super_admin',
        }));
        res.json({ roles });
    } catch (error: any) {
        logger.error('Error fetching roles:', { error });
        res.status(500).json({ error: 'Failed to fetch roles' });
    }
};

// Fallback permission list when permissions table does not exist yet
const FALLBACK_PERMISSION_DETAILS = [
    { name: 'companies:read', resource: 'companies', action: 'read', description: 'View companies', permission_group: 'Companies' },
    { name: 'companies:write', resource: 'companies', action: 'write', description: 'Manage companies', permission_group: 'Companies' },
    { name: 'sites:read', resource: 'sites', action: 'read', description: 'View sites', permission_group: 'Sites' },
    { name: 'sites:write', resource: 'sites', action: 'write', description: 'Create/delete sites', permission_group: 'Sites' },
    { name: 'sites:update', resource: 'sites', action: 'update', description: 'Edit sites', permission_group: 'Sites' },
    { name: 'departments:read', resource: 'departments', action: 'read', description: 'View departments', permission_group: 'Departments' },
    { name: 'departments:write', resource: 'departments', action: 'write', description: 'Manage departments', permission_group: 'Departments' },
    { name: 'users:read', resource: 'users', action: 'read', description: 'View users', permission_group: 'Users' },
    { name: 'users:write', resource: 'users', action: 'write', description: 'Create/edit users', permission_group: 'Users' },
    { name: 'users:delete', resource: 'users', action: 'delete', description: 'Delete users', permission_group: 'Users' },
    { name: 'surveys:read', resource: 'surveys', action: 'read', description: 'View surveys', permission_group: 'Surveys' },
    { name: 'surveys:write', resource: 'surveys', action: 'write', description: 'Manage surveys', permission_group: 'Surveys' },
    { name: 'questions:write', resource: 'questions', action: 'write', description: 'Manage questions', permission_group: 'Surveys' },
    { name: 'templates:read', resource: 'templates', action: 'read', description: 'View templates', permission_group: 'Templates' },
    { name: 'templates:write', resource: 'templates', action: 'write', description: 'Create/edit templates', permission_group: 'Templates' },
    { name: 'templates:use', resource: 'templates', action: 'use', description: 'Use templates', permission_group: 'Templates' },
    { name: 'distributions:read', resource: 'distributions', action: 'read', description: 'View distributions', permission_group: 'Distributions' },
    { name: 'distributions:write', resource: 'distributions', action: 'write', description: 'Manage distributions', permission_group: 'Distributions' },
    { name: 'analytics:read', resource: 'analytics', action: 'read', description: 'View analytics', permission_group: 'Analytics' },
    { name: 'analytics:export', resource: 'analytics', action: 'export', description: 'Export analytics', permission_group: 'Analytics' },
    { name: 'taxonomy:read', resource: 'taxonomy', action: 'read', description: 'View taxonomy', permission_group: 'Taxonomy' },
    { name: 'notifications:read', resource: 'notifications', action: 'read', description: 'View notifications', permission_group: 'Notifications' },
    { name: 'rbac:manage', resource: 'rbac', action: 'manage', description: 'Manage roles and permissions', permission_group: 'RBAC' },
];

// GET /api/rbac/permissions - Get the full permissions matrix (permissions from DB or fallback)
export const getPermissionsMatrix = async (req: AuthRequest, res: Response) => {
    try {
        let permissionRows: Array<{ name: string; resource: string; action: string; description: string | null; permission_group: string }>;
        try {
            permissionRows = await db('permissions')
                .select('name', 'resource', 'action', 'description', 'permission_group')
                .orderBy('permission_group')
                .orderBy('name');
            if (permissionRows.length === 0) {
                permissionRows = FALLBACK_PERMISSION_DETAILS;
            }
        } catch {
            permissionRows = FALLBACK_PERMISSION_DETAILS;
        }
        const allPermissions = permissionRows.map((p) => p.name);

        const rolePermRows = await db('role_permissions').select('role', 'permission');

        const matrixMap: Record<string, string[]> = {};
        for (const role of CONFIGURABLE_ROLES) {
            matrixMap[role] = [];
        }
        for (const row of rolePermRows) {
            if (!matrixMap[row.role]) matrixMap[row.role] = [];
            matrixMap[row.role].push(row.permission);
        }

        // Use array format to avoid camelCaseResponse middleware
        // transforming role-name keys (e.g. company_admin -> companyAdmin)
        const rolePermissions = CONFIGURABLE_ROLES.map(role => ({
            role,
            permissions: matrixMap[role],
        }));

        res.json({
            roles: CONFIGURABLE_ROLES,
            permissions: allPermissions,
            permissionDetails: permissionRows,
            rolePermissions,
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

        // Validate permission names against permissions table (fallback to any if table missing)
        let validNames: string[] = [];
        try {
            const rows = await db('permissions').select('name');
            validNames = rows.map((r: { name: string }) => r.name);
        } catch {
            // Table may not exist yet; allow any permission string
            validNames = permissions as string[];
        }
        if (validNames.length > 0) {
            const invalidPerms = permissions.filter((p: string) => !validNames.includes(p));
            if (invalidPerms.length > 0) {
                return res.status(400).json({ error: `Invalid permissions: ${invalidPerms.join(', ')}` });
            }
        }

        await db.transaction(async (trx) => {
            await trx('role_permissions').where('role', role).delete();

            if (permissions.length > 0) {
                const rows = permissions.map((permission: string) => ({
                    id: uuidv4(),
                    role,
                    permission,
                }));
                await trx('role_permissions').insert(rows);
            }
        });

        invalidatePermissionCache();

        res.json({ message: `Permissions updated for role: ${role}`, role, permissions });
    } catch (error: any) {
        logger.error('Error updating role permissions:', { error });
        res.status(500).json({ error: 'Failed to update role permissions' });
    }
};
