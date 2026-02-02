const bcrypt = require('bcrypt');
const { Client } = require('pg');

async function fixPasswords() {
  const client = new Client({
    host: 'localhost',
    port: 5432,
    database: 'qualitivate',
    user: 'postgres',
    password: 'postgres123'
  });

  await client.connect();
  console.log('Connected to database');

  try {
    const hash = await bcrypt.hash('password123', 10);
    console.log('Generated hash:', hash);
    
    const result = await client.query(
      'UPDATE users SET password_hash = $1',
      [hash]
    );
    
    console.log('Updated', result.rowCount, 'users');
    console.log('\nAll accounts now use password: password123');
    
    // List all users
    const users = await client.query('SELECT email, role FROM users ORDER BY role, email');
    console.log('\nAvailable accounts:');
    users.rows.forEach(u => console.log(`  ${u.email} (${u.role})`));
    
  } catch (err) {
    console.error('Error:', err.message);
  } finally {
    await client.end();
  }
}

fixPasswords();
