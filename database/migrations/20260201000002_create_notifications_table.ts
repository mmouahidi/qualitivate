import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
    // Create notifications table if it doesn't exist
    const notificationsExists = await knex.schema.hasTable('notifications');
    if (!notificationsExists) {
        await knex.schema.createTable('notifications', (table) => {
            table.uuid('id').primary();
            table.uuid('user_id').notNullable().references('id').inTable('users').onDelete('CASCADE');
            table.string('type', 50).notNullable(); // survey_assigned, survey_reminder, survey_expired, system
            table.string('title', 255).notNullable();
            table.text('message');
            table.jsonb('data').defaultTo('{}'); // Additional data like surveyId, etc.
            table.boolean('is_read').defaultTo(false);
            table.timestamp('read_at');
            table.timestamp('created_at').defaultTo(knex.fn.now());

            table.index('user_id');
            table.index(['user_id', 'is_read']);
            table.index('created_at');
        });
    }

    // Add respondent_id to responses table for tracking logged-in users (if not exists)
    const hasRespondentId = await knex.schema.hasColumn('responses', 'respondent_id');
    if (!hasRespondentId) {
        await knex.schema.alterTable('responses', (table) => {
            table.uuid('respondent_id').nullable().references('id').inTable('users').onDelete('SET NULL');
            table.index('respondent_id');
        });
    }
}

export async function down(knex: Knex): Promise<void> {
    await knex.schema.alterTable('responses', (table) => {
        table.dropColumn('respondent_id');
    });

    await knex.schema.dropTableIfExists('notifications');
}
