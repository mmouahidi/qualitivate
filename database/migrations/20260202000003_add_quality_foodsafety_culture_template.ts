import { Knex } from 'knex';
import { v4 as uuidv4 } from 'uuid';

export async function up(knex: Knex): Promise<void> {
  // Check if template already exists
  const existing = await knex('survey_templates')
    .where('name', 'Quality and Food Safety Culture Survey')
    .first();

  if (existing) {
    console.log('Quality and Food Safety Culture Survey template already exists, skipping.');
    return;
  }

  // Create the Quality and Food Safety Culture Survey Template
  const templateId = uuidv4();

  await knex('survey_templates').insert({
    id: templateId,
    company_id: null,
    created_by: null,
    name: 'Quality and Food Safety Culture Survey',
    description: 'Évaluez la culture de la qualité et de la sécurité alimentaire de votre organisation. Contient 5 catégories : Le Personnel, Processus, Objet, Proactivité et Prise de conscience. Questions en français et en arabe. / قيّم ثقافة الجودة وسلامة الأغذية في مؤسستك. يحتوي على 5 فئات: الموظفون، العمليات، الهدف، الاستباقية والوعي.',
    category: 'Quality & Compliance',
    type: 'custom',
    is_global: true,
    is_anonymous: true,
    default_settings: JSON.stringify({
      showProgressBar: true,
      allowBackNavigation: true,
      showSectionScores: true,
      languages: ['fr', 'ar'],
      defaultLanguage: 'fr',
      sections: [
        { name: 'Le Personnel / الموظفون', questionRange: [0, 4], description: 'Évalue l\'autonomisation, les récompenses, le travail d\'équipe, la formation et la communication.' },
        { name: 'Processus / العمليات', questionRange: [5, 9], description: 'Évalue le contrôle, la coordination, la cohérence, les systèmes et les locaux.' },
        { name: 'Objet / الهدف', questionRange: [10, 14], description: 'Évalue la vision, les valeurs, la stratégie, les objectifs et les indicateurs.' },
        { name: 'Proactivité / الاستباقية', questionRange: [15, 19], description: 'Évalue la conscience, la prévoyance, l\'innovation, l\'apprentissage et l\'investissement.' },
        { name: 'Prise de conscience / الوعي', questionRange: [20, 22], description: 'Évalue la responsabilité et la sécurité des produits.' }
      ],
      ratingLabels: {
        1: 'Très insuffisant / ضعيف جداً',
        2: 'Insuffisant / ضعيف',
        3: 'Acceptable / مقبول',
        4: 'Bien / جيد',
        5: 'Excellent / ممتاز'
      }
    }),
  });

  // Create questions organized by categories
  const questions = [
    // ============================================
    // CATEGORY 1: Le Personnel / الموظفون (Q1-5)
    // ============================================
    
    // Q1 - Émancipation / التمكين
    {
      id: uuidv4(),
      template_id: templateId,
      type: 'text_long',
      content: 'Si vous avez remarqué un problème potentiel de sécurité des aliments (exemple: Hygiène de l\'usine), comment vous réagissez?\n\nإذا لاحظت مشكلة محتملة في سلامة الأغذية مثل \'نظافة المصنع\' كيف تتصرف؟',
      options: JSON.stringify({ 
        section: 'Le Personnel / الموظفون',
        dimension: 'Émancipation / التمكين',
        placeholder: 'Décrivez votre réaction... / صف ردة فعلك...'
      }),
      is_required: true,
      order_index: 0,
    },

    // Q2 - Récompense / المكافأة
    {
      id: uuidv4(),
      template_id: templateId,
      type: 'text_long',
      content: 'Existe-t-il un système de récompense pour encourager les personnes faisant preuve d\'initiative à obtenir des résultats exceptionnels? Si oui, veuillez préciser.\n\nهل يوجد نظام لمكافأة الأشخاص الذين يظهرون مبادرة لتحقيق نتائج استثنائية؟ إذا نعم، يرجى التحديد.',
      options: JSON.stringify({ 
        section: 'Le Personnel / الموظفون',
        dimension: 'Récompense / المكافأة',
        placeholder: 'Décrivez le système de récompense... / صف نظام المكافآت...'
      }),
      is_required: true,
      order_index: 1,
    },

    // Q3 - Travail en équipe / العمل الجماعي
    {
      id: uuidv4(),
      template_id: templateId,
      type: 'text_long',
      content: 'Travaillez-vous en équipe? Quel est votre rôle au sein de votre équipe?\n\nهل تعمل ضمن فريق؟ ما هو دورك داخل فريقك؟',
      options: JSON.stringify({ 
        section: 'Le Personnel / الموظفون',
        dimension: 'Travail en équipe / العمل الجماعي',
        placeholder: 'Décrivez votre rôle... / صف دورك...'
      }),
      is_required: true,
      order_index: 2,
    },

    // Q4 - Entraînement / التدريب
    {
      id: uuidv4(),
      template_id: templateId,
      type: 'text_long',
      content: 'Quelle est la dernière formation à laquelle vous avez participé?\n\nما هي آخر دورة تدريبية شاركت فيها؟',
      options: JSON.stringify({ 
        section: 'Le Personnel / الموظفون',
        dimension: 'Entraînement / التدريب',
        placeholder: 'Indiquez la formation... / حدد الدورة التدريبية...'
      }),
      is_required: true,
      order_index: 3,
    },

    // Q5 - La communication / التواصل
    {
      id: uuidv4(),
      template_id: templateId,
      type: 'text_long',
      content: 'Quelles sont les méthodes de communication que vous utilisez sur votre poste de travail avec vos collègues et vos responsables?\n\nما هي وسائل التواصل التي تستخدمها في عملك مع زملائك ومع المسؤولين عنك؟',
      options: JSON.stringify({ 
        section: 'Le Personnel / الموظفون',
        dimension: 'La communication / التواصل',
        placeholder: 'Décrivez les méthodes... / صف الوسائل...'
      }),
      is_required: true,
      order_index: 4,
    },

    // ============================================
    // CATEGORY 2: Processus / العمليات (Q6-10)
    // ============================================

    // Q6 - Contrôle / المراقبة
    {
      id: uuidv4(),
      template_id: templateId,
      type: 'text_long',
      content: 'Disposez-vous de fiches d\'autocontrôle? Et comment vous assurez-vous que le travail effectué est conforme aux normes et aux instructions en vigueur?\n\nهل لديكم بطاقات للمراقبة الذاتية؟ وكيف تضمنون أن العمل المنجز مطابق للمعايير والتعليمات المعتمدة؟',
      options: JSON.stringify({ 
        section: 'Processus / العمليات',
        dimension: 'Contrôle / المراقبة',
        placeholder: 'Décrivez vos méthodes de contrôle... / صف طرق المراقبة...'
      }),
      is_required: true,
      order_index: 5,
    },

    // Q7 - Coordination / التنسيق
    {
      id: uuidv4(),
      template_id: templateId,
      type: 'text_long',
      content: 'Comment vous coordonnez-vous au sein de l\'entreprise, dans votre poste, avec votre équipe et vos responsables, en ce qui concerne la production, la transmission des instructions et le respect des exigences liées aux risques?\n\nكيف تنسق عملك داخل الشركة، في إطار مهامك، مع فريقك ومع المسؤولين عنك، فيما يخص الإنتاج، نقل التعليمات، واحترام متطلبات إدارة المخاطر؟',
      options: JSON.stringify({ 
        section: 'Processus / العمليات',
        dimension: 'Coordination / التنسيق',
        placeholder: 'Décrivez la coordination... / صف التنسيق...'
      }),
      is_required: true,
      order_index: 6,
    },

    // Q8 - Cohérence / الاتساق
    {
      id: uuidv4(),
      template_id: templateId,
      type: 'rating_scale',
      content: 'Le changement de l\'opérateur influence-t-il sur la réalisation des activités?\n\nهل يؤثر تغيير أحد أفراد الفريق على تنفيذ الأنشطة؟',
      options: JSON.stringify({ 
        min: 1, 
        max: 5,
        section: 'Processus / العمليات',
        dimension: 'Cohérence / الاتساق',
        labels: {
          1: 'Aucune influence / لا تأثير',
          2: 'Peu d\'influence / تأثير قليل',
          3: 'Influence modérée / تأثير متوسط',
          4: 'Influence importante / تأثير كبير',
          5: 'Très forte influence / تأثير كبير جداً'
        }
      }),
      is_required: true,
      order_index: 7,
    },

    // Q9 - Systèmes / الأنظمة
    {
      id: uuidv4(),
      template_id: templateId,
      type: 'rating_scale',
      content: 'Le système documentaire en place permet-il de bien gérer les processus de travail?\n\nهل النظام الوثائقي المطبق يسمح بإدارة العمليات بشكل جيد؟',
      options: JSON.stringify({ 
        min: 1, 
        max: 5,
        section: 'Processus / العمليات',
        dimension: 'Systèmes / الأنظمة',
        labels: {
          1: 'Pas du tout / إطلاقاً',
          2: 'Insuffisamment / غير كافي',
          3: 'Moyennement / متوسط',
          4: 'Bien / جيد',
          5: 'Très bien / جيد جداً'
        }
      }),
      is_required: true,
      order_index: 8,
    },

    // Q10 - Locaux / المباني
    {
      id: uuidv4(),
      template_id: templateId,
      type: 'rating_scale',
      content: 'Les locaux sont-ils bien entretenus?\n\nهل الأماكن محافظ عليها بشكل جيد؟',
      options: JSON.stringify({ 
        min: 1, 
        max: 5,
        section: 'Processus / العمليات',
        dimension: 'Locaux / المباني',
        labels: {
          1: 'Très mal entretenus / صيانة سيئة جداً',
          2: 'Mal entretenus / صيانة سيئة',
          3: 'Moyennement entretenus / صيانة متوسطة',
          4: 'Bien entretenus / صيانة جيدة',
          5: 'Très bien entretenus / صيانة ممتازة'
        }
      }),
      is_required: true,
      order_index: 9,
    },

    // ============================================
    // CATEGORY 3: Objet / الهدف (Q11-15)
    // ============================================

    // Q11 - Vision / الرؤية
    {
      id: uuidv4(),
      template_id: templateId,
      type: 'text_long',
      content: 'Connaissez-vous la politique de votre entreprise? Si oui, quels sont les axes principaux de la politique?\n\nهل تعرف سياسة شركتك؟ إذا نعم، ما هي الأسس الرئيسية للسياسة؟',
      options: JSON.stringify({ 
        section: 'Objet / الهدف',
        dimension: 'Vision / الرؤية',
        placeholder: 'Décrivez la politique... / صف السياسة...'
      }),
      is_required: true,
      order_index: 10,
    },

    // Q12 - Valeurs / القيم
    {
      id: uuidv4(),
      template_id: templateId,
      type: 'rating_scale',
      content: 'Les valeurs de l\'entreprise sont-elles clairement communiquées et respectées?\n\nهل قيم الشركة يتم التواصل بها بوضوح واحترامها؟',
      options: JSON.stringify({ 
        min: 1, 
        max: 5,
        section: 'Objet / الهدف',
        dimension: 'Valeurs / القيم',
        labels: {
          1: 'Pas du tout / إطلاقاً',
          2: 'Rarement / نادراً',
          3: 'Parfois / أحياناً',
          4: 'Souvent / غالباً',
          5: 'Toujours / دائماً'
        }
      }),
      is_required: true,
      order_index: 11,
    },

    // Q13 - Stratégie / الاستراتيجية
    {
      id: uuidv4(),
      template_id: templateId,
      type: 'rating_scale',
      content: 'La stratégie de l\'entreprise en matière de qualité et de sécurité alimentaire est-elle claire pour vous?\n\nهل استراتيجية الشركة في مجال الجودة وسلامة الأغذية واضحة لك؟',
      options: JSON.stringify({ 
        min: 1, 
        max: 5,
        section: 'Objet / الهدف',
        dimension: 'Stratégie / الاستراتيجية',
        labels: {
          1: 'Pas du tout claire / غير واضحة إطلاقاً',
          2: 'Peu claire / غير واضحة',
          3: 'Moyennement claire / واضحة نوعاً ما',
          4: 'Claire / واضحة',
          5: 'Très claire / واضحة جداً'
        }
      }),
      is_required: true,
      order_index: 12,
    },

    // Q14 - Cibles / الأهداف
    {
      id: uuidv4(),
      template_id: templateId,
      type: 'text_long',
      content: 'Quels sont les objectifs liés à votre poste de travail?\n\nما هي الأهداف المرتبطة بمنصبك؟',
      options: JSON.stringify({ 
        section: 'Objet / الهدف',
        dimension: 'Cibles / الأهداف',
        placeholder: 'Listez vos objectifs... / اذكر أهدافك...'
      }),
      is_required: true,
      order_index: 13,
    },

    // Q15 - Métrique / القياس
    {
      id: uuidv4(),
      template_id: templateId,
      type: 'text_long',
      content: 'Comment mesurez-vous votre performance?\n\nكيف تقيس أدائك؟',
      options: JSON.stringify({ 
        section: 'Objet / الهدف',
        dimension: 'Métrique / القياس',
        placeholder: 'Décrivez vos indicateurs... / صف مؤشراتك...'
      }),
      is_required: true,
      order_index: 14,
    },

    // ============================================
    // CATEGORY 4: Proactivité / الاستباقية (Q16-20)
    // ============================================

    // Q16 - Conscience / الوعي
    {
      id: uuidv4(),
      template_id: templateId,
      type: 'text_long',
      content: 'Quels sont les dangers majeurs (selon vous) pour la sécurité des aliments?\n\nما هي المخاطر الرئيسية (حسب رأيك) لسلامة الأغذية؟',
      options: JSON.stringify({ 
        section: 'Proactivité / الاستباقية',
        dimension: 'Conscience / الوعي',
        placeholder: 'Identifiez les dangers... / حدد المخاطر...'
      }),
      is_required: true,
      order_index: 15,
    },

    // Q17 - Prévoyance / التبصر
    {
      id: uuidv4(),
      template_id: templateId,
      type: 'text_long',
      content: 'Selon vous, qu\'est-ce qu\'un produit de qualité?\n\nمن وجهة نظرك، ما هو المنتج ذو الجودة؟',
      options: JSON.stringify({ 
        section: 'Proactivité / الاستباقية',
        dimension: 'Prévoyance / التبصر',
        placeholder: 'Définissez un produit de qualité... / حدد المنتج ذو الجودة...'
      }),
      is_required: true,
      order_index: 16,
    },

    // Q18 - Innovation / الابتكار
    {
      id: uuidv4(),
      template_id: templateId,
      type: 'text_long',
      content: 'Avez-vous des propositions d\'améliorations?\n\nهل لديك اقتراحات للتحسينات؟',
      options: JSON.stringify({ 
        section: 'Proactivité / الاستباقية',
        dimension: 'Innovation / الابتكار',
        placeholder: 'Proposez des améliorations... / اقترح تحسينات...'
      }),
      is_required: false,
      order_index: 17,
    },

    // Q19 - Apprentissage / التعلم
    {
      id: uuidv4(),
      template_id: templateId,
      type: 'text_long',
      content: 'Avez-vous des propositions de formations? Auriez-vous des suggestions de thématiques que vous souhaiteriez que le formateur développe?\n\nهل لديكم اقتراحات بخصوص دورات تكوينية؟ وهل لديكم مواضيع ترغبون في أن يقوم المكوّن بتطويرها؟',
      options: JSON.stringify({ 
        section: 'Proactivité / الاستباقية',
        dimension: 'Apprentissage / التعلم',
        placeholder: 'Proposez des formations... / اقترح دورات تدريبية...'
      }),
      is_required: false,
      order_index: 18,
    },

    // Q20 - Investissement / الاستثمار
    {
      id: uuidv4(),
      template_id: templateId,
      type: 'multiple_choice',
      content: 'La sécurité des aliments est-elle incluse dans les investissements prévus pour l\'année en cours?\n\nهل تم تضمين سلامة الأغذية في الاستثمارات المقررة لهذا العام؟',
      options: JSON.stringify({ 
        section: 'Proactivité / الاستباقية',
        dimension: 'Investissement / الاستثمار',
        choices: [
          'Oui / نعم',
          'Non / لا',
          'Je ne sais pas / لا أعرف'
        ]
      }),
      is_required: true,
      order_index: 19,
    },

    // ============================================
    // CATEGORY 5: Prise de conscience / الوعي (Q21-23)
    // ============================================

    // Q21 - Responsabilité / المسؤولية
    {
      id: uuidv4(),
      template_id: templateId,
      type: 'text_long',
      content: 'Quelles sont vos responsabilités?\n\nما هي مسؤولياتك؟',
      options: JSON.stringify({ 
        section: 'Prise de conscience / الوعي',
        dimension: 'Responsabilité / المسؤولية',
        placeholder: 'Décrivez vos responsabilités... / صف مسؤولياتك...'
      }),
      is_required: true,
      order_index: 20,
    },

    // Q22 - Product safety / سلامة المنتج
    {
      id: uuidv4(),
      template_id: templateId,
      type: 'rating_scale',
      content: 'Vos tâches ont-elles une incidence sur la qualité du produit?\n\nهل تؤثر مهامك على جودة المنتج؟',
      options: JSON.stringify({ 
        min: 1, 
        max: 5,
        section: 'Prise de conscience / الوعي',
        dimension: 'Product safety / سلامة المنتج',
        labels: {
          1: 'Aucune incidence / لا تأثير',
          2: 'Faible incidence / تأثير ضعيف',
          3: 'Incidence modérée / تأثير متوسط',
          4: 'Forte incidence / تأثير كبير',
          5: 'Très forte incidence / تأثير كبير جداً'
        }
      }),
      is_required: true,
      order_index: 21,
    },

    // Q23 - Product safety (conditions d'entrée)
    {
      id: uuidv4(),
      template_id: templateId,
      type: 'text_long',
      content: 'Quelles sont les conditions à respecter lorsque vous voulez entrer à la salle de traitement?\n\nما هي الشروط التي يجب احترامها عند دخولك إلى قاعة الإنتاج؟',
      options: JSON.stringify({ 
        section: 'Prise de conscience / الوعي',
        dimension: 'Product safety / سلامة المنتج',
        placeholder: 'Listez les conditions... / اذكر الشروط...'
      }),
      is_required: true,
      order_index: 22,
    },
  ];

  await knex('template_questions').insert(questions);

  console.log('Quality and Food Safety Culture Survey template created successfully.');
}

export async function down(knex: Knex): Promise<void> {
  // Find the template
  const template = await knex('survey_templates')
    .where('name', 'Quality and Food Safety Culture Survey')
    .first();

  if (template) {
    // Delete questions first (foreign key constraint)
    await knex('template_questions').where('template_id', template.id).delete();
    // Delete template
    await knex('survey_templates').where('id', template.id).delete();
    console.log('Quality and Food Safety Culture Survey template removed.');
  }
}
