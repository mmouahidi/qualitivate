import { Knex } from 'knex';

/**
 * Creates the role_permissions table for dynamic RBAC.
 * Each row maps a role to a specific permission (e.g. 'company_admin' -> 'templates:write').
 * The `super_admin` role always has all permissions (enforced in middleware, not in DB).
 */
export async function up(knex: Knex): Promise<void> {
    await knex.schema.createTable('role_permissions', (table) => {
        table.uuid('id').primary().defaultTo(knex.fn.uuid());
        table.string('role', 50).notNullable();
        table.string('permission', 100).notNullable();
        table.timestamp('created_at').defaultTo(knex.fn.now());
        table.unique(['role', 'permission']);
        table.index('role');
    });

    // Seed default permissions matching current hardcoded authorize() calls
    const defaultPermissions = [
        // Companies
        { role: 'company_admin', permission: 'companies:read' },
        { role: 'company_admin', permission: 'companies:write' },
        // Sites
        { role: 'company_admin', permission: 'sites:write' },
        { role: 'site_admin', permission: 'sites:update' },
        // Departments
        { role: 'company_admin', permission: 'departments:write' },
        { role: 'site_admin', permission: 'departments:write' },
        // Users
        { role: 'company_admin', permission: 'users:read' },
        { role: 'company_admin', permission: 'users:write' },
        { role: 'company_admin', permission: 'users:delete' },
        { role: 'site_admin', permission: 'users:read' },
        { role: 'site_admin', permission: 'users:write' },
        { role: 'site_admin', permission: 'users:delete' },
        { role: 'department_admin', permission: 'users:read' },
        { role: 'department_admin', permission: 'users:write' },
        // Surveys
        { role: 'company_admin', permission: 'surveys:write' },
        { role: 'site_admin', permission: 'surveys:write' },
        { role: 'department_admin', permission: 'surveys:write' },
        // Questions
        { role: 'company_admin', permission: 'questions:write' },
        { role: 'site_admin', permission: 'questions:write' },
        { role: 'department_admin', permission: 'questions:write' },
        // Templates
        { role: 'company_admin', permission: 'templates:write' },
        { role: 'company_admin', permission: 'templates:use' },
        { role: 'site_admin', permission: 'templates:use' },
        { role: 'department_admin', permission: 'templates:use' },
        // Analytics
        { role: 'company_admin', permission: 'analytics:read' },
        { role: 'company_admin', permission: 'analytics:export' },
        { role: 'site_admin', permission: 'analytics:read' },
        { role: 'site_admin', permission: 'analytics:export' },
        { role: 'department_admin', permission: 'analytics:read' },
    ];

    // Add uuid for each row
    const rows = defaultPermissions.map((p) => ({
        id: knex.fn.uuid(),
        ...p,
    }));

    await knex('role_permissions').insert(rows);
}

export async function down(knex: Knex): Promise<void> {
    await knex.schema.dropTableIfExists('role_permissions');
}
