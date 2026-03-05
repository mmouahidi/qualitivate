import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('respondent_metadata', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('response_id').notNullable().unique()
      .references('id').inTable('responses').onDelete('CASCADE');

    // Network & Location
    table.string('ip_address', 45);
    table.string('country', 100);
    table.string('country_code', 10);
    table.string('region', 100);
    table.string('city', 100);
    table.decimal('latitude', 10, 7);
    table.decimal('longitude', 10, 7);
    table.string('isp', 255);

    // Timezone & Language
    table.string('timezone', 100);
    table.string('language', 20);
    table.jsonb('languages').defaultTo('[]');
    table.text('accept_language');

    // Browser & Engine
    table.text('user_agent');
    table.string('browser_name', 100);
    table.string('browser_version', 50);
    table.string('engine_name', 100);
    table.string('engine_version', 50);

    // Operating System
    table.string('os_name', 100);
    table.string('os_version', 50);

    // Device
    table.string('device_type', 50);
    table.string('device_vendor', 100);
    table.string('device_model', 100);

    // Screen & Display
    table.integer('screen_width');
    table.integer('screen_height');
    table.integer('viewport_width');
    table.integer('viewport_height');
    table.decimal('pixel_ratio', 5, 2);
    table.integer('color_depth');
    table.string('orientation', 20);

    // Capabilities
    table.boolean('touch_support');
    table.boolean('cookies_enabled');
    table.boolean('do_not_track');
    table.integer('hardware_concurrency');
    table.decimal('device_memory', 6, 2);

    // Connection
    table.string('connection_type', 50);
    table.decimal('connection_downlink', 8, 2);
    table.string('connection_effective_type', 20);

    // Traffic Source
    table.text('referrer');
    table.string('utm_source', 255);
    table.string('utm_medium', 255);
    table.string('utm_campaign', 255);
    table.string('utm_term', 255);
    table.string('utm_content', 255);
    table.string('entry_url', 1000);

    // Timestamps
    table.timestamp('created_at').defaultTo(knex.fn.now());

    // Indexes for analytics queries
    table.index('response_id');
    table.index('country_code');
    table.index('device_type');
    table.index('browser_name');
    table.index('os_name');
    table.index('created_at');
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('respondent_metadata');
}
