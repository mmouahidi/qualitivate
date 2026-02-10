
import db from '../config/database';
import bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';

async function setupTestUser() {
    try {
        console.log('--- Setting up Test User ---');
        const email = 'test@qualitivate.io';
        const password = 'password123';
        const hashedPassword = await bcrypt.hash(password, 10);

        // Check if exists
        const existing = await db('users').where({ email }).first();
        if (existing) {
            console.log('Test user already exists. Updating password...');
            await db('users').where({ email }).update({
                password_hash: hashedPassword,
                role: 'super_admin',
                is_active: true
            });
            console.log('Test user updated.');
        } else {
            console.log('Creating new test user...');
            await db('users').insert({
                id: uuidv4(),
                email,
                password_hash: hashedPassword,
                first_name: 'Test',
                last_name: 'User',
                role: 'super_admin',
                is_active: true
            });
            console.log('Test user created.');
        }

        process.exit(0);
    } catch (error) {
        console.error(error);
        process.exit(1);
    }
}

setupTestUser();
