import type { Knex } from 'knex';

/**
 * Migration: Add JSON Schema Support for SurveyJS-like Architecture
 * 
 * This migration adds:
 * 1. survey_schema JSONB column to surveys table for full JSON schema storage
 * 2. Extends question types enum to support new types
 * 3. Adds pages and panels support
 * 4. Updates templates with schema support
 */

export async function up(knex: Knex): Promise<void> {
  // Add schema column to surveys table
  await knex.schema.alterTable('surveys', (table) => {
    // Full JSON schema for the survey (SurveyJS-compatible format)
    table.jsonb('schema').nullable();
    
    // Version tracking for schema migrations
    table.string('schema_version', 20).defaultTo('1.0.0');
    
    // Quiz/scoring mode support
    table.boolean('is_quiz').defaultTo(false);
    table.jsonb('quiz_settings').defaultTo('{}');
    
    // Theme settings
    table.string('theme', 50).defaultTo('default');
    table.jsonb('theme_settings').defaultTo('{}');
  });

  // Create extended question types enum
  // Note: Keeping the original enum and adding schema-based types as a parallel system
  // The schema.pages[].elements[] will use the extended type strings directly
  
  // Add survey_pages table for explicit page management
  await knex.schema.createTable('survey_pages', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('survey_id').notNullable().references('id').inTable('surveys').onDelete('CASCADE');
    table.string('name', 255).notNullable();
    table.string('title', 500);
    table.text('description');
    table.integer('order_index').notNullable();
    table.jsonb('settings').defaultTo('{}'); // visibleIf, enableIf, etc.
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('updated_at').defaultTo(knex.fn.now());
    
    table.index('survey_id');
    table.index(['survey_id', 'order_index']);
    table.unique(['survey_id', 'name']);
  });

  // Add survey_panels table for grouping questions
  await knex.schema.createTable('survey_panels', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('survey_id').notNullable().references('id').inTable('surveys').onDelete('CASCADE');
    table.uuid('page_id').references('id').inTable('survey_pages').onDelete('CASCADE');
    table.uuid('parent_panel_id').references('id').inTable('survey_panels').onDelete('CASCADE');
    table.string('name', 255).notNullable();
    table.string('title', 500);
    table.text('description');
    table.integer('order_index').notNullable();
    table.jsonb('settings').defaultTo('{}'); // visibleIf, enableIf, innerIndent, etc.
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('updated_at').defaultTo(knex.fn.now());
    
    table.index('survey_id');
    table.index('page_id');
    table.index('parent_panel_id');
    table.unique(['survey_id', 'name']);
  });

  // Alter questions table to support new features
  await knex.schema.alterTable('questions', (table) => {
    // Link to page (optional - null means use legacy flat structure)
    table.uuid('page_id').references('id').inTable('survey_pages').onDelete('SET NULL');
    
    // Link to panel (optional - for grouping)
    table.uuid('panel_id').references('id').inTable('survey_panels').onDelete('SET NULL');
    
    // Extended type as string (allows new types without enum migration)
    table.string('extended_type', 50);
    
    // Unique name for expression references
    table.string('name', 255);
    
    // Expression-based conditions
    table.text('visible_if');
    table.text('enable_if');
    table.text('required_if');
    
    // Validators as JSONB array
    table.jsonb('validators').defaultTo('[]');
    
    // Default value
    table.jsonb('default_value');
    
    // Correct answer for quizzes
    table.jsonb('correct_answer');
    table.integer('points').defaultTo(0);
    
    table.index('page_id');
    table.index('panel_id');
    table.index('name');
  });

  // Add triggers table for survey automation
  await knex.schema.createTable('survey_triggers', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('survey_id').notNullable().references('id').inTable('surveys').onDelete('CASCADE');
    table.enum('type', ['complete', 'setvalue', 'copyvalue', 'skip', 'runexpression', 'visible']).notNullable();
    table.text('expression').notNullable(); // Condition to fire
    table.string('set_to_name', 255); // For setvalue/copyvalue
    table.jsonb('set_value'); // For setvalue
    table.string('from_name', 255); // For copyvalue
    table.string('goto_name', 255); // For skip
    table.text('run_expression'); // For runexpression
    table.integer('order_index').notNullable().defaultTo(0);
    table.timestamp('created_at').defaultTo(knex.fn.now());
    
    table.index('survey_id');
  });

  // Add calculated values table
  await knex.schema.createTable('survey_calculated_values', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('survey_id').notNullable().references('id').inTable('surveys').onDelete('CASCADE');
    table.string('name', 255).notNullable();
    table.text('expression').notNullable();
    table.boolean('include_in_result').defaultTo(false);
    table.timestamp('created_at').defaultTo(knex.fn.now());
    
    table.index('survey_id');
    table.unique(['survey_id', 'name']);
  });

  // Update template tables with schema support
  await knex.schema.alterTable('survey_templates', (table) => {
    table.jsonb('schema').nullable();
    table.string('schema_version', 20).defaultTo('1.0.0');
    table.boolean('is_quiz').defaultTo(false);
    table.string('theme', 50).defaultTo('default');
  });

  // Create choice library for reusable choice sets
  await knex.schema.createTable('choice_libraries', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('company_id').references('id').inTable('companies').onDelete('CASCADE');
    table.string('name', 255).notNullable();
    table.text('description');
    table.boolean('is_global').defaultTo(false);
    table.jsonb('choices').notNullable(); // Array of choice items
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('updated_at').defaultTo(knex.fn.now());
    
    table.index('company_id');
    table.index('is_global');
  });
}

export async function down(knex: Knex): Promise<void> {
  // Drop new tables
  await knex.schema.dropTableIfExists('choice_libraries');
  await knex.schema.dropTableIfExists('survey_calculated_values');
  await knex.schema.dropTableIfExists('survey_triggers');
  
  // Remove columns from questions
  await knex.schema.alterTable('questions', (table) => {
    table.dropColumn('page_id');
    table.dropColumn('panel_id');
    table.dropColumn('extended_type');
    table.dropColumn('name');
    table.dropColumn('visible_if');
    table.dropColumn('enable_if');
    table.dropColumn('required_if');
    table.dropColumn('validators');
    table.dropColumn('default_value');
    table.dropColumn('correct_answer');
    table.dropColumn('points');
  });

  // Drop page/panel tables (in correct order)
  await knex.schema.dropTableIfExists('survey_panels');
  await knex.schema.dropTableIfExists('survey_pages');

  // Remove columns from templates
  await knex.schema.alterTable('survey_templates', (table) => {
    table.dropColumn('schema');
    table.dropColumn('schema_version');
    table.dropColumn('is_quiz');
    table.dropColumn('theme');
  });

  // Remove columns from surveys
  await knex.schema.alterTable('surveys', (table) => {
    table.dropColumn('schema');
    table.dropColumn('schema_version');
    table.dropColumn('is_quiz');
    table.dropColumn('quiz_settings');
    table.dropColumn('theme');
    table.dropColumn('theme_settings');
  });
}
