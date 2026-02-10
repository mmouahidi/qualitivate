
import db from '../config/database';
import { v4 as uuidv4 } from 'uuid';

async function debugTemplateCreation() {
    const trx = await db.transaction();
    try {
        console.log('--- Debugging Template Creation ---');

        // 1. Get the Food Safety Template
        const template = await trx('survey_templates')
            .where('name', 'like', '%Food Safety%')
            .first();

        if (!template) {
            throw new Error('Template not found');
        }
        console.log(`Found template: ${template.id}`);

        // 2. Get Questions
        const templateQuestions = await trx('template_questions')
            .where('template_id', template.id)
            .orderBy('order_index');

        console.log(`Found ${templateQuestions.length} questions.`);

        // Inspect the first question's options
        if (templateQuestions.length > 0) {
            const q1 = templateQuestions[0];
            console.log('First Question Options Type:', typeof q1.options);
            console.log('First Question Options Value:', q1.options);
            if (typeof q1.options === 'string') {
                console.log('WARNING: Options is a string, expected object/array!');
            }
        }

        // 3. Try to Insert into Questions (Simulation)
        console.log('Attempting to copy questions to new survey...');
        // Create a dummy survey
        const surveyId = uuidv4();
        // We need a valid company_id and user_id. 
        // Since we are inside a transaction we can just use the template's creator or a random UUID if constraints allow (they don't).
        // Let's pick a user.
        const user = await trx('users').first();
        if (!user) throw new Error('No user found');

        const companyId = user.company_id || (await trx('companies').first())?.id;
        if (!companyId) {
            // If no company, we might fail foreign key on survey insert
            // But detailed error is on questions insert usually? 
            // Let's try to mock survey insertion or just question insertion if survey_id FK allows?
            // Survey ID FK is strict.
            // Let's skip survey insert and just try to insert questions with a random survey_id IF we can disable FK checks? 
            // No, better to do it right.
            throw new Error('No company found for test');
        }

        await trx('surveys').insert({
            id: surveyId,
            company_id: companyId,
            created_by: user.id,
            title: 'Debug Survey',
            type: 'custom',
            status: 'draft'
        });

        const questionInserts = templateQuestions.map((q: any) => ({
            id: uuidv4(),
            survey_id: surveyId,
            type: q.type,
            content: q.content,
            options: JSON.stringify(q.options), // EXPLICIT STRINGIFY
            is_required: q.is_required,
            order_index: q.order_index,
        }));

        await trx('questions').insert(questionInserts);

        console.log('--- Insert Successful, rolling back... ---');
        await trx.rollback();
        process.exit(0);

    } catch (error) {
        console.error('--- CRITICAL ERROR ---');
        console.error(error);
        await trx.rollback();
        process.exit(1);
    }
}

debugTemplateCreation();
