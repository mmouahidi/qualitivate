import { Knex } from 'knex';
import { v4 as uuidv4 } from 'uuid';

export async function seed(knex: Knex): Promise<void> {
  // Check if templates already exist
  const existingTemplates = await knex('survey_templates').where('is_global', true).count('id as count');
  if (Number(existingTemplates[0].count) > 0) {
    console.log('Global templates already exist, skipping seed.');
    return;
  }

  // ==========================================
  // 1. Employee NPS Template
  // ==========================================
  const employeeNpsId = uuidv4();
  await knex('survey_templates').insert({
    id: employeeNpsId,
    company_id: null,
    created_by: null,
    name: 'Employee NPS Survey',
    description: 'Measure employee satisfaction and loyalty with the standard Net Promoter Score methodology.',
    category: 'Employee Feedback',
    type: 'nps',
    is_global: true,
    is_anonymous: true,
    default_settings: {},
  });

  await knex('template_questions').insert([
    {
      id: uuidv4(),
      template_id: employeeNpsId,
      type: 'nps',
      content: 'How likely are you to recommend this company as a place to work to a friend or colleague?',
      options: {},
      is_required: true,
      order_index: 0,
    },
    {
      id: uuidv4(),
      template_id: employeeNpsId,
      type: 'text_long',
      content: 'What is the primary reason for your score?',
      options: {},
      is_required: true,
      order_index: 1,
    },
    {
      id: uuidv4(),
      template_id: employeeNpsId,
      type: 'text_long',
      content: 'What could we do to improve your experience at this company?',
      options: {},
      is_required: false,
      order_index: 2,
    },
  ]);

  // ==========================================
  // 2. Customer Satisfaction Template
  // ==========================================
  const customerSatId = uuidv4();
  await knex('survey_templates').insert({
    id: customerSatId,
    company_id: null,
    created_by: null,
    name: 'Customer Satisfaction Survey',
    description: 'Gather comprehensive feedback on customer satisfaction with your products or services.',
    category: 'Customer Satisfaction',
    type: 'custom',
    is_global: true,
    is_anonymous: false,
    default_settings: {},
  });

  await knex('template_questions').insert([
    {
      id: uuidv4(),
      template_id: customerSatId,
      type: 'rating_scale',
      content: 'Overall, how satisfied are you with our product/service?',
      options: { min: 1, max: 5 },
      is_required: true,
      order_index: 0,
    },
    {
      id: uuidv4(),
      template_id: customerSatId,
      type: 'multiple_choice',
      content: 'How often do you use our product/service?',
      options: { choices: ['Daily', 'Weekly', 'Monthly', 'Rarely', 'First time'] },
      is_required: true,
      order_index: 1,
    },
    {
      id: uuidv4(),
      template_id: customerSatId,
      type: 'multiple_choice',
      content: 'Which aspects of our product/service do you value the most? (Select all that apply)',
      options: {
        choices: ['Quality', 'Price', 'Customer Support', 'Ease of Use', 'Features', 'Reliability'],
        allowMultiple: true 
      },
      is_required: true,
      order_index: 2,
    },
    {
      id: uuidv4(),
      template_id: customerSatId,
      type: 'nps',
      content: 'How likely are you to recommend our product/service to others?',
      options: {},
      is_required: true,
      order_index: 3,
    },
    {
      id: uuidv4(),
      template_id: customerSatId,
      type: 'text_long',
      content: 'What improvements would you like to see in our product/service?',
      options: {},
      is_required: false,
      order_index: 4,
    },
  ]);

  // ==========================================
  // 3. Product Feedback Template
  // ==========================================
  const productFeedbackId = uuidv4();
  await knex('survey_templates').insert({
    id: productFeedbackId,
    company_id: null,
    created_by: null,
    name: 'Product Feedback Survey',
    description: 'Collect detailed feedback on product features, usability, and improvements.',
    category: 'Product Feedback',
    type: 'custom',
    is_global: true,
    is_anonymous: false,
    default_settings: {},
  });

  await knex('template_questions').insert([
    {
      id: uuidv4(),
      template_id: productFeedbackId,
      type: 'rating_scale',
      content: 'How would you rate the overall quality of the product?',
      options: { min: 1, max: 5 },
      is_required: true,
      order_index: 0,
    },
    {
      id: uuidv4(),
      template_id: productFeedbackId,
      type: 'rating_scale',
      content: 'How easy is it to use the product?',
      options: { min: 1, max: 5 },
      is_required: true,
      order_index: 1,
    },
    {
      id: uuidv4(),
      template_id: productFeedbackId,
      type: 'multiple_choice',
      content: 'Which feature do you use the most?',
      options: { choices: ['Feature A', 'Feature B', 'Feature C', 'Feature D', 'Other'] },
      is_required: true,
      order_index: 2,
    },
    {
      id: uuidv4(),
      template_id: productFeedbackId,
      type: 'text_long',
      content: 'What features would you like us to add?',
      options: {},
      is_required: false,
      order_index: 3,
    },
    {
      id: uuidv4(),
      template_id: productFeedbackId,
      type: 'text_long',
      content: 'Any bugs or issues you have encountered?',
      options: {},
      is_required: false,
      order_index: 4,
    },
  ]);

  // ==========================================
  // 4. Event Feedback Template
  // ==========================================
  const eventFeedbackId = uuidv4();
  await knex('survey_templates').insert({
    id: eventFeedbackId,
    company_id: null,
    created_by: null,
    name: 'Event Feedback Survey',
    description: 'Gather feedback from attendees after events, conferences, or webinars.',
    category: 'Event Feedback',
    type: 'custom',
    is_global: true,
    is_anonymous: true,
    default_settings: {},
  });

  await knex('template_questions').insert([
    {
      id: uuidv4(),
      template_id: eventFeedbackId,
      type: 'rating_scale',
      content: 'How would you rate the overall event?',
      options: { min: 1, max: 5 },
      is_required: true,
      order_index: 0,
    },
    {
      id: uuidv4(),
      template_id: eventFeedbackId,
      type: 'rating_scale',
      content: 'How would you rate the speakers/presenters?',
      options: { min: 1, max: 5 },
      is_required: true,
      order_index: 1,
    },
    {
      id: uuidv4(),
      template_id: eventFeedbackId,
      type: 'rating_scale',
      content: 'How would you rate the venue/platform?',
      options: { min: 1, max: 5 },
      is_required: true,
      order_index: 2,
    },
    {
      id: uuidv4(),
      template_id: eventFeedbackId,
      type: 'multiple_choice',
      content: 'Would you attend a similar event in the future?',
      options: { choices: ['Definitely Yes', 'Probably Yes', 'Not Sure', 'Probably Not', 'Definitely Not'] },
      is_required: true,
      order_index: 3,
    },
    {
      id: uuidv4(),
      template_id: eventFeedbackId,
      type: 'text_long',
      content: 'What did you like most about the event?',
      options: {},
      is_required: false,
      order_index: 4,
    },
    {
      id: uuidv4(),
      template_id: eventFeedbackId,
      type: 'text_long',
      content: 'What could be improved for future events?',
      options: {},
      is_required: false,
      order_index: 5,
    },
  ]);

  // ==========================================
  // 5. Quick NPS Template
  // ==========================================
  const quickNpsId = uuidv4();
  await knex('survey_templates').insert({
    id: quickNpsId,
    company_id: null,
    created_by: null,
    name: 'Quick NPS Survey',
    description: 'A simple 2-question NPS survey for quick feedback collection.',
    category: 'NPS',
    type: 'nps',
    is_global: true,
    is_anonymous: true,
    default_settings: {},
  });

  await knex('template_questions').insert([
    {
      id: uuidv4(),
      template_id: quickNpsId,
      type: 'nps',
      content: 'How likely are you to recommend us to a friend or colleague?',
      options: {},
      is_required: true,
      order_index: 0,
    },
    {
      id: uuidv4(),
      template_id: quickNpsId,
      type: 'text_long',
      content: 'What is the main reason for your score?',
      options: {},
      is_required: false,
      order_index: 1,
    },
  ]);

  console.log('Default survey templates seeded successfully!');
}
