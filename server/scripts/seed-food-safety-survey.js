const { Client } = require('pg');

const surveyData = {
    name: "Enquête sur la Culture de Sécurité des Aliments / Food Safety Culture Survey",
    description: "Évaluation de la culture de sécurité des aliments selon 5 dimensions: Personnel, Processus, Objet, Proactivité, et Prise de conscience. / Assessment of food safety culture across 5 dimensions.",
    category: "Food Safety",
    type: "custom", // Using 'custom' as it allows flexibility
    is_global: true,
    questions: [
        // 1. Catégorie : Le Personnel (الأفراد)
        {
            content: "Personnel (الأفراد) - Émancipation (التمكين): Si vous remarquez un problème de sécurité des aliments, comment réagissez-vous ? / إذا لاحظت مشكلة في سلامة الأغذية، كيف تتصرف؟",
            type: "multiple_choice",
            options: {
                choices: [
                    "Je ne fais rien, ce n'est pas mon rôle. (لا أفعل شيئاً، هذا ليس دوري)",
                    "J'attends que mon superviseur le remarque. (أنتظر حتى يلاحظ المشرف ذلك)",
                    "J'en parle discrètement à un collègue. (أتحدث عن ذلك سراً مع زميل)",
                    "J'informe immédiatement mon responsable. (أبلغ المسؤول فوراً)",
                    "J'arrête la ligne/l'activité et j'alerte les responsables. (أوقف الخط/النشاط وأنبّه المسؤولين)"
                ]
            }
        },
        {
            content: "Personnel (الأفراد) - Récompense (المكافأة): Existe-t-il un système pour encourager les initiatives exceptionnelles ? / هل يوجد نظام لمكافأة المبادرات الاستثنائية؟",
            type: "multiple_choice",
            options: {
                choices: [
                    "Jamais, aucun encouragement. (أبداً، لا يوجد أي تشجيع)",
                    "Très rarement ou de façon informelle. (نادرًا جدًا أو بشكل غير رسمي)",
                    "Parfois, lors des entretiens annuels. (أحيانًا، خلال المقابلات السنوية)",
                    "Souvent, par des félicitations publiques. (غالباً، من خلال تهنئة علنية)",
                    "Oui, un système structuré (primes, distinctions). (نعم، نظام مهيكل مثل مكافآت أو تميزات)"
                ]
            }
        },
        // 2. Catégorie : Processus (العمليات)
        {
            content: "Processus (العمليات) - Contrôle (المراقبة): Comment assurez-vous que le travail est conforme aux normes ? / كيف تضمنون أن العمل مطابق للمعايير؟",
            type: "multiple_choice",
            options: {
                choices: [
                    "Je travaille de mémoire sans vérification. (أعمل من الذاكرة دون تحقق)",
                    "Je vérifie seulement si on me le demande. (أتحقق فقط إذا طلب مني ذلك)",
                    "J'utilise les fiches d'autocontrôle occasionnellement. (أستخدم بطاقات المراقبة الذاتية أحياناً)",
                    "Je remplis rigoureusement mes fiches de contrôle. (أملأ بطاقات المراقبة الخاصة بي بدقة)",
                    "Je contrôle, je documente et je propose des corrections. (أراقب، أوثق، وأقترح تصحيحات)"
                ]
            }
        },
        {
            content: "Processus (العمليات) - Cohérence (التناسق): Le changement d'un opérateur influence-t-il la réalisation des activités ? / هل يؤثر تغيير أحد أفراد الفريق على تنفيذ الأنشطة؟",
            type: "multiple_choice",
            options: {
                choices: [
                    "Oui, cela crée souvent des erreurs graves. (نعم، غالباً ما يؤدي ذلك إلى أخطاء جسيمة)",
                    "Oui, la qualité diminue temporairement. (نعم، تنخفض الجودة مؤقتاً)",
                    "Un peu, il faut un temps d'adaptation. (قليلاً، يتطلب الأمر وقتاً للتكيف)",
                    "Presque pas, les procédures sont claires. (تقريباً لا، الإجراءات واضحة)",
                    "Pas du tout, tout le monde est parfaitement formé. (لا أبداً، الجميع مدربون بشكل ممتاز)"
                ]
            }
        },
        // 3. Catégorie : Objet (الهدف والسياسة)
        {
            content: "Objet (الهدف والسياسة) - Vision (الرؤية): Connaissez-vous la politique et les axes de votre entreprise ? / هل تعرف سياسة شركتك والأسس الرئيسية لها؟",
            type: "multiple_choice",
            options: {
                choices: [
                    "Je ne sais pas qu'il existe une politique. (لا أعرف بوجود سياسة)",
                    "J'en ai entendu parler, mais je ne la connais pas. (سمعت عنها، لكني لا أعرفها)",
                    "Je connais les grandes lignes vaguement. (أعرف الخطوط العريضة بشكل غامض)",
                    "Je connais bien les axes principaux. (أعرف الأسس الرئيسية جيداً)",
                    "Je l'applique quotidiennement dans mes tâches. (أطبقها يومياً في مهامي)"
                ]
            }
        },
        {
            content: "Objet (الهدف والسياسة) - Métrique (القياس): Comment mesurez-vous votre performance ? / كيف تقيس أداءك؟",
            type: "multiple_choice",
            options: {
                choices: [
                    "Je ne mesure pas ma performance. (لا أقيس أدائي)",
                    "Selon les remarques (positives/négatives) du chef. (حسب ملاحظات رئيسي)",
                    "En regardant si j'ai terminé mon travail à temps. (من خلال معرفة ما إذا أنهيت عملي في الوقت المحدد)",
                    "Via des indicateurs clés (KPI) liés à mon poste. (عبر مؤشرات الأداء المرتبطة بمنصبي)",
                    "Par un suivi précis des objectifs et de la qualité. (من خلال متابعة دقيقة للأهداف والجودة)"
                ]
            }
        },
        // 4. Catégorie : Proactivité (الاستباقية)
        {
            content: "Proactivité (الاستباقية) - Conscience (الوعي): Quels sont les dangers majeurs pour la sécurité des aliments ? / ما هي المخاطر الرئيسية لسلامة الأغذية؟",
            type: "multiple_choice",
            options: {
                choices: [
                    "Je ne connais aucun danger spécifique. (لا أعرف أي مخاطر محددة)",
                    "Je connais uniquement les dangers visibles (saleté). (أعرف فقط المخاطر المرئية كالوساخ)",
                    "Je connais les dangers biologiques et physiques. (أعرف المخاطر البيولوجية والفيزيائية)",
                    "Je connais les risques microbiens, chimiques et allergènes. (أعرف المخاطر الميكروبية، الكيميائية، والمسببة للحساسية)",
                    "Je maîtrise tous les points critiques (CCP) de mon poste. (أتقن جميع نقاط التحكم الحرجة في منصبي)"
                ]
            }
        },
        {
            content: "Proactivité (الاستباقية) - Innovation (الابتكار): Avez-vous des propositions d'améliorations ? / هل لديك اقتراحات للتحسينات؟",
            type: "multiple_choice",
            options: {
                choices: [
                    "Non, je fais juste ce qu'on me dit. (لا، أفعل فقط ما يقال لي)",
                    "J'en ai, mais je n'ose pas les dire. (لدي، لكني لا أجرؤ على قولها)",
                    "J'en parle parfois à mes collègues. (أتحدث عنها أحياناً مع زملائي)",
                    "Je propose régulièrement des idées à mon chef. (أقترح أفكاراً بانتظام على رئيسي)",
                    "J'ai déjà mis en place des solutions innovantes. (لقد قمت بالفعل بتنفيذ حلول مبتكرة)"
                ]
            }
        },
        // 5. Prise de conscience (الإدراك والمسؤولية)
        {
            content: "Prise de conscience (الإدراك والمسؤولية) - Product Safety (سلامة المنتج): Vos tâches ont-elles une incidence sur la qualité du produit ? / هل تؤثر مهامك على جودة المنتج؟",
            type: "multiple_choice",
            options: {
                choices: [
                    "Non, mon travail n'a aucun impact. (لا، عملي ليس له أي تأثير)",
                    "Très peu, d'autres s'en occupent. (قليلاً جداً، الآخرون يهتمون بذلك)",
                    "Oui, mais uniquement en cas de grosse erreur. (نعم، ولكن فقط في حالة وقوع خطأ كبير)",
                    "Oui, j'ai une influence directe sur la qualité. (نعم، لدي تأثير مباشر على الجودة)",
                    "Absolument, je suis le garant de la sécurité à mon poste. (بالتأكيد، أنا الضامن للسلامة في منصبي)"
                ]
            }
        }
    ]
};

