
import db from '../config/database';

async function inspectTemplate() {
    try {
        const template = await db('survey_templates')
            .where('name', 'like', '%Food Safety%')
            .first();

        if (!template) {
            console.log('Template not found');
            process.exit(0);
        }

        const questions = await db('template_questions')
            .where('template_id', template.id)
            .orderBy('order_index');

        console.log(`Found ${questions.length} questions.`);
        if (questions.length > 0) {
            const q = questions[0];
            console.log('ID:', q.id);
            console.log('Content:', q.content);
            console.log('Options Type:', typeof q.options);
            console.log('Options Value:', q.options);
            console.log('Options Stringified:', JSON.stringify(q.options));
        }

        process.exit(0);
    } catch (error) {
        console.error(error);
        process.exit(1);
    }
}

inspectTemplate();
