#!/usr/bin/env tsx
/**
 * Seed organizational data from an Excel file into the database.
 *
 * Reads an .xlsx file with columns: Company, Departement (or Department), Position
 * and optionally: FirstName/Prénom, LastName/Nom, Email, Site, Role.
 *
 * Creates the full hierarchy: Company → Site → Department → User
 *
 * Usage:
 *   cd server
 *   npx tsx ../scripts/seed-organizational-data.ts ../organizational_data.xlsx
 *
 * Env vars (or .env in server/):
 *   DB_HOST, DB_PORT, DB_NAME, DB_USER, DB_PASSWORD
 */

import path from 'path';
import ExcelJS from 'exceljs';
import knexLib from 'knex';
import dotenv from 'dotenv';
import bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';

dotenv.config({ path: path.resolve(__dirname, '../server/.env') });

const DEFAULT_PASSWORD = 'Qualitivate2026!';
const SALT_ROUNDS = 10;

// ---------------------------------------------------------------------------
// Knex connection
// ---------------------------------------------------------------------------
const knex = knexLib({
  client: 'postgresql',
  connection: process.env.DATABASE_URL
    ? { connectionString: process.env.DATABASE_URL, ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false }
    : {
        host: process.env.DB_HOST || 'localhost',
        port: parseInt(process.env.DB_PORT || '5432'),
        database: process.env.DB_NAME || 'qualitivate',
        user: process.env.DB_USER || 'postgres',
        password: process.env.DB_PASSWORD || 'postgres',
      },
});

// ---------------------------------------------------------------------------
// Column name detection helpers
// ---------------------------------------------------------------------------
function normalise(s: string): string {
  return s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]/g, '');
}

const COLUMN_MATCHERS: Record<string, string[]> = {
  company:    ['company', 'entreprise', 'societe', 'société', 'compagnie', 'org', 'organisation'],
  site:       ['site', 'location', 'lieu', 'filiale', 'branch', 'usine', 'factory', 'unite', 'unité'],
  department: ['department', 'departement', 'département', 'dept', 'service', 'direction'],
  position:   ['position', 'poste', 'fonction', 'job', 'jobtitle', 'titre', 'title', 'intituleposte', 'intitulé'],
  firstName:  ['firstname', 'first', 'prenom', 'prénom', 'givenname'],
  lastName:   ['lastname', 'last', 'nom', 'familyname', 'surname', 'name'],
  email:      ['email', 'mail', 'courriel', 'adressemail', 'emailaddress'],
  role:       ['role', 'rôle', 'accesslevel', 'niveau'],
};

interface ColumnMapping {
  company?: number;
  site?: number;
  department?: number;
  position?: number;
  firstName?: number;
  lastName?: number;
  email?: number;
  role?: number;
}

function detectColumns(headerRow: ExcelJS.Row): ColumnMapping {
  const mapping: ColumnMapping = {};
  headerRow.eachCell((cell, colNumber) => {
    const raw = String(cell.value ?? '').trim();
    if (!raw) return;
    const norm = normalise(raw);
    for (const [field, aliases] of Object.entries(COLUMN_MATCHERS)) {
      if (aliases.some(a => norm.includes(normalise(a)))) {
        (mapping as any)[field] = colNumber;
        break;
      }
    }
  });
  return mapping;
}

