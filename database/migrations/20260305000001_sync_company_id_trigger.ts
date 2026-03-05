import type { Knex } from 'knex';

/**
 * Create a PostgreSQL trigger that keeps surveys.company_id in sync
 * with surveys.settings->'companyId'.
 *
 * This is necessary because the server-side TypeScript build on the VPS
 * is not reliably compiling the latest controller code, so we handle the
 * extraction at the database level.
 */
export async function up(knex: Knex): Promise<void> {
    // Create the trigger function
    await knex.raw(`
    CREATE OR REPLACE FUNCTION sync_survey_company_id()
    RETURNS TRIGGER AS $$
    BEGIN
      -- If settings contains a companyId key, extract it into company_id column
      IF NEW.settings IS NOT NULL AND NEW.settings ? 'companyId' THEN
        IF NEW.settings->>'companyId' IS NOT NULL AND NEW.settings->>'companyId' != '' THEN
          NEW.company_id := (NEW.settings->>'companyId')::uuid;
        ELSE
          NEW.company_id := NULL;
        END IF;
        -- Remove companyId from settings to keep it clean
        NEW.settings := NEW.settings - 'companyId';
      END IF;

      -- Also extract notificationEmails if present
      IF NEW.settings IS NOT NULL AND NEW.settings ? 'notificationEmails' THEN
        NEW.notification_emails := NEW.settings->'notificationEmails';
        NEW.settings := NEW.settings - 'notificationEmails';
      END IF;

      RETURN NEW;
    END;
    $$ LANGUAGE plpgsql;
  `);

    // Create the trigger on INSERT and UPDATE
    await knex.raw(`
    CREATE TRIGGER trg_sync_survey_company_id
    BEFORE INSERT OR UPDATE ON surveys
    FOR EACH ROW
    EXECUTE FUNCTION sync_survey_company_id();
  `);

    // Also fix any existing surveys that have companyId in settings but null company_id
    await knex.raw(`
    UPDATE surveys
    SET company_id = (settings->>'companyId')::uuid,
        settings = settings - 'companyId'
    WHERE settings ? 'companyId'
      AND settings->>'companyId' IS NOT NULL
      AND settings->>'companyId' != '';
  `);
}

export async function down(knex: Knex): Promise<void> {
    await knex.raw('DROP TRIGGER IF EXISTS trg_sync_survey_company_id ON surveys;');
    await knex.raw('DROP FUNCTION IF EXISTS sync_survey_company_id();');
}
