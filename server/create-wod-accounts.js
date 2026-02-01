const bcrypt = require('bcrypt');
const { Client } = require('pg');

async function createWODAccounts() {
    const client = new Client({
        host: 'localhost',
        port: 5432,
        database: 'qualitivate',
        user: 'postgres',
        password: 'postgres123'
    });

    await client.connect();

    const passwordHash = await bcrypt.hash('wod2026', 10);

    try {
        // 1. Get or verify the WOD company
        let companyResult = await client.query(`
      SELECT id FROM companies WHERE name = 'WOD' LIMIT 1
    `);

        let companyId;
        if (companyResult.rows.length > 0) {
            companyId = companyResult.rows[0].id;
            console.log(`Using existing company WOD with ID: ${companyId}`);
        } else {
            companyResult = await client.query(`
        INSERT INTO companies (id, name, slug, created_at, updated_at)
        VALUES (gen_random_uuid(), 'WOD', 'wod', NOW(), NOW())
        RETURNING id
      `);
            companyId = companyResult.rows[0].id;
            console.log(`Created new company WOD with ID: ${companyId}`);
        }

        // 2. Create sites (without slug - just id, company_id, name)
        const sites = [
            'Rabat Agdal',
            'Rabat Caroussel',
            'Rabat Loudaya',
            'Kenitra',
            'Marrakech'
        ];

        const siteIds = {};
        for (const siteName of sites) {
            let siteResult = await client.query(`
        SELECT id FROM sites WHERE name = $1 AND company_id = $2 LIMIT 1
      `, [siteName, companyId]);

            if (siteResult.rows.length > 0) {
                siteIds[siteName] = siteResult.rows[0].id;
                console.log(`Using existing site: ${siteName}`);
            } else {
                siteResult = await client.query(`
          INSERT INTO sites (id, company_id, name, created_at, updated_at)
          VALUES (gen_random_uuid(), $1, $2, NOW(), NOW())
          RETURNING id
        `, [companyId, siteName]);
                siteIds[siteName] = siteResult.rows[0].id;
                console.log(`Created site: ${siteName}`);
            }
        }

        // 3. Create users organized by site
        const usersData = [
            // Rabat Agdal
            { email: 'basma.agdal@wod.ma', firstName: 'Basma', lastName: 'Agdal', role: 'site_admin', site: 'Rabat Agdal' },
            { email: 'mohamed.agdal@wod.ma', firstName: 'Mohamed', lastName: 'Agdal', role: 'user', site: 'Rabat Agdal' },
            { email: 'soufian@wod.ma', firstName: 'Soufian', lastName: 'Agdal', role: 'user', site: 'Rabat Agdal' },
            { email: 'said@wod.ma', firstName: 'Said', lastName: 'Agdal', role: 'user', site: 'Rabat Agdal' },

            // Rabat Caroussel
            { email: 'basma.caroussel@wod.ma', firstName: 'Basma', lastName: 'Caroussel', role: 'site_admin', site: 'Rabat Caroussel' },
            { email: 'anas.caroussel@wod.ma', firstName: 'Anas', lastName: 'Caroussel', role: 'user', site: 'Rabat Caroussel' },
            { email: 'omar.caroussel@wod.ma', firstName: 'Omar', lastName: 'Caroussel', role: 'user', site: 'Rabat Caroussel' },

            // Rabat Loudaya
            { email: 'housni@wod.ma', firstName: 'Housni', lastName: 'Loudaya', role: 'site_admin', site: 'Rabat Loudaya' },
            { email: 'khalid@wod.ma', firstName: 'Khalid', lastName: 'Loudaya', role: 'user', site: 'Rabat Loudaya' },
            { email: 'bilal@wod.ma', firstName: 'Bilal', lastName: 'Loudaya', role: 'user', site: 'Rabat Loudaya' },

            // Kenitra
            { email: 'anass.kenitra@wod.ma', firstName: 'Anass', lastName: 'Kenitra', role: 'site_admin', site: 'Kenitra' },
            { email: 'omar.kenitra@wod.ma', firstName: 'Omar', lastName: 'Kenitra', role: 'user', site: 'Kenitra' },
            { email: 'mohamed.kenitra@wod.ma', firstName: 'Mohamed', lastName: 'Kenitra', role: 'user', site: 'Kenitra' },

            // Marrakech
            { email: 'anass.marrakech@wod.ma', firstName: 'Anass', lastName: 'Marrakech', role: 'site_admin', site: 'Marrakech' },
            { email: 'basma.marrakech@wod.ma', firstName: 'Basma', lastName: 'Marrakech', role: 'site_admin', site: 'Marrakech' },
            { email: 'naoufal@wod.ma', firstName: 'Naoufal', lastName: 'Marrakech', role: 'user', site: 'Marrakech' },
            { email: 'waniss@wod.ma', firstName: 'Waniss', lastName: 'Marrakech', role: 'user', site: 'Marrakech' },
            { email: 'chaimae@wod.ma', firstName: 'Chaimae', lastName: 'Marrakech', role: 'user', site: 'Marrakech' },

            // Company Admin for WOD
            { email: 'admin@wod.ma', firstName: 'WOD', lastName: 'Admin', role: 'company_admin', site: null }
        ];

        console.log('\n--- Creating Users ---\n');

        for (const user of usersData) {
            try {
                const siteId = user.site ? siteIds[user.site] : null;
                await client.query(`
          INSERT INTO users (id, email, password_hash, first_name, last_name, role, company_id, site_id, is_active, created_at, updated_at)
          VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, $6, $7, true, NOW(), NOW())
          ON CONFLICT (email) DO UPDATE 
          SET password_hash = $2, company_id = $6, site_id = $7, role = $5
        `, [user.email, passwordHash, user.firstName, user.lastName, user.role, companyId, siteId]);
                console.log(`✓ ${user.role.padEnd(12)} | ${user.email.padEnd(30)} | ${user.site || 'Company-wide'}`);
            } catch (err) {
                console.error(`✗ Error creating ${user.email}:`, err.message);
            }
        }

        console.log('\n========================================');
        console.log('WOD Company Setup Complete!');
        console.log('========================================');
        console.log(`Company: WOD (${companyId})`);
        console.log('\nSites created:');
        for (const [name, id] of Object.entries(siteIds)) {
            console.log(`  - ${name}`);
        }
        console.log('\nAll accounts use password: wod2026');
        console.log('========================================\n');

    } catch (error) {
        console.error('Setup error:', error);
    } finally {
        await client.end();
    }
}

createWODAccounts().catch(console.error);
