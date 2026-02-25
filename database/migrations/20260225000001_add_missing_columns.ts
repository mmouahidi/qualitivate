import type { Knex } from 'knex';

/**
 * Migration: Add missing columns to responses and survey_distributions tables,
 * and add avatar_style to users table.
 *
 * Fixes:
 * - analytics.controller.ts references responses.metadata (jsonb)
 * - analytics.controller.ts references responses.invitation_id (FK → survey_distributions)
 * - analytics.controller.ts references survey_distributions.email (varchar)
 * - Profile avatar persistence needs users.avatar_style (varchar)
 */
export async function up(knex: Knex): Promise<void> {
    // Add missing columns to responses table
    await knex.schema.alterTable('responses', (table) => {
        table.jsonb('metadata').nullable();
        table.uuid('invitation_id')
            .nullable()
            .references('id')
            .inTable('survey_distributions')
            .onDelete('SET NULL');
        table.index('invitation_id');
    });

    // Add email column to survey_distributions (individual recipient email)
    await knex.schema.alterTable('survey_distributions', (table) => {
        table.string('email', 255).nullable();
        table.timestamp('opened_at').nullable();
        table.index('email');
    });

    // Add avatar_style column to users table
    await knex.schema.alterTable('users', (table) => {
        table.string('avatar_style', 50).nullable();
    });
}

export async function down(knex: Knex): Promise<void> {
    await knex.schema.alterTable('responses', (table) => {
        table.dropColumn('metadata');
        table.dropColumn('invitation_id');
    });

    await knex.schema.alterTable('survey_distributions', (table) => {
        table.dropColumn('email');
        table.dropColumn('opened_at');
    });

    await knex.schema.alterTable('users', (table) => {
        table.dropColumn('avatar_style');
    });
}
