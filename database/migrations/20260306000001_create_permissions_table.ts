import { Knex } from 'knex';

/**
 * Creates the permissions (features) master table for RBAC.
 * Single source of truth for every capability that can be assigned to roles.
 */
export async function up(knex: Knex): Promise<void> {
    await knex.schema.createTable('permissions', (table) => {
        table.uuid('id').primary().defaultTo(knex.fn.uuid());
        table.string('name', 100).notNullable().unique();
        table.string('resource', 50).notNullable();
        table.string('action', 50).notNullable();
        table.string('description', 255);
        table.string('permission_group', 50).notNullable();
        table.timestamp('created_at').defaultTo(knex.fn.now());
        table.index('resource');
        table.index('permission_group');
    });

    const permissions = [
        { name: 'companies:read', resource: 'companies', action: 'read', description: 'View companies', permission_group: 'Companies' },
        { name: 'companies:write', resource: 'companies', action: 'write', description: 'Create, update, delete companies', permission_group: 'Companies' },
        { name: 'sites:read', resource: 'sites', action: 'read', description: 'View sites', permission_group: 'Sites' },
        { name: 'sites:write', resource: 'sites', action: 'write', description: 'Create and delete sites', permission_group: 'Sites' },
        { name: 'sites:update', resource: 'sites', action: 'update', description: 'Edit sites', permission_group: 'Sites' },
        { name: 'departments:read', resource: 'departments', action: 'read', description: 'View departments', permission_group: 'Departments' },
        { name: 'departments:write', resource: 'departments', action: 'write', description: 'Manage departments', permission_group: 'Departments' },
        { name: 'users:read', resource: 'users', action: 'read', description: 'View users', permission_group: 'Users' },
        { name: 'users:write', resource: 'users', action: 'write', description: 'Create and edit users', permission_group: 'Users' },
        { name: 'users:delete', resource: 'users', action: 'delete', description: 'Delete users', permission_group: 'Users' },
        { name: 'surveys:read', resource: 'surveys', action: 'read', description: 'View surveys', permission_group: 'Surveys' },
        { name: 'surveys:write', resource: 'surveys', action: 'write', description: 'Create, edit, delete surveys', permission_group: 'Surveys' },
        { name: 'questions:write', resource: 'questions', action: 'write', description: 'Manage survey questions', permission_group: 'Surveys' },
        { name: 'templates:read', resource: 'templates', action: 'read', description: 'View templates', permission_group: 'Templates' },
        { name: 'templates:write', resource: 'templates', action: 'write', description: 'Create and edit templates', permission_group: 'Templates' },
        { name: 'templates:use', resource: 'templates', action: 'use', description: 'Use templates to create surveys', permission_group: 'Templates' },
        { name: 'distributions:read', resource: 'distributions', action: 'read', description: 'View and list distributions', permission_group: 'Distributions' },
        { name: 'distributions:write', resource: 'distributions', action: 'write', description: 'Create and delete distributions', permission_group: 'Distributions' },
        { name: 'analytics:read', resource: 'analytics', action: 'read', description: 'View analytics', permission_group: 'Analytics' },
        { name: 'analytics:export', resource: 'analytics', action: 'export', description: 'Export analytics (CSV/PDF)', permission_group: 'Analytics' },
        { name: 'taxonomy:read', resource: 'taxonomy', action: 'read', description: 'View taxonomy categories', permission_group: 'Taxonomy' },
        { name: 'notifications:read', resource: 'notifications', action: 'read', description: 'View and manage notifications', permission_group: 'Notifications' },
        { name: 'rbac:manage', resource: 'rbac', action: 'manage', description: 'Manage roles and permissions', permission_group: 'RBAC' },
    ];

    for (const p of permissions) {
        await knex('permissions').insert(p);
    }
}

export async function down(knex: Knex): Promise<void> {
    await knex.schema.dropTableIfExists('permissions');
}
