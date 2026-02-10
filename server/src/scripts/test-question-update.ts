
import { v4 as uuidv4 } from 'uuid';
import db from '../config/database';

const API_URL = 'http://localhost:5000/api';
const EMAIL = 'test@qualitivate.io';
const PASSWORD = 'password123';

async function testQuestionUpdate() {
    try {
        // 1. Login
        console.log('Logging in...');
        const loginRes = await fetch(`${API_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email: EMAIL,
                password: PASSWORD
            })
        });

        if (!loginRes.ok) {
            throw new Error(`Login failed: ${loginRes.status} ${loginRes.statusText}`);
        }

        const loginData = await loginRes.json() as any;
        const token = loginData.accessToken;
        console.log('Login successful');

        // 2. Get a survey 
        const survey = await db('surveys').first();
        if (!survey) {
            console.error('No survey found to test with.');
            return;
        }
        console.log(`Using survey: ${survey.id}`);

        // 3. Create a question
        console.log('Creating question...');
        const createRes = await fetch(`${API_URL}/questions/survey/${survey.id}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                type: 'multiple_choice',
                content: 'Original Question',
                options: { choices: ['A', 'B'] },
                isRequired: false
            })
        });

        if (!createRes.ok) {
            const err = await createRes.text();
            throw new Error(`Create failed: ${createRes.status} ${err}`);
        }

        const question = await createRes.json() as any;
        const questionId = question.id;
        console.log(`Question created: ${questionId}`);
        // console.log('Created Options (from API):', question.options); // Might be object or string depending on controller

        // 4. Update the question
        console.log('Updating question...');
        const updateRes = await fetch(`${API_URL}/questions/${questionId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                content: 'Updated Question',
                options: { choices: ['X', 'Y', 'Z'] }
            })
        });

        if (!updateRes.ok) {
            const err = await updateRes.text();
            throw new Error(`Update failed: ${updateRes.status} ${err}`);
        }

        const updatedQuestion = await updateRes.json() as any;
        console.log('Update response status:', updateRes.status);
        console.log('Updated Options (from API):', updatedQuestion.options);
        console.log('Updated Options Type:', typeof updatedQuestion.options);

        // 5. Verify from DB directly
        const dbQuestion = await db('questions').where({ id: questionId }).first();
        console.log('DB Question Options:', dbQuestion.options);
        console.log('DB Question Options Type:', typeof dbQuestion.options);

        // Check if double-encoded
        if (typeof dbQuestion.options === 'string') {
            console.log('WARNING: DB Options are stored as STRING. Is it double encoded?');
            try {
                const parsed = JSON.parse(dbQuestion.options);
                console.log('Parsed once:', parsed);
                if (typeof parsed === 'string') {
                    console.log('Parsed twice:', JSON.parse(parsed));
                    console.log('CONFIRMED: Double encoded JSON string.');
                }
            } catch (e) {
                console.log('Could not parse string content.');
            }
        } else {
            console.log('DB Options are stored as OBJECT/JSON.');
        }

        // Cleanup
        await db('questions').where({ id: questionId }).delete();
        console.log('Cleanup done.');

    } catch (error: any) {
        console.error('Test failed:', error.message);
    } finally {
        await db.destroy();
    }
}

testQuestionUpdate();
