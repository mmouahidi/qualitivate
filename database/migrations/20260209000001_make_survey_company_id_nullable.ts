
import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
    await knex.schema.alterTable('surveys', (table) => {
        table.uuid('company_id').nullable().alter();
    });
}

export async function down(knex: Knex): Promise<void> {
    // We can't easily revert this without knowing which records have null company_id
    // and what to set them to. Usually down migrations for altering nullability 
    // are tricky if data was inserted. For now, we will just set it back to notNullable 
    // assuming no bad data exists, or we leave it. 
    // Ideally we would delete global surveys or assign them to a default company.
    // For safety, let's just try to set it back, it will fail if nulls exist.
    await knex.schema.alterTable('surveys', (table) => {
        table.uuid('company_id').notNullable().alter();
    });
}
