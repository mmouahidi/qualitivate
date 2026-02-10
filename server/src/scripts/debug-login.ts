
import db from '../config/database';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import { parseTokenExpiry } from '../utils/token';

// Copying from auth.controller.ts
const MAX_REFRESH_TOKENS_PER_USER = 5;

const getAccessTokenOptions = () => ({
    expiresIn: (process.env.JWT_EXPIRES_IN || '1h') as any
});

const getRefreshTokenOptions = () => ({
    expiresIn: (process.env.JWT_REFRESH_EXPIRES_IN || '7d') as any
});

async function debugLogin() {
    const trx = await db.transaction();
    try {
        console.log('--- Starting Debug Login Script (Full Flow) ---');
        console.log('Environment:', process.env.NODE_ENV);
        console.log('JWT_SECRET present:', !!process.env.JWT_SECRET);
        console.log('JWT_REFRESH_SECRET present:', !!process.env.JWT_REFRESH_SECRET);
        console.log('JWT_EXPIRES_IN:', process.env.JWT_EXPIRES_IN);
        console.log('JWT_REFRESH_EXPIRES_IN:', process.env.JWT_REFRESH_EXPIRES_IN);

        const email = 'superadmin@qualitivate.io'; // Using a known user from previous run
        const password = 'password';

        console.log(`\nAttempting login simulation for: ${email}`);

        // 1. Find User
        console.log('1. Finding user...');
        const user = await trx('users').where({ email, is_active: true }).first();

        if (!user) {
            console.log('User not found or inactive.');
            await trx.rollback();
            return;
        }
        console.log(`User found: ${user.id}`);

        // 2. Compare Password
        console.log('2. Comparing password...');
        const isPasswordValid = await bcrypt.compare(password, user.password_hash);
        console.log(`Password match: ${isPasswordValid}`);
        if (!isPasswordValid) {
            console.log('Password invalid (expected for this test usually). Skipping further steps unless forcing.');
            // Uncomment to force continue if you want to test token generation even with wrong password
            // await trx.rollback(); return; 
        }

        // 3. Manage Tokens (Delete old)
        console.log('3. Managing old tokens...');
        const existingTokens = await trx('refresh_tokens')
            .where({ user_id: user.id })
            .where('expires_at', '>', new Date())
            .orderBy('created_at', 'desc');

        console.log(`Found ${existingTokens.length} existing tokens.`);

        if (existingTokens.length >= MAX_REFRESH_TOKENS_PER_USER) {
            console.log('Deleting old tokens...');
            const tokensToDelete = existingTokens.slice(MAX_REFRESH_TOKENS_PER_USER - 1);
            await trx('refresh_tokens')
                .whereIn('id', tokensToDelete.map(t => t.id))
                .delete();
        }

        // 4. Sign Access Token
        console.log('4. Signing Access Token...');
        if (!process.env.JWT_SECRET) throw new Error('JWT_SECRET missing');
        const accessToken = jwt.sign(
            { userId: user.id, email: user.email, role: user.role },
            process.env.JWT_SECRET,
            getAccessTokenOptions()
        );
        console.log('Access token signed successfully.');

        // 5. Sign Refresh Token
        console.log('5. Signing Refresh Token...');
        if (!process.env.JWT_REFRESH_SECRET) throw new Error('JWT_REFRESH_SECRET missing');
        const refreshToken = jwt.sign(
            { userId: user.id },
            process.env.JWT_REFRESH_SECRET,
            getRefreshTokenOptions()
        );
        console.log('Refresh token signed successfully.');

        // 6. Parse Expiry
        console.log('6. Parsing Expiry...');
        const refreshExpiryMs = parseTokenExpiry(process.env.JWT_REFRESH_EXPIRES_IN || '7d');
        console.log(`Expiry parsed: ${refreshExpiryMs}ms`);
        const expiresAt = new Date(Date.now() + refreshExpiryMs);

        // 7. Insert Refresh Token
        console.log('7. Inserting Refresh Token...');
        await trx('refresh_tokens').insert({
            id: uuidv4(),
            user_id: user.id,
            token: refreshToken,
            expires_at: expiresAt
        });
        console.log('Refresh token inserted successfully.');

        console.log('--- Login Simulation Successful ---');
        await trx.rollback(); // Always rollback to not dirty DB
        console.log('Transaction rolled back (cleanup).');
        process.exit(0);

    } catch (error) {
        console.error('--- CRITICAL ERROR ---');
        console.error(error);
        await trx.rollback();
        process.exit(1);
    }
}

debugLogin();
