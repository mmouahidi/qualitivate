import type { Knex } from 'knex';
import { v4 as uuidv4 } from 'uuid';

export async function up(knex: Knex): Promise<void> {
    // Create taxonomy tables
    await knex.schema.createTable('taxonomy_categories', (table) => {
        table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
        table.string('name', 100).notNullable().unique();
        table.integer('order_index').notNullable();
        table.timestamp('created_at').defaultTo(knex.fn.now());
    });

    await knex.schema.createTable('taxonomy_dimensions', (table) => {
        table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
        table.uuid('category_id').notNullable().references('id').inTable('taxonomy_categories').onDelete('CASCADE');
        table.string('name', 150).notNullable();
        table.integer('order_index').notNullable();
        table.timestamp('created_at').defaultTo(knex.fn.now());

        table.unique(['category_id', 'name']);
        table.index('category_id');
    });

    // Add taxonomy columns to questions
    await knex.schema.alterTable('questions', (table) => {
        table.uuid('category_id').references('id').inTable('taxonomy_categories').onDelete('SET NULL');
        table.uuid('dimension_id').references('id').inTable('taxonomy_dimensions').onDelete('SET NULL');
    });

    // Seed taxonomy data
    const categories = [
        { id: uuidv4(), name: 'PURPOSE, VISION & MISSION', order_index: 1 },
        { id: uuidv4(), name: 'PEOPLE & ORGANIZATION', order_index: 2 },
        { id: uuidv4(), name: 'PROCESS & CONSISTENCY', order_index: 3 },
        { id: uuidv4(), name: 'PROACTIVITY & ADAPTABILITY', order_index: 4 },
        { id: uuidv4(), name: 'HAZARD & RISK AWARENESS', order_index: 5 },
    ];

    await knex('taxonomy_categories').insert(categories);

    const dimensionsByCategory: Record<string, string[]> = {
        'PURPOSE, VISION & MISSION': [
            'Business Structure, Values, and Purpose',
            'Vision, Strategy, and Setting Direction',
            'Leadership and Messaging',
            'Targets, Metrics, and Performance Measurement',
        ],
        'PEOPLE & ORGANIZATION': [
            'Stakeholders and Governance',
            'Empowerment, Teamwork, and Employee Engagement',
            'Communication',
            'Training, Learning, and Learning Organization',
            'Rewards, Incentives, and Recognition',
        ],
        'PROCESS & CONSISTENCY': [
            'Control, Coordination, and Consistency',
            'Systems and Premises',
            'Accountability',
            'Documentation',
        ],
        'PROACTIVITY & ADAPTABILITY': [
            'Foresight and Innovation',
            'Investment and Agility',
            'Change, Crisis Management, and Problem Solving',
            'Food Safety Expectations and Current State',
        ],
        'HAZARD & RISK AWARENESS': [
            'Foundational Hazard Information and Education',
            'General Awareness and Verification',
        ],
    };

    const dimensions: Array<{ id: string; category_id: string; name: string; order_index: number }> = [];

    for (const cat of categories) {
        const dims = dimensionsByCategory[cat.name] || [];
        dims.forEach((dimName, idx) => {
            dimensions.push({
                id: uuidv4(),
                category_id: cat.id,
                name: dimName,
                order_index: idx + 1,
            });
        });
    }

    if (dimensions.length > 0) {
        await knex('taxonomy_dimensions').insert(dimensions);
    }
}

export async function down(knex: Knex): Promise<void> {
    await knex.schema.alterTable('questions', (table) => {
        table.dropColumn('category_id');
        table.dropColumn('dimension_id');
    });
    await knex.schema.dropTableIfExists('taxonomy_dimensions');
    await knex.schema.dropTableIfExists('taxonomy_categories');
}
