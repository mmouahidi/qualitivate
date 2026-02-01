import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  // Create survey_templates table
  await knex.schema.createTable('survey_templates', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('company_id').references('id').inTable('companies').onDelete('CASCADE');
    table.uuid('created_by').references('id').inTable('users').onDelete('SET NULL');
    table.string('name', 255).notNullable();
    table.text('description');
    table.string('category', 100); // e.g., 'NPS', 'Customer Satisfaction', 'Employee Feedback'
    table.enum('type', ['nps', 'custom']).notNullable().defaultTo('custom');
    table.boolean('is_global').defaultTo(false); // System-wide templates
    table.boolean('is_anonymous').defaultTo(false);
    table.jsonb('default_settings').defaultTo('{}');
    table.integer('use_count').defaultTo(0); // Track popularity
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('updated_at').defaultTo(knex.fn.now());
    
    table.index('company_id');
    table.index('is_global');
    table.index('category');
  });

  // Create template_questions table
  await knex.schema.createTable('template_questions', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('template_id').notNullable().references('id').inTable('survey_templates').onDelete('CASCADE');
    table.enum('type', ['nps', 'multiple_choice', 'text_short', 'text_long', 'rating_scale', 'matrix']).notNullable();
    table.text('content').notNullable();
    table.jsonb('options').defaultTo('{}');
    table.boolean('is_required').defaultTo(false);
    table.integer('order_index').notNullable();
    table.timestamp('created_at').defaultTo(knex.fn.now());
    
    table.index('template_id');
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('template_questions');
  await knex.schema.dropTableIfExists('survey_templates');
}
