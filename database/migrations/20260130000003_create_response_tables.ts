import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('survey_distributions', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('survey_id').notNullable().references('id').inTable('surveys').onDelete('CASCADE');
    table.enum('channel', ['email', 'link', 'qr_code', 'embed']).notNullable();
    table.string('target_url', 1000);
    table.text('qr_code_url');
    table.jsonb('email_list').defaultTo('[]');
    table.timestamp('sent_at');
    table.timestamp('created_at').defaultTo(knex.fn.now());
    
    table.index('survey_id');
  });

  await knex.schema.createTable('responses', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('survey_id').notNullable().references('id').inTable('surveys').onDelete('CASCADE');
    table.uuid('respondent_id').references('id').inTable('users').onDelete('SET NULL');
    table.string('anonymous_token', 255);
    table.string('ip_address', 45);
    table.string('language_used', 10);
    table.enum('status', ['started', 'completed', 'abandoned']).notNullable().defaultTo('started');
    table.timestamp('started_at').defaultTo(knex.fn.now());
    table.timestamp('completed_at');
    table.timestamp('created_at').defaultTo(knex.fn.now());
    
    table.index('survey_id');
    table.index('respondent_id');
    table.index('anonymous_token');
    table.index('status');
  });

  await knex.schema.createTable('answers', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('response_id').notNullable().references('id').inTable('responses').onDelete('CASCADE');
    table.uuid('question_id').notNullable().references('id').inTable('questions').onDelete('CASCADE');
    table.jsonb('value').notNullable();
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('updated_at').defaultTo(knex.fn.now());
    
    table.index('response_id');
    table.index('question_id');
    table.unique(['response_id', 'question_id']);
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('answers');
  await knex.schema.dropTableIfExists('responses');
  await knex.schema.dropTableIfExists('survey_distributions');
}
