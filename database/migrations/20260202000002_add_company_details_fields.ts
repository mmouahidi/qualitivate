import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable('companies', (table) => {
    table.string('activity', 255);
    table.string('address', 500);
    table.string('city', 255);
    table.integer('sites_count').defaultTo(0);
    table.integer('employees_count').defaultTo(0);
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable('companies', (table) => {
    table.dropColumn('activity');
    table.dropColumn('address');
    table.dropColumn('city');
    table.dropColumn('sites_count');
    table.dropColumn('employees_count');
  });
}
