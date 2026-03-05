import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable('survey_templates', (table) => {
    table.jsonb('target_companies').defaultTo('[]');
    table.jsonb('target_roles').defaultTo('[]');
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable('survey_templates', (table) => {
    table.dropColumn('target_companies');
    table.dropColumn('target_roles');
  });
}
