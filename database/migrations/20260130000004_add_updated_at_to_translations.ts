import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  // Add updated_at column to question_translations table
  await knex.schema.alterTable('question_translations', (table) => {
    table.timestamp('updated_at').defaultTo(knex.fn.now());
  });

  // Add updated_at column to survey_translations table
  await knex.schema.alterTable('survey_translations', (table) => {
    table.timestamp('updated_at').defaultTo(knex.fn.now());
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable('question_translations', (table) => {
    table.dropColumn('updated_at');
  });

  await knex.schema.alterTable('survey_translations', (table) => {
    table.dropColumn('updated_at');
  });
}
