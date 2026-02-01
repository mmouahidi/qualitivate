import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('surveys', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('company_id').notNullable().references('id').inTable('companies').onDelete('CASCADE');
    table.uuid('created_by').notNullable().references('id').inTable('users').onDelete('CASCADE');
    table.string('title', 500).notNullable();
    table.text('description');
    table.enum('type', ['nps', 'custom']).notNullable();
    table.enum('status', ['draft', 'active', 'closed']).notNullable().defaultTo('draft');
    table.boolean('is_public').defaultTo(false);
    table.boolean('is_anonymous').defaultTo(false);
    table.string('default_language', 10).defaultTo('en');
    table.jsonb('settings').defaultTo('{}');
    table.timestamp('starts_at');
    table.timestamp('ends_at');
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('updated_at').defaultTo(knex.fn.now());
    
    table.index('company_id');
    table.index('created_by');
    table.index('status');
    table.index('type');
  });

  await knex.schema.createTable('questions', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('survey_id').notNullable().references('id').inTable('surveys').onDelete('CASCADE');
    table.enum('type', ['nps', 'multiple_choice', 'text_short', 'text_long', 'rating_scale', 'matrix']).notNullable();
    table.text('content').notNullable();
    table.jsonb('options').defaultTo('{}');
    table.boolean('is_required').defaultTo(false);
    table.integer('order_index').notNullable();
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('updated_at').defaultTo(knex.fn.now());
    
    table.index('survey_id');
    table.index(['survey_id', 'order_index']);
  });

  await knex.schema.createTable('question_translations', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('question_id').notNullable().references('id').inTable('questions').onDelete('CASCADE');
    table.string('language_code', 10).notNullable();
    table.text('content').notNullable();
    table.jsonb('options').defaultTo('{}');
    table.timestamp('created_at').defaultTo(knex.fn.now());
    
    table.index('question_id');
    table.unique(['question_id', 'language_code']);
  });

  await knex.schema.createTable('survey_translations', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('survey_id').notNullable().references('id').inTable('surveys').onDelete('CASCADE');
    table.string('language_code', 10).notNullable();
    table.string('title', 500).notNullable();
    table.text('description');
    table.timestamp('created_at').defaultTo(knex.fn.now());
    
    table.index('survey_id');
    table.unique(['survey_id', 'language_code']);
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('survey_translations');
  await knex.schema.dropTableIfExists('question_translations');
  await knex.schema.dropTableIfExists('questions');
  await knex.schema.dropTableIfExists('surveys');
}
