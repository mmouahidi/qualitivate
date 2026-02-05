const bcrypt = require('bcrypt');
const { Client } = require('pg');

async function fixWODPasswords() {
    const client = new Client({
        host: 'localhost',
        port: 5432,
        database: 'qualitivate',
        user: 'postgres',
        password: 'postgres123'
    });

    await client.connect();
    
    const hash = await bcrypt.hash('wod2026', 10);
    console.log('Generated hash for password wod2026');
    
    const result = await client.query(
        `UPDATE users SET password_hash = $1 WHERE email LIKE '%@wod.ma' RETURNING email`,
        [hash]
    );
    
    console.log(`Updated ${result.rowCount} WOD accounts:`);
    result.rows.forEach(r => console.log(`  ✓ ${r.email}`));
    
    await client.end();
}

fixWODPasswords().catch(console.error);