function cellString(row: ExcelJS.Row, col: number | undefined): string {
  if (!col) return '';
  const v = row.getCell(col).value;
  if (v == null) return '';
  return String(v).trim();
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function generateEmail(firstName: string, lastName: string, companySlug: string, counter: number): string {
  const fn = slugify(firstName || 'user');
  const ln = slugify(lastName || String(counter));
  return `${fn}.${ln}@${companySlug}.qualitivate.io`;
}

// ---------------------------------------------------------------------------
// Row data
// ---------------------------------------------------------------------------
interface RowData {
  company: string;
  site: string;
  department: string;
  position: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------
async function main() {
  const filePath = process.argv[2];
  if (!filePath) {
    console.error('Usage: npx tsx scripts/seed-organizational-data.ts <path-to-xlsx>');
    process.exit(1);
  }

  const resolved = path.resolve(filePath);
  console.log(`Reading: ${resolved}`);

  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.readFile(resolved);

  const worksheet = workbook.worksheets[0];
  if (!worksheet) {
    console.error('No worksheet found in the workbook');
    process.exit(1);
  }

  console.log(`Worksheet "${worksheet.name}" — ${worksheet.rowCount} rows`);

  // Detect columns from header row
  const headerRow = worksheet.getRow(1);
  const cols = detectColumns(headerRow);

  console.log('Detected column mapping:', JSON.stringify(cols, null, 2));

  if (!cols.company && !cols.department) {
    console.error('Could not detect Company or Department columns. Header row values:');
    headerRow.eachCell((cell, n) => console.error(`  col ${n}: "${cell.value}"`));
    process.exit(1);
  }

  // Parse all data rows
  const rows: RowData[] = [];
  worksheet.eachRow((row, rowNumber) => {
    if (rowNumber === 1) return; // skip header
    const company = cellString(row, cols.company);
    const department = cellString(row, cols.department);
    if (!company && !department) return; // skip empty rows

    rows.push({
      company:    company || 'Default Company',
      site:       cellString(row, cols.site) || 'Headquarters',
      department: department || 'General',
      position:   cellString(row, cols.position),
      firstName:  cellString(row, cols.firstName),
      lastName:   cellString(row, cols.lastName),
      email:      cellString(row, cols.email),
      role:       cellString(row, cols.role),
    });
  });

  console.log(`Parsed ${rows.length} data rows`);
  if (rows.length === 0) {
    console.log('No data rows found, exiting.');
    process.exit(0);
  }

  // Hash default password once
  const passwordHash = await bcrypt.hash(DEFAULT_PASSWORD, SALT_ROUNDS);

  // Collect unique entities
  const companySlugs = new Map<string, string>(); // name → slug
  const companyIds   = new Map<string, string>();  // name → uuid
  const siteKeys     = new Map<string, string>();  // "company|site" → uuid
  const deptKeys     = new Map<string, string>();  // "company|site|dept" → uuid

  for (const r of rows) {
    if (!companySlugs.has(r.company)) companySlugs.set(r.company, slugify(r.company));
    const sKey = `${r.company}|${r.site}`;
    if (!siteKeys.has(sKey)) siteKeys.set(sKey, '');
    const dKey = `${r.company}|${r.site}|${r.department}`;
    if (!deptKeys.has(dKey)) deptKeys.set(dKey, '');
  }

  // -----------------------------------------------------------------------
  // Seed inside a transaction
  // -----------------------------------------------------------------------
  await knex.transaction(async (trx) => {
    // --- Companies -------------------------------------------------------
    for (const [name, slug] of companySlugs) {
      let existing = await trx('companies').where('slug', slug).first();
      if (!existing) {
        const id = uuidv4();
        await trx('companies').insert({ id, name, slug, settings: '{}' });
        companyIds.set(name, id);
        console.log(`  + Company: ${name} (${id})`);
      } else {
        companyIds.set(name, existing.id);
        console.log(`  = Company exists: ${name} (${existing.id})`);
      }
    }

    // --- Sites -----------------------------------------------------------
    for (const sKey of siteKeys.keys()) {
      const [companyName, siteName] = sKey.split('|');
      const companyId = companyIds.get(companyName)!;
      let existing = await trx('sites').where({ company_id: companyId, name: siteName }).first();
      if (!existing) {
        const id = uuidv4();
        await trx('sites').insert({ id, company_id: companyId, name: siteName });
        siteKeys.set(sKey, id);
        console.log(`  + Site: ${siteName} → ${companyName}`);
      } else {
        siteKeys.set(sKey, existing.id);
        console.log(`  = Site exists: ${siteName}`);
      }
    }

    // --- Departments -----------------------------------------------------
    for (const dKey of deptKeys.keys()) {
      const [companyName, siteName, deptName] = dKey.split('|');
      const sKey = `${companyName}|${siteName}`;
      const siteId = siteKeys.get(sKey)!;
      let existing = await trx('departments').where({ site_id: siteId, name: deptName }).first();
      if (!existing) {
        const id = uuidv4();
        await trx('departments').insert({ id, site_id: siteId, name: deptName });
        deptKeys.set(dKey, id);
        console.log(`  + Department: ${deptName} → ${siteName}`);
      } else {
        deptKeys.set(dKey, existing.id);
        console.log(`  = Department exists: ${deptName}`);
      }
    }

    // --- Users -----------------------------------------------------------
    let userCounter = 0;
    const usedEmails = new Set<string>();

    // Pre-load existing emails to avoid conflicts
    const existingEmails = await trx('users').select('email');
    existingEmails.forEach((e: { email: string }) => usedEmails.add(e.email.toLowerCase()));

    for (const r of rows) {
      userCounter++;
      const companyId = companyIds.get(r.company)!;
      const companySlug = companySlugs.get(r.company)!;
      const sKey = `${r.company}|${r.site}`;
      const siteId = siteKeys.get(sKey)!;
      const dKey = `${r.company}|${r.site}|${r.department}`;
      const departmentId = deptKeys.get(dKey)!;

      const firstName = r.firstName || `User`;
      const lastName  = r.lastName  || `${userCounter}`;

      let email = r.email?.toLowerCase();
      if (!email) {
        email = generateEmail(firstName, lastName, companySlug, userCounter);
      }
      // Deduplicate emails
      if (usedEmails.has(email)) {
        email = `${slugify(firstName)}.${slugify(lastName)}.${userCounter}@${companySlug}.qualitivate.io`;
      }

      if (usedEmails.has(email)) {
        console.log(`  ! Skipping duplicate email: ${email}`);
        continue;
      }

      usedEmails.add(email);

      const role = mapRole(r.role || r.position);

      await trx('users').insert({
        id: uuidv4(),
        company_id: companyId,
        site_id: siteId,
        department_id: departmentId,
        email,
        password_hash: passwordHash,
        role,
        first_name: firstName,
        last_name: lastName,
        position: r.position || null,
        is_active: true,
      });

      console.log(`  + User: ${firstName} ${lastName} <${email}> — ${r.position || 'N/A'} (${role})`);
    }

    // Update company counts
    for (const [companyName] of companySlugs) {
      const companyId = companyIds.get(companyName)!;
      const sitesCount = await trx('sites').where('company_id', companyId).count('id as count');
      const employeesCount = await trx('users').where('company_id', companyId).count('id as count');
      await trx('companies').where('id', companyId).update({
        sites_count: Number(sitesCount[0].count),
        employees_count: Number(employeesCount[0].count),
      });
    }

    console.log('\nSeeding complete!');
    console.log(`  Companies:   ${companySlugs.size}`);
    console.log(`  Sites:       ${siteKeys.size}`);
    console.log(`  Departments: ${deptKeys.size}`);
    console.log(`  Users:       ${userCounter}`);
    console.log(`\n  Default password for all users: ${DEFAULT_PASSWORD}`);
  });

  await knex.destroy();
}

// ---------------------------------------------------------------------------
// Role mapping — maps position/role strings to valid DB enum values
// ---------------------------------------------------------------------------
function mapRole(positionOrRole: string): string {
  if (!positionOrRole) return 'user';
  const lower = normalise(positionOrRole);

  if (['superadmin', 'superadministrator'].some(k => lower.includes(normalise(k)))) return 'super_admin';
  if (['companyadmin', 'companyadministrator'].some(k => lower.includes(normalise(k)))) return 'company_admin';

  const adminKeywords = ['directeur', 'director', 'dg', 'pdg', 'ceo', 'gerant', 'gérant', 'general manager', 'directeurgénéral', 'directeurgeneral'];
  if (adminKeywords.some(k => lower.includes(normalise(k)))) return 'company_admin';

  const siteAdminKeywords = ['sitemanager', 'siteadmin', 'plantmanager', 'responsablesite', 'chefdusine', 'factorymanager'];
  if (siteAdminKeywords.some(k => lower.includes(normalise(k)))) return 'site_admin';

  const deptAdminKeywords = ['chef', 'head', 'manager', 'responsable', 'supervisor', 'superviseur', 'chefdeservice', 'headdepartment', 'chefequipe', 'teamlead', 'teamleader'];
  if (deptAdminKeywords.some(k => lower.includes(normalise(k)))) return 'department_admin';

  return 'user';
}

// ---------------------------------------------------------------------------
main().catch((err) => {
  console.error('Seeding failed:', err);
  process.exit(1);
});