async function seedSurvey() {
    const client = new Client({
        host: process.env.DB_HOST || 'localhost',
        port: parseInt(process.env.DB_PORT || '5432'),
        database: process.env.DB_NAME || 'qualitivate',
        user: process.env.DB_USER || 'postgres',
        password: process.env.DB_PASSWORD || 'postgres123'
    });

    try {
        await client.connect();
        console.log('Connected to database');

        // 1. Create or Get User (Super Admin) to be the creator
        const userRes = await client.query("SELECT id FROM users WHERE role = 'super_admin' LIMIT 1");
        let userId = null;
        if (userRes.rows.length > 0) {
            userId = userRes.rows[0].id;
        } else {
            console.log('No super_admin found, creating a system user...');
            // Allow inserting without user if needed, or create one. 
            // For now, let's assume one exists or use a placeholder if the constraints allow.
            // Checking schema constraints... usually created_by is a foreign key.
            // Let's try to get ANY user if super_admin is missing
            const anyUser = await client.query("SELECT id FROM users LIMIT 1");
            if (anyUser.rows.length > 0) userId = anyUser.rows[0].id;
        }

        if (!userId) {
            console.error('Error: No users found in database to assign as creator.');
            process.exit(1);
        }

        // 2. Check if template exists
        const existingTemplate = await client.query(
            "SELECT id FROM survey_templates WHERE name = $1",
            [surveyData.name]
        );

        let templateId;

        if (existingTemplate.rows.length > 0) {
            console.log('Template already exists. Updating...');
            templateId = existingTemplate.rows[0].id;

            // Update template details
            await client.query(`
        UPDATE survey_templates 
        SET description = $1, category = $2, is_global = $3, updated_at = NOW()
        WHERE id = $4
      `, [surveyData.description, surveyData.category, surveyData.is_global, templateId]);

            // Delete existing questions to replace them (simplest strategy for seeding)
            await client.query("DELETE FROM template_questions WHERE template_id = $1", [templateId]);
        } else {
            console.log('Creating new template...');
            const res = await client.query(`
        INSERT INTO survey_templates (id, name, description, category, type, is_global, created_by, created_at, updated_at)
        VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, $6, NOW(), NOW())
        RETURNING id
      `, [
                surveyData.name,
                surveyData.description,
                surveyData.category,
                surveyData.type,
                surveyData.is_global,
                userId
            ]);
            templateId = res.rows[0].id;
        }

        // 3. Insert Questions
        console.log(`Inserting ${surveyData.questions.length} questions for template ${templateId}...`);

        for (const [index, q] of surveyData.questions.entries()) {
            await client.query(`
        INSERT INTO template_questions (id, template_id, type, content, options, order_index, is_required)
        VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, true)
      `, [
                templateId,
                q.type,
                q.content,
                JSON.stringify(q.options),
                index
            ]);
        }

        console.log('✅ Survey template seeded successfully!');

    } catch (error) {
        console.error('Error seeding survey:', error);
    } finally {
        await client.end();
    }
}

seedSurvey();
