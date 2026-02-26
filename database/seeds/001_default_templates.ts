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

  // ==========================================
  // 6. 5Q Food Safety and Quality Culture Survey
  // ==========================================
  const foodSafetyId = uuidv4();
  await knex('survey_templates').insert({
    id: foodSafetyId,
    company_id: null,
    created_by: null,
    name: '5Q food safety and quality culture survey',
    description: 'A 5-questionnaire survey assessing food safety and quality culture across personnel, processes, objectives, proactivity and product safety. (Fr/Ar bilingual)',
    category: 'Food Safety',
    type: 'custom',
    is_global: true,
    is_anonymous: false,
    default_settings: {},
  });

  await knex('template_questions').insert([
    // 1. Catégorie : Le Personnel - Émancipation
    {
      id: uuidv4(),
      template_id: foodSafetyId,
      type: 'multiple_choice',
      content: "Si vous remarquez un problème de sécurité des aliments, comment réagissez-vous ? / إذا لاحظت مشكلة في سلامة الأغذية، كيف تتصرف؟",
      options: {
        choices: [
          "Je ne fais rien, ce n'est pas mon rôle. (لا أفعل شيئاً، هذا ليس دوري)",
          "J'attends que mon superviseur le remarque. (أنتظر حتى يلاحظ المشرف ذلك)",
          "J'en parle discrètement à un collègue. (أتحدث عن ذلك سراً مع زميل)",
          "J'informe immédiatement mon responsable. (أبلغ المسؤول فوراً)",
          "J'arrête la ligne/l'activité et j'alerte les responsables. (أوقف الخط/النشاط وأنبّه المسؤولين)"
        ]
      },
      is_required: true,
      order_index: 0,
    },
    // 1. Catégorie : Le Personnel - Récompense
    {
      id: uuidv4(),
      template_id: foodSafetyId,
      type: 'multiple_choice',
      content: "Existe-t-il un système pour encourager les initiatives exceptionnelles ? / هل يوجد نظام لمكافأة المبادرات الاستثنائية؟",
      options: {
        choices: [
          "Jamais, aucun encouragement. (أبداً، لا يوجد أي تشجيع)",
          "Très rarement ou de façon informelle. (نادرًا جدًا أو بشكل غير رسمي)",
          "Parfois, lors des entretiens annuels. (أحيانًا، خلال المقابلات السنوية)",
          "Souvent, par des félicitations publiques. (غالباً، من خلال تهنئة علنية)",
          "Oui, un système structuré (primes, distinctions). (نعم، نظام مهيكل مثل مكافآت أو تميزات)"
        ]
      },
      is_required: true,
      order_index: 1,
    },

    // 2. Catégorie : Processus - Contrôle
    {
      id: uuidv4(),
      template_id: foodSafetyId,
      type: 'multiple_choice',
      content: "Comment assurez-vous que le travail est conforme aux normes ? / كيف تضمنون أن العمل مطابق للمعايير؟",
      options: {
        choices: [
          "Je travaille de mémoire sans vérification. (أعمل من الذاكرة دون تحقق)",
          "Je vérifie seulement si on me le demande. (أتحقق فقط إذا طلب مني ذلك)",
          "J'utilise les fiches d'autocontrôle occasionnellement. (أستخدم بطاقات المراقبة الذاتية أحياناً)",
          "Je remplis rigoureusement mes fiches de contrôle. (أملأ بطاقات المراقبة الخاصة بي بدقة)",
          "Je contrôle, je documente et je propose des corrections. (أراقب، أوثق، وأقترح تصحيحات)"
        ]
      },
      is_required: true,
      order_index: 2,
    },
    // 2. Catégorie : Processus - Cohérence
    {
      id: uuidv4(),
      template_id: foodSafetyId,
      type: 'multiple_choice',
      content: "Le changement d'un opérateur influence-t-il la réalisation des activités ? / هل يؤثر تغيير أحد أفراد الفريق على تنفيذ الأنشطة؟",
      options: {
        choices: [
          "Oui, cela crée souvent des erreurs graves. (نعم، غالباً ما يؤدي ذلك إلى أخطاء جسيمة)",
          "Oui, la qualité diminue temporairement. (نعم، تنخفض الجودة مؤقتاً)",
          "Un peu, il faut un temps d'adaptation. (قليلاً، يتطلب الأمر وقتاً للتكيف)",
          "Presque pas, les procédures sont claires. (تقريباً لا، الإجراءات واضحة)",
          "Pas du tout, tout le monde est parfaitement formé. (لا أبداً، الجميع مدربون بشكل ممتاز)"
        ]
      },
      is_required: true,
      order_index: 3,
    },

    // 3. Catégorie : Objet - Vision
    {
      id: uuidv4(),
      template_id: foodSafetyId,
      type: 'multiple_choice',
      content: "Connaissez-vous la politique et les axes de votre entreprise ? / هل تعرف سياسة شركتك والأسس الرئيسية لها؟",
      options: {
        choices: [
          "Je ne sais pas qu'il existe une politique. (لا أعرف بوجود سياسة)",
          "J'en ai entendu parler, mais je ne la connais pas. (سمعت عنها، لكني لا أعرفها)",
          "Je connais les grandes lignes vaguement. (أعرف الخطوط العريضة بشكل غامض)",
          "Je connais bien les axes principaux. (أعرف الأسس الرئيسية جيداً)",
          "Je l'applique quotidiennement dans mes tâches. (أطبقها يومياً في مهامي)"
        ]
      },
      is_required: true,
      order_index: 4,
    },
    // 3. Catégorie : Objet - Métrique
    {
      id: uuidv4(),
      template_id: foodSafetyId,
      type: 'multiple_choice',
      content: "Comment mesurez-vous votre performance ? / كيف تقيس أداءك؟",
      options: {
        choices: [
          "Je ne mesure pas ma performance. (لا أقيس أدائي)",
          "Selon les remarques (positives/négatives) du chef. (حسب ملاحظات رئيسي)",
          "En regardant si j'ai terminé mon travail à temps. (من خلال معرفة ما إذا أنهيت عملي في الوقت المحدد)",
          "Via des indicateurs clés (KPI) liés à mon poste. (عبر مؤشرات الأداء المرتبطة بمنصبي)",
          "Par un suivi précis des objectifs et de la qualité. (من خلال متابعة دقيقة للأهداف والجودة)"
        ]
      },
      is_required: true,
      order_index: 5,
    },

    // 4. Catégorie : Proactivité - Conscience
    {
      id: uuidv4(),
      template_id: foodSafetyId,
      type: 'multiple_choice',
      content: "Quels sont les dangers majeurs pour la sécurité des aliments ? / ما هي المخاطر الرئيسية لسلامة الأغذية؟",
      options: {
        choices: [
          "Je ne connais aucun danger spécifique. (لا أعرف أي مخاطر محددة)",
          "Je connais uniquement les dangers visibles (saleté). (أعرف فقط المخاطر المرئية كالوساخ)",
          "Je connais les dangers biologiques et physiques. (أعرف المخاطر البيولوجية والفيزيائية)",
          "Je connais les risques microbiens, chimiques et allergènes. (أعرف المخاطر الميكروبية، الكيميائية، والمسببة للحساسية)",
          "Je maîtrise tous les points critiques (CCP) de mon poste. (أتقن جميع نقاط التحكم الحرجة في منصبي)"
        ]
      },
      is_required: true,
      order_index: 6,
    },
    // 4. Catégorie : Proactivité - Innovation
    {
      id: uuidv4(),
      template_id: foodSafetyId,
      type: 'multiple_choice',
      content: "Avez-vous des propositions d'améliorations ? / هل لديك اقتراحات للتحسينات؟",
      options: {
        choices: [
          "Non, je fais juste ce qu'on me dit. (لا، أفعل فقط ما يقال لي)",
          "J'en ai, mais je n'ose pas les dire. (لدي، لكني لا أجرؤ على قولها)",
          "J'en parle parfois à mes collègues. (أتحدث عنها أحياناً مع زملائي)",
          "Je propose régulièrement des idées à mon chef. (أقترح أفكاراً بانتظام على رئيسي)",
          "J'ai déjà mis en place des solutions innovantes. (لقد قمت بالفعل بتنفيذ حلول مبتكرة)"
        ]
      },
      is_required: true,
      order_index: 7,
    },

    // 5. Prise de conscience - Product Safety
    {
      id: uuidv4(),
      template_id: foodSafetyId,
      type: 'multiple_choice',
      content: "Vos tâches ont-elles une incidence sur la qualité du produit ? / هل تؤثر مهامك على جودة المنتج؟",
      options: {
        choices: [
          "Non, mon travail n'a aucun impact. (لا، عملي ليس له أي تأثير)",
          "Très peu, d'autres s'en occupent. (قليلاً جداً، الآخرون يهتمون بذلك)",
          "Oui, mais uniquement en cas de grosse erreur. (نعم، ولكن فقط في حالة وقوع خطأ كبير)",
          "Oui, j'ai une influence directe sur la qualité. (نعم، لدي تأثير مباشر على الجودة)",
          "Absolument, je suis le garant de la sécurité à mon poste. (بالتأكيد، أنا الضامن للالسلامة في منصبي)"
        ]
      },
      is_required: true,
      order_index: 8,
    },
  ]);

  console.log('Default survey templates seeded successfully!');
}
