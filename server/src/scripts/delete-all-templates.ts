
import db from '../config/database';

async function deleteAllTemplates() {
    try {
        console.log('--- Deleting All Survey Templates ---');

        // Delete questions first to avoid FK constraint issues if cascade isn't set
        console.log('Deleting template questions...');
        const questionsDeleted = await db('template_questions').del();
        console.log(`Deleted ${questionsDeleted} template questions.`);

        // Delete templates
        console.log('Deleting survey templates...');
        const templatesDeleted = await db('survey_templates').del();
        console.log(`Deleted ${templatesDeleted} survey templates.`);

        console.log('--- Cleanup Complete ---');
        process.exit(0);

    } catch (error) {
        console.error('--- CRITICAL ERROR ---');
        console.error(error);
        process.exit(1);
    }
}

deleteAllTemplates();
