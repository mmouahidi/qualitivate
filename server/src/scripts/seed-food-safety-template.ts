
import db from '../config/database';
import { v4 as uuidv4 } from 'uuid';

async function seedFoodSafetyTemplate() {
    const trx = await db.transaction();
    try {
        console.log('--- Seeding Food Safety & Quality Culture Template ---');

        // 1. Create Template
        const templateId = uuidv4();
        const adminUser = await trx('users').where({ role: 'super_admin' }).first()
            || await trx('users').first(); // Fallback to any user if no super_admin

        if (!adminUser) {
            throw new Error('No user found to assign template to.');
        }

        console.log(`Creating template assigned to user: ${adminUser.email}`);

        await trx('survey_templates').insert({
            id: templateId,
            company_id: null, // Global
            created_by: adminUser.id,
            name: 'Food Safety and Quality Culture / Culture de Sécurité des Aliments et Qualité',
            description: 'Assessment of food safety and quality culture perception. / Évaluation de la perception de la culture de sécurité et qualité.',
            category: 'Food Safety',
            type: 'custom',
            is_global: true,
            is_anonymous: true,
            default_settings: {},
            created_at: new Date(),
            updated_at: new Date()
        });

        // 2. Define Questions
        const categories = [
            {
                name: 'Le Personnel (الأفراد)',
                questions: [
                    {
                        title: 'Émancipation (التمكين)',
                        text: 'Si vous remarquez un problème de sécurité des aliments, comment réagissez-vous ?\nإذا لاحظت مشكلة في سلامة الأغذية، كيف تتصرف؟',
                        options: [
                            "Je ne fais rien, ce n'est pas mon rôle. (لا أفعل شيئاً، هذا ليس دوري)",
                            "J'attends que mon superviseur le remarque. (أنتظر حتى يلاحظ المشرف ذلك)",
                            "J'en parle discrètement à un collègue. (أتحدث عن ذلك سراً مع زميل)",
                            "J'informe immédiatement mon responsable. (أبلغ المسؤول فوراً)",
                            "J'arrête la ligne/l'activité et j'alerte les responsables. (أوقف الخط/النشاط وأنبّه المسؤولين)"
                        ]
                    },
                    {
                        title: 'Récompense (المكافأة)',
                        text: 'Existe-t-il un système pour encourager les initiatives exceptionnelles ?\nهل يوجد نظام لمكافأة المبادرات الاستثنائية؟',
                        options: [
                            "Jamais, aucun encouragement. (أبداً، لا يوجد أي تشجيع)",
                            "Très rarement ou de façon informelle. (نادرًا جدًا أو بشكل غير رسمي)",
                            "Parfois, lors des entretiens annuels. (أحيانًا، خلال المقابلات السنوية)",
                            "Souvent, par des félicitations publiques. (غالباً، من خلال تهنئة علنية)",
                            "Oui, un système structuré (primes, distinctions). (نعم، نظام مهيكل مثل مكافآت أو تميزات)"
                        ]
                    }
                ]
            },
            {
                name: 'Processus (العمليات)',
                questions: [
                    {
                        title: 'Contrôle (المراقبة)',
                        text: 'Comment assurez-vous que le travail est conforme aux normes ?\nكيف تضمنون أن العمل مطابق للمعايير؟',
                        options: [
                            "Je travaille de mémoire sans vérification. (أعمل من الذاكرة دون تحقق)",
                            "Je vérifie seulement si on me le demande. (أتحقق فقط إذا طلب مني ذلك)",
                            "J'utilise les fiches d'autocontrôle occasionnellement. (أستخدم بطاقات المراقبة الذاتية أحياناً)",
                            "Je remplis rigoureusement mes fiches de contrôle. (أملأ بطاقات المراقبة الخاصة بي بدقة)",
                            "Je contrôle, je documente et je propose des corrections. (أراقب، أوثق، وأقترح تصحيحات)"
                        ]
                    },
                    {
                        title: 'Cohérence (التناسق)',
                        text: 'Le changement d\'un opérateur influence-t-il la réalisation des activités ?\nهل يؤثر تغيير أحد أفراد الفريق على تنفيذ الأنشطة؟',
                        options: [
                            "Oui, cela crée souvent des erreurs graves. (نعم، غالباً ما يؤدي ذلك إلى أخطاء جسيمة)",
                            "Oui, la qualité diminue temporairement. (نعم، تنخفض الجودة مؤقتاً)",
                            "Un peu, il faut un temps d'adaptation. (قليلاً، يتطلب الأمر وقتاً للتكيف)",
                            "Presque pas, les procédures sont claires. (تقريباً لا، الإجراءات واضحة)",
                            "Pas du tout, tout le monde est parfaitement formé. (لا أبداً، الجميع مدربون بشكل ممتاز)"
                        ]
                    }
                ]
            },
            {
                name: 'Objet (الهدف والسياسة)',
                questions: [
                    {
                        title: 'Vision (الرؤية)',
                        text: 'Connaissez-vous la politique et les axes de votre entreprise ?\nهل تعرف سياسة شركتك والأسس الرئيسية لها؟',
                        options: [
                            "Je ne sais pas qu'il existe une politique. (لا أعرف بوجود سياسة)",
                            "J'en ai entendu parler, mais je ne la connais pas. (سمعت عنها، لكني لا أعرفها)",
                            "Je connais les grandes lignes vaguement. (أعرف الخطوط العريضة بشكل غامض)",
                            "Je connais bien les axes principaux. (أعرف الأسس الرئيسية جيداً)",
                            "Je l'applique quotidiennement dans mes tâches. (أطبقها يومياً في مهامي)"
                        ]
                    },
                    {
                        title: 'Métrique (القياس)',
                        text: 'Comment mesurez-vous votre performance ?\nكيف تقيس أداءك؟',
                        options: [
                            "Je ne mesure pas ma performance. (لا أقيس أدائي)",
                            "Selon les remarques (positives/négatives) du chef. (حسب ملاحظات رئيسي)",
                            "En regardant si j'ai terminé mon travail à temps. (من خلال معرفة ما إذا أنهيت عملي في الوقت المحدد)",
                            "Via des indicateurs clés (KPI) liés à mon poste. (عبر مؤشرات الأداء المرتبطة بمنصبي)",
                            "Par un suivi précis des objectifs et de la qualité. (من خلال متابعة دقيقة للأهداف والجودة)"
                        ]
                    }
                ]
            },
            {
                name: 'Proactivité (الاستباقية)',
                questions: [
                    {
                        title: 'Conscience (الوعي)',
                        text: 'Quels sont les dangers majeurs pour la sécurité des aliments ?\nما هي المخاطر الرئيسية لسلامة الأغذية؟',
                        options: [
                            "Je ne connais aucun danger spécifique. (لا أعرف أي مخاطر محددة)",
                            "Je connais uniquement les dangers visibles (saleté). (أعرف فقط المخاطر المرئية كالوساخ)",
                            "Je connais les dangers biologiques et physiques. (أعرف المخاطر البيولوجية والفيزيائية)",
                            "Je connais les risques microbiens, chimiques et allergènes. (أعرف المخاطر الميكروبية، الكيميائية، والمسببة للحساسية)",
                            "Je maîtrise tous les points critiques (CCP) de mon poste. (أتقن جميع نقاط التحكم الحرجة في منصبي)"
                        ]
                    },
                    {
                        title: 'Innovation (الابتكار)',
                        text: 'Avez-vous des propositions d\'améliorations ?\nهل لديك اقتراحات للتحسينات؟',
                        options: [
                            "Non, je fais juste ce qu'on me dit. (لا، أفعل فقط ما يقال لي)",
                            "J'en ai, mais je n'ose pas les dire. (لدي، لكني لا أجرؤ على قولها)",
                            "J'en parle parfois à mes collègues. (أتحدث عنها أحياناً مع زملائي)",
                            "Je propose régulièrement des idées à mon chef. (أقترح أفكاراً بانتظام على رئيسي)",
                            "J'ai déjà mis en place des solutions innovantes. (لقد قمت بالفعل بتنفيذ حلول مبتكرة)"
                        ]
                    }
                ]
            },
            {
                name: 'Prise de conscience (الإدراك والمسؤولية)',
                questions: [
                    {
                        title: 'Product Safety (سلامة المنتج)',
                        text: 'Vos tâches ont-elles une incidence sur la qualité du produit ?\nهل تؤثر مهامك على جودة المنتج؟',
                        options: [
                            "Non, mon travail n'a aucun impact. (لا، عملي ليس له أي تأثير)",
                            "Très peu, d'autres s'en occupent. (قليلاً جداً، الآخرون يهتمون بذلك)",
                            "Oui, mais uniquement en cas de grosse erreur. (نعم، ولكن فقط في حالة وقوع خطأ كبير)",
                            "Oui, j'ai une influence directe sur la qualité. (نعم، لدي تأثير مباشر على الجودة)",
                            "Absolument, je suis le garant de la sécurité à mon poste. (بالتأكيد، أنا الضامن للسلامة في منصبي)"
                        ]
                    }
                ]
            }
        ];

        let orderIndex = 0;

        for (const cat of categories) {
            // We will insert a "Text Short" or similar as a Section Header if the UI supported it,
            // but for now we'll just insert the questions. 
            // We can prepend the category name to the first question of the section or just leave it.
            // User didn't ask for explicit section headers in the DB, just the questions.
            // I will just insert the questions.

            for (const q of cat.questions) {
                await trx('template_questions').insert({
                    id: uuidv4(),
                    template_id: templateId,
                    type: 'multiple_choice',
                    content: `${cat.name} - ${q.title}\n${q.text}`,
                    options: q.options,
                    is_required: true,
                    order_index: orderIndex++
                });
            }
        }

        await trx.commit();
        console.log('--- Seeding Complete ---');
        process.exit(0);

    } catch (error) {
        await trx.rollback();
        console.error('--- CRITICAL ERROR ---');
        console.error(error);
        process.exit(1);
    }
}

seedFoodSafetyTemplate();
