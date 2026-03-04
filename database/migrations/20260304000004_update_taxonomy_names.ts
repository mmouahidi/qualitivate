import type { Knex } from 'knex';

const CATEGORY_RENAMES: Record<string, string> = {
  'PURPOSE': 'PURPOSE, VISION & MISSION',
  'PEOPLE': 'PEOPLE & ORGANIZATION',
  'PROCESS': 'PROCESS & CONSISTENCY',
  'PROACTIVITY': 'PROACTIVITY & ADAPTABILITY',
  'HAZARD': 'HAZARD & RISK AWARENESS',
};

const DIMENSION_RENAMES: Record<string, Record<string, string>> = {
  'PURPOSE, VISION & MISSION': {
    'Business Structure': 'Business Structure, Values, and Purpose',
    'Vision': 'Vision, Strategy, and Setting Direction',
    'Leadership': 'Leadership and Messaging',
    'Metrics': 'Targets, Metrics, and Performance Measurement',
  },
  'PEOPLE & ORGANIZATION': {
    'Stakeholders': 'Stakeholders and Governance',
    'Empowerment': 'Empowerment, Teamwork, and Employee Engagement',
    'Communication': 'Communication',
    'Training': 'Training, Learning, and Learning Organization',
    'Rewards': 'Rewards, Incentives, and Recognition',
  },
  'PROCESS & CONSISTENCY': {
    'Control': 'Control, Coordination, and Consistency',
    'Systems': 'Systems and Premises',
    'Accountability': 'Accountability',
    'Documentation': 'Documentation',
  },
  'PROACTIVITY & ADAPTABILITY': {
    'Foresight': 'Foresight and Innovation',
    'Investment': 'Investment and Agility',
    'Change/Crisis': 'Change, Crisis Management, and Problem Solving',
    'Food Safety': 'Food Safety Expectations and Current State',
  },
  'HAZARD & RISK AWARENESS': {
    'Foundational Info': 'Foundational Hazard Information and Education',
    'Awareness': 'General Awareness and Verification',
  },
};

export async function up(knex: Knex): Promise<void> {
  for (const [oldName, newName] of Object.entries(CATEGORY_RENAMES)) {
    await knex('taxonomy_categories')
      .where('name', oldName)
      .update({ name: newName });
  }

  for (const [categoryName, dims] of Object.entries(DIMENSION_RENAMES)) {
    const category = await knex('taxonomy_categories')
      .where('name', categoryName)
      .first();
    if (!category) continue;

    for (const [oldDim, newDim] of Object.entries(dims)) {
      await knex('taxonomy_dimensions')
        .where({ category_id: category.id, name: oldDim })
        .update({ name: newDim });
    }
  }
}

export async function down(knex: Knex): Promise<void> {
  const REVERSE_CATEGORIES: Record<string, string> = {};
  for (const [oldName, newName] of Object.entries(CATEGORY_RENAMES)) {
    REVERSE_CATEGORIES[newName] = oldName;
  }

  for (const [newName, oldName] of Object.entries(REVERSE_CATEGORIES)) {
    const category = await knex('taxonomy_categories')
      .where('name', newName)
      .first();
    if (!category) continue;

    const dims = DIMENSION_RENAMES[newName];
    if (dims) {
      for (const [oldDim, newDim] of Object.entries(dims)) {
        await knex('taxonomy_dimensions')
          .where({ category_id: category.id, name: newDim })
          .update({ name: oldDim });
      }
    }

    await knex('taxonomy_categories')
      .where('id', category.id)
      .update({ name: oldName });
  }
}
