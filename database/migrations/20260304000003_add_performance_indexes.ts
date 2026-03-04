import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable('responses', (table) => {
    table.index('started_at');
    table.index(['survey_id', 'started_at']);
  });

  await knex.schema.alterTable('refresh_tokens', (table) => {
    table.index('expires_at');
    table.index(['user_id', 'expires_at']);
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable('responses', (table) => {
    table.dropIndex(['survey_id', 'started_at']);
    table.dropIndex('started_at');
  });

  await knex.schema.alterTable('refresh_tokens', (table) => {
    table.dropIndex(['user_id', 'expires_at']);
    table.dropIndex('expires_at');
  });
}
