import { Knex } from 'knex';
import { v4 as uuidv4 } from 'uuid';

export async function up(knex: Knex): Promise<void> {
  // Check if template already exists
  const existing = await knex('survey_templates')
    .where('name', 'BRCGS Quality Culture Survey')
    .first();

  if (existing) {
    console.log('BRCGS Quality Culture Survey template already exists, skipping.');
    return;
  }

  // Create the BRCGS Quality Culture Survey Template
  const templateId = uuidv4();

  await knex('survey_templates').insert({
    id: templateId,
    company_id: null,
    created_by: null,
    name: 'BRCGS Quality Culture Survey',
    description: 'Assess your organization\'s quality culture in alignment with BRCGS Global Standards. Evaluates leadership commitment, employee engagement, risk management, continuous improvement, documentation, and supplier/customer focus. Contains 6 sections with 30 rating questions and 2 open-ended questions. Scoring: 1 (Strongly Disagree) to 5 (Strongly Agree). Maximum Score: 150 points.',
    category: 'Quality & Compliance',
    type: 'custom',
    is_global: true,
    is_anonymous: true,
    default_settings: JSON.stringify({
      showProgressBar: true,
      allowBackNavigation: true,
      showSectionScores: true,
      sections: [
        { name: 'Leadership Commitment', questionRange: [1, 5], description: 'Assesses senior management commitment to food safety and quality.' },
        { name: 'Employee Engagement', questionRange: [6, 10], description: 'Evaluates employee involvement and awareness of quality requirements.' },
        { name: 'Risk Management', questionRange: [11, 15], description: 'Assesses the organization\'s approach to identifying and managing risks.' },
        { name: 'Continuous Improvement', questionRange: [16, 20], description: 'Evaluates the organization\'s commitment to ongoing improvement.' },
        { name: 'Documentation & Compliance', questionRange: [21, 25], description: 'Assesses documentation practices and regulatory compliance.' },
        { name: 'Supplier & Customer Focus', questionRange: [26, 30], description: 'Evaluates supplier management and customer satisfaction practices.' }
      ],
      ratingLabels: {
        1: 'Strongly Disagree - Not implemented at all',
        2: 'Disagree - Rarely implemented',
        3: 'Neutral - Partially implemented',
        4: 'Agree - Mostly implemented with minor gaps',
        5: 'Strongly Agree - Fully implemented and consistently applied'
      }
    }),
  });

  // Create questions - Section 1: Leadership Commitment (Q1-5)
  const questions = [
    {
      id: uuidv4(),
      template_id: templateId,
      type: 'rating_scale',
      content: 'Senior management visibly demonstrates commitment to food safety and quality.',
      options: JSON.stringify({ 
        min: 1, 
        max: 5,
        section: 'Leadership Commitment',
        labels: {
          1: 'Strongly Disagree',
          2: 'Disagree',
          3: 'Neutral',
          4: 'Agree',
          5: 'Strongly Agree'
        }
      }),
      is_required: true,
      order_index: 0,
    },
    {
      id: uuidv4(),
      template_id: templateId,
      type: 'rating_scale',
      content: 'Adequate resources (personnel, equipment, training) are provided to maintain quality standards.',
      options: JSON.stringify({ min: 1, max: 5, section: 'Leadership Commitment' }),
      is_required: true,
      order_index: 1,
    },
    {
      id: uuidv4(),
      template_id: templateId,
      type: 'rating_scale',
      content: 'Quality objectives are established, communicated, and reviewed regularly.',
      options: JSON.stringify({ min: 1, max: 5, section: 'Leadership Commitment' }),
      is_required: true,
      order_index: 2,
    },
    {
      id: uuidv4(),
      template_id: templateId,
      type: 'rating_scale',
      content: 'Management actively participates in quality improvement initiatives.',
      options: JSON.stringify({ min: 1, max: 5, section: 'Leadership Commitment' }),
      is_required: true,
      order_index: 3,
    },
    {
      id: uuidv4(),
      template_id: templateId,
      type: 'rating_scale',
      content: 'Food safety and quality are prioritized over production targets.',
      options: JSON.stringify({ min: 1, max: 5, section: 'Leadership Commitment' }),
      is_required: true,
      order_index: 4,
    },

    // Section 2: Employee Engagement (Q6-10)
    {
      id: uuidv4(),
      template_id: templateId,
      type: 'rating_scale',
      content: 'All employees understand their role in maintaining food safety and quality.',
      options: JSON.stringify({ min: 1, max: 5, section: 'Employee Engagement' }),
      is_required: true,
      order_index: 5,
    },
    {
      id: uuidv4(),
      template_id: templateId,
      type: 'rating_scale',
      content: 'Employees feel empowered to stop production when quality issues are identified.',
      options: JSON.stringify({ min: 1, max: 5, section: 'Employee Engagement' }),
      is_required: true,
      order_index: 6,
    },
    {
      id: uuidv4(),
      template_id: templateId,
      type: 'rating_scale',
      content: 'Regular training on quality and food safety is provided to all staff.',
      options: JSON.stringify({ min: 1, max: 5, section: 'Employee Engagement' }),
      is_required: true,
      order_index: 7,
    },
    {
      id: uuidv4(),
      template_id: templateId,
      type: 'rating_scale',
      content: 'Employees are encouraged to report quality concerns without fear of retribution.',
      options: JSON.stringify({ min: 1, max: 5, section: 'Employee Engagement' }),
      is_required: true,
      order_index: 8,
    },
    {
      id: uuidv4(),
      template_id: templateId,
      type: 'rating_scale',
      content: 'Recognition and rewards are given for quality improvements and suggestions.',
      options: JSON.stringify({ min: 1, max: 5, section: 'Employee Engagement' }),
      is_required: true,
      order_index: 9,
    },

    // Section 3: Risk Management (Q11-15)
    {
      id: uuidv4(),
      template_id: templateId,
      type: 'rating_scale',
      content: 'HACCP principles are effectively implemented and maintained.',
      options: JSON.stringify({ min: 1, max: 5, section: 'Risk Management' }),
      is_required: true,
      order_index: 10,
    },
    {
      id: uuidv4(),
      template_id: templateId,
      type: 'rating_scale',
      content: 'Risk assessments are conducted regularly and reviewed when changes occur.',
      options: JSON.stringify({ min: 1, max: 5, section: 'Risk Management' }),
      is_required: true,
      order_index: 11,
    },
    {
      id: uuidv4(),
      template_id: templateId,
      type: 'rating_scale',
      content: 'Preventive controls are in place for identified hazards.',
      options: JSON.stringify({ min: 1, max: 5, section: 'Risk Management' }),
      is_required: true,
      order_index: 12,
    },
    {
      id: uuidv4(),
      template_id: templateId,
      type: 'rating_scale',
      content: 'Documented procedures exist for managing food safety incidents.',
      options: JSON.stringify({ min: 1, max: 5, section: 'Risk Management' }),
      is_required: true,
      order_index: 13,
    },
    {
      id: uuidv4(),
      template_id: templateId,
      type: 'rating_scale',
      content: 'Root cause analysis is performed for all significant quality deviations.',
      options: JSON.stringify({ min: 1, max: 5, section: 'Risk Management' }),
      is_required: true,
      order_index: 14,
    },

    // Section 4: Continuous Improvement (Q16-20)
    {
      id: uuidv4(),
      template_id: templateId,
      type: 'rating_scale',
      content: 'Internal audits are conducted regularly and findings are addressed promptly.',
      options: JSON.stringify({ min: 1, max: 5, section: 'Continuous Improvement' }),
      is_required: true,
      order_index: 15,
    },
    {
      id: uuidv4(),
      template_id: templateId,
      type: 'rating_scale',
      content: 'KPIs are monitored and used to drive improvement actions.',
      options: JSON.stringify({ min: 1, max: 5, section: 'Continuous Improvement' }),
      is_required: true,
      order_index: 16,
    },
    {
      id: uuidv4(),
      template_id: templateId,
      type: 'rating_scale',
      content: 'Management reviews quality performance data regularly.',
      options: JSON.stringify({ min: 1, max: 5, section: 'Continuous Improvement' }),
      is_required: true,
      order_index: 17,
    },
    {
      id: uuidv4(),
      template_id: templateId,
      type: 'rating_scale',
      content: 'Corrective actions are implemented effectively and verified for effectiveness.',
      options: JSON.stringify({ min: 1, max: 5, section: 'Continuous Improvement' }),
      is_required: true,
      order_index: 18,
    },
    {
      id: uuidv4(),
      template_id: templateId,
      type: 'rating_scale',
      content: 'Lessons learned are shared across the organization.',
      options: JSON.stringify({ min: 1, max: 5, section: 'Continuous Improvement' }),
      is_required: true,
      order_index: 19,
    },

    // Section 5: Documentation & Compliance (Q21-25)
    {
      id: uuidv4(),
      template_id: templateId,
      type: 'rating_scale',
      content: 'All procedures are documented, current, and readily accessible.',
      options: JSON.stringify({ min: 1, max: 5, section: 'Documentation & Compliance' }),
      is_required: true,
      order_index: 20,
    },
    {
      id: uuidv4(),
      template_id: templateId,
      type: 'rating_scale',
      content: 'Records are complete, accurate, and maintained as required.',
      options: JSON.stringify({ min: 1, max: 5, section: 'Documentation & Compliance' }),
      is_required: true,
      order_index: 21,
    },
    {
      id: uuidv4(),
      template_id: templateId,
      type: 'rating_scale',
      content: 'Regulatory and customer requirements are understood and met.',
      options: JSON.stringify({ min: 1, max: 5, section: 'Documentation & Compliance' }),
      is_required: true,
      order_index: 22,
    },
    {
      id: uuidv4(),
      template_id: templateId,
      type: 'rating_scale',
      content: 'Document control procedures ensure only current versions are in use.',
      options: JSON.stringify({ min: 1, max: 5, section: 'Documentation & Compliance' }),
      is_required: true,
      order_index: 23,
    },
    {
      id: uuidv4(),
      template_id: templateId,
      type: 'rating_scale',
      content: 'Traceability systems are effective and regularly tested.',
      options: JSON.stringify({ min: 1, max: 5, section: 'Documentation & Compliance' }),
      is_required: true,
      order_index: 24,
    },

    // Section 6: Supplier & Customer Focus (Q26-30)
    {
      id: uuidv4(),
      template_id: templateId,
      type: 'rating_scale',
      content: 'Suppliers are evaluated and approved before use.',
      options: JSON.stringify({ min: 1, max: 5, section: 'Supplier & Customer Focus' }),
      is_required: true,
      order_index: 25,
    },
    {
      id: uuidv4(),
      template_id: templateId,
      type: 'rating_scale',
      content: 'Incoming materials are inspected and verified against specifications.',
      options: JSON.stringify({ min: 1, max: 5, section: 'Supplier & Customer Focus' }),
      is_required: true,
      order_index: 26,
    },
    {
      id: uuidv4(),
      template_id: templateId,
      type: 'rating_scale',
      content: 'Customer complaints are handled promptly and effectively.',
      options: JSON.stringify({ min: 1, max: 5, section: 'Supplier & Customer Focus' }),
      is_required: true,
      order_index: 27,
    },
    {
      id: uuidv4(),
      template_id: templateId,
      type: 'rating_scale',
      content: 'Customer feedback is used to drive improvements.',
      options: JSON.stringify({ min: 1, max: 5, section: 'Supplier & Customer Focus' }),
      is_required: true,
      order_index: 28,
    },
    {
      id: uuidv4(),
      template_id: templateId,
      type: 'rating_scale',
      content: 'Product specifications are agreed upon and reviewed with customers.',
      options: JSON.stringify({ min: 1, max: 5, section: 'Supplier & Customer Focus' }),
      is_required: true,
      order_index: 29,
    },

    // Additional Comments Questions
    {
      id: uuidv4(),
      template_id: templateId,
      type: 'text_long',
      content: 'Please provide any additional comments or observations about your organization\'s quality culture.',
      options: JSON.stringify({ placeholder: 'Enter your comments here...', section: 'Additional Comments' }),
      is_required: false,
      order_index: 30,
    },
    {
      id: uuidv4(),
      template_id: templateId,
      type: 'text_long',
      content: 'Based on this survey, please identify key actions to improve your quality culture.',
      options: JSON.stringify({ placeholder: 'Describe the actions you recommend...', section: 'Action Planning' }),
      is_required: false,
      order_index: 31,
    },
  ];

  await knex('template_questions').insert(questions);

  console.log('BRCGS Quality Culture Survey template created successfully.');
}

export async function down(knex: Knex): Promise<void> {
  // Find the template
  const template = await knex('survey_templates')
    .where('name', 'BRCGS Quality Culture Survey')
    .first();

  if (template) {
    // Delete questions first (foreign key constraint)
    await knex('template_questions').where('template_id', template.id).delete();
    // Delete template
    await knex('survey_templates').where('id', template.id).delete();
    console.log('BRCGS Quality Culture Survey template removed.');
  }
}
