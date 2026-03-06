import { Knex } from 'knex';

/**
 * Seeds role_permissions for new permissions (distributions, taxonomy, notifications, read permissions).
 * Existing role_permissions from 20260303000001 are unchanged.
 */
export async function up(knex: Knex): Promise<void> {
    const newRolePermissions = [
        // Distributions
        { role: 'company_admin', permission: 'distributions:read' },
        { role: 'company_admin', permission: 'distributions:write' },
        { role: 'site_admin', permission: 'distributions:read' },
        { role: 'site_admin', permission: 'distributions:write' },
        { role: 'department_admin', permission: 'distributions:read' },
        { role: 'department_admin', permission: 'distributions:write' },
        // Taxonomy
        { role: 'company_admin', permission: 'taxonomy:read' },
        { role: 'site_admin', permission: 'taxonomy:read' },
        { role: 'department_admin', permission: 'taxonomy:read' },
        // Notifications (all authenticated roles that have UI)
        { role: 'company_admin', permission: 'notifications:read' },
        { role: 'site_admin', permission: 'notifications:read' },
        { role: 'department_admin', permission: 'notifications:read' },
        { role: 'user', permission: 'notifications:read' },
        // Read permissions (optional, for list/get)
        { role: 'company_admin', permission: 'surveys:read' },
        { role: 'company_admin', permission: 'sites:read' },
        { role: 'company_admin', permission: 'departments:read' },
        { role: 'company_admin', permission: 'templates:read' },
        { role: 'site_admin', permission: 'surveys:read' },
        { role: 'site_admin', permission: 'sites:read' },
        { role: 'site_admin', permission: 'departments:read' },
        { role: 'site_admin', permission: 'templates:read' },
        { role: 'department_admin', permission: 'surveys:read' },
        { role: 'department_admin', permission: 'sites:read' },
        { role: 'department_admin', permission: 'departments:read' },
        { role: 'department_admin', permission: 'templates:read' },
    ];

    for (const row of newRolePermissions) {
        await knex('role_permissions').insert(row);
    }
}

export async function down(knex: Knex): Promise<void> {
    const permissionsToRemove = [
        'distributions:read',
        'distributions:write',
        'taxonomy:read',
        'notifications:read',
        'surveys:read',
        'sites:read',
        'departments:read',
        'templates:read',
    ];
    await knex('role_permissions').whereIn('permission', permissionsToRemove).delete();
}
