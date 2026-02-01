const bcrypt = require('bcrypt');
const { Client } = require('pg');

async function setupTestData() {
  const client = new Client({
    host: 'localhost',
    port: 5432,
    database: 'qualitivate',
    user: 'postgres',
    password: 'postgres123'
  });

  await client.connect();

  const passwordHash = await bcrypt.hash('password123', 10);

  try {
    // Create a test company first (check if exists, else create)
    let companyResult = await client.query(`
      SELECT id FROM companies WHERE name = 'Qualitivate Demo Company' LIMIT 1
    `);

    let companyId;
    if (companyResult.rows.length > 0) {
      companyId = companyResult.rows[0].id;
      console.log(`Using existing company with ID: ${companyId}`);
    } else {
      companyResult = await client.query(`
        INSERT INTO companies (id, name, slug, created_at, updated_at)
        VALUES (gen_random_uuid(), 'Qualitivate Demo Company', 'qualitivate-demo', NOW(), NOW())
        RETURNING id
      `);
      companyId = companyResult.rows[0].id;
      console.log(`Created new company with ID: ${companyId}`);
    }

    // Create test users with company association
    const users = [
      { email: 'superadmin@qualitivate.io', firstName: 'Super', lastName: 'Admin', role: 'super_admin', needsCompany: false },
      { email: 'companyadmin@qualitivate.io', firstName: 'Company', lastName: 'Admin', role: 'company_admin', needsCompany: true },
      { email: 'siteadmin@qualitivate.io', firstName: 'Site', lastName: 'Admin', role: 'site_admin', needsCompany: true },
      { email: 'deptadmin@qualitivate.io', firstName: 'Department', lastName: 'Admin', role: 'department_admin', needsCompany: true },
      { email: 'user@qualitivate.io', firstName: 'Regular', lastName: 'User', role: 'user', needsCompany: true }
    ];

    for (const user of users) {
      try {
        await client.query(`
          INSERT INTO users (id, email, password_hash, first_name, last_name, role, company_id, is_active, created_at, updated_at)
          VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, $6, true, NOW(), NOW())
          ON CONFLICT (email) DO UPDATE 
          SET password_hash = $2, company_id = $6, role = $5
        `, [user.email, passwordHash, user.firstName, user.lastName, user.role, user.needsCompany ? companyId : null]);
        console.log(`Created/Updated: ${user.email} (${user.role}) ${user.needsCompany ? `with company ${companyId}` : 'without company'}`);
      } catch (err) {
        console.error(`Error creating ${user.email}:`, err.message);
      }
    }
  } catch (error) {
    console.error('Setup error:', error);
  } finally {
    await client.end();
    console.log('\nAll test data setup completed with password: password123');
  }
}

setupTestData().catch(console.error);
