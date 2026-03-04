import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
    await knex.schema.alterTable('surveys', (table) => {
        table.jsonb('notification_emails').defaultTo('[]');
    });
}

export async function down(knex: Knex): Promise<void> {
    await knex.schema.alterTable('surveys', (table) => {
        table.dropColumn('notification_emails');
    });
}
