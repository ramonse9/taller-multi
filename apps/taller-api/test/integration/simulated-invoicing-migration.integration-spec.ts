import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { SimulatedInvoicingSettings1700000042000 } from '../../src/database/migrations/public/1700000042000-simulated-invoicing-settings';
import { quoteIdentifier } from '../../src/database/schema-name';
import {
  TENANT_BASE_NAME,
  TENANT_BASE_VERSION,
  TenantMigrator,
} from '../../src/database/tenant/tenant-migrator';

const LEGACY_SCHEMAS = ['legacy_invoice_alpha', 'legacy_invoice_beta'] as const;
const CURRENT_SCHEMA = 'current_invoice_gamma';

describe('Configuración de facturación simulada con PostgreSQL real', () => {
  const testDatabaseUrl = process.env.TEST_DATABASE_URL!;
  let control: DataSource;

  beforeAll(async () => {
    control = new DataSource({
      type: 'postgres',
      url: testDatabaseUrl,
      applicationName: 'taller-simulated-invoicing-migration-control',
    });
    await control.initialize();
  });

  beforeEach(async () => {
    await resetSchemas(control);
    await preparePublicPrerequisites(control);
  });

  afterAll(async () => {
    await resetSchemas(control);
    await control.destroy();
  });

  it('actualiza tenants existentes y deja la misma estructura en un tenant nuevo', async () => {
    const legacyCompanies: Array<{ id: string; schemaName: string }> = [];
    for (const [index, schemaName] of LEGACY_SCHEMAS.entries()) {
      const rows = await control.query<Array<{ id: string }>>(
        `INSERT INTO public.companies(name, schema_name, person_type_code, created_at)
         VALUES ($1, $2, 'individual', $3::timestamptz) RETURNING id::text`,
        [`Emisor heredado ${index + 1}`, schemaName, `2026-01-0${index + 1}T00:00:00Z`],
      );
      await control.query(`CREATE SCHEMA ${quoteIdentifier(schemaName)}`);
      legacyCompanies.push({ id: rows[0]!.id, schemaName });
    }

    const migrations = new DataSource({
      type: 'postgres',
      url: testDatabaseUrl,
      applicationName: 'taller-simulated-invoicing-migration-runner',
      migrations: [SimulatedInvoicingSettings1700000042000],
      migrationsTableName: 'simulated_invoicing_migrations',
      synchronize: false,
    });
    await migrations.initialize();
    try {
      const executed = await migrations.runMigrations({ transaction: 'all' });
      expect(executed.map(({ name }) => name)).toEqual([
        'SimulatedInvoicingSettings1700000042000',
      ]);

      for (const company of legacyCompanies) {
        expect(await relationName(control, `${company.schemaName}.invoice_settings`)).not.toBeNull();
        expect(
          await relationName(control, `${company.schemaName}.invoice_settings_events`),
        ).not.toBeNull();
        const settings = await control.query<
          Array<{ mode: string; currency_code: string; next_internal_folio: string }>
        >(
          `SELECT mode, currency_code, next_internal_folio::text
           FROM ${quoteIdentifier(company.schemaName)}.invoice_settings`,
        );
        expect(settings).toEqual([
          { mode: 'disabled', currency_code: 'MXN', next_internal_folio: '1' },
        ]);
      }

      const versions = await control.query<Array<{ company_id: string; version: number }>>(
        `SELECT company_id::text, version FROM public.tenant_schema_versions
         WHERE version = 27 ORDER BY company_id`,
      );
      expect(versions).toEqual(
        legacyCompanies
          .map(({ id }) => ({ company_id: id, version: 27 }))
          .sort((left, right) => left.company_id.localeCompare(right.company_id)),
      );

      const permissionRows = await control.query<Array<{ code: string }>>(
        `SELECT code FROM public.permissions WHERE module = 'invoices' ORDER BY sort_order`,
      );
      expect(permissionRows.map(({ code }) => code)).toEqual([
        'invoices.view',
        'invoices.create',
        'invoices.edit',
        'invoices.simulate_issue',
        'invoices.cancel_simulation',
        'invoices.configure',
      ]);

      const currentCompany = await control.query<Array<{ id: string }>>(
        `INSERT INTO public.companies(name, schema_name, person_type_code)
         VALUES ('Emisor actual', $1, 'legal_entity') RETURNING id::text`,
        [CURRENT_SCHEMA],
      );
      const runner = control.createQueryRunner();
      await runner.connect();
      try {
        await runner.startTransaction();
        await runner.query(`CREATE SCHEMA ${quoteIdentifier(CURRENT_SCHEMA)}`);
        await new TenantMigrator().migrateBase(runner, CURRENT_SCHEMA);
        await runner.query(
          `INSERT INTO public.tenant_schema_versions(company_id, version, migration_name)
           VALUES ($1, $2, $3)`,
          [currentCompany[0]!.id, TENANT_BASE_VERSION, TENANT_BASE_NAME],
        );
        await runner.commitTransaction();
      } catch (error: unknown) {
        if (runner.isTransactionActive) await runner.rollbackTransaction();
        throw error;
      } finally {
        await runner.release();
      }

      const upgradedShape = await readSettingsShape(control, LEGACY_SCHEMAS[0]);
      const currentShape = await readSettingsShape(control, CURRENT_SCHEMA);
      expect(currentShape).toEqual(upgradedShape);

      await control.query(`DROP SCHEMA ${quoteIdentifier(CURRENT_SCHEMA)} CASCADE`);
      await control.query('DELETE FROM public.companies WHERE id = $1', [currentCompany[0]!.id]);
      await migrations.undoLastMigration({ transaction: 'all' });
      for (const company of legacyCompanies) {
        expect(await relationName(control, `${company.schemaName}.invoice_settings`)).toBeNull();
      }
    } finally {
      await migrations.destroy();
    }
  });
});

async function preparePublicPrerequisites(dataSource: DataSource): Promise<void> {
  await dataSource.query('CREATE EXTENSION IF NOT EXISTS pgcrypto');
  await dataSource.query('CREATE EXTENSION IF NOT EXISTS citext');
  await dataSource.query(`
    CREATE TABLE public.companies (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      name varchar(150) NOT NULL UNIQUE,
      schema_name varchar(63) NOT NULL UNIQUE,
      person_type_code varchar(20) NOT NULL,
      is_active boolean NOT NULL DEFAULT true,
      created_at timestamptz NOT NULL DEFAULT now()
    )
  `);
  await dataSource.query(`
    CREATE TABLE public.users (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      role varchar(30) NOT NULL DEFAULT 'user'
    )
  `);
  await dataSource.query(`
    CREATE TABLE public.tenant_schema_versions (
      company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
      version integer NOT NULL,
      migration_name varchar(150) NOT NULL,
      applied_at timestamptz NOT NULL DEFAULT now(),
      PRIMARY KEY(company_id, version)
    )
  `);
  await dataSource.query(`
    CREATE TABLE public.sat_fiscal_regimes (
      code varchar(3) PRIMARY KEY,
      name varchar(180) NOT NULL,
      supports_person boolean NOT NULL,
      supports_company boolean NOT NULL,
      is_active boolean NOT NULL DEFAULT true
    )
  `);
  await dataSource.query(`
    INSERT INTO public.sat_fiscal_regimes
      (code, name, supports_person, supports_company)
    VALUES ('601', 'General de Ley Personas Morales', false, true),
           ('612', 'Personas Físicas con Actividades Empresariales y Profesionales', true, false)
  `);
  await dataSource.query(`
    CREATE TABLE public.sat_cfdi_uses (
      code varchar(4) PRIMARY KEY
    )
  `);
  await dataSource.query(`
    CREATE TABLE public.vehicle_brands (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(), name varchar(100) NOT NULL UNIQUE
    )
  `);
  await dataSource.query(`
    CREATE TABLE public.vehicle_models (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      brand_id uuid NOT NULL REFERENCES public.vehicle_brands(id),
      name varchar(100) NOT NULL,
      UNIQUE(brand_id, name)
    )
  `);
  await dataSource.query(`
    CREATE TABLE public.permissions (
      code varchar(80) PRIMARY KEY,
      module varchar(40) NOT NULL,
      action varchar(40) NOT NULL,
      name varchar(120) NOT NULL,
      description varchar(300) NOT NULL,
      sort_order smallint NOT NULL UNIQUE,
      UNIQUE(module, action)
    )
  `);
  await dataSource.query(`
    CREATE TABLE public.permission_templates (
      code varchar(40) PRIMARY KEY
    )
  `);
  await dataSource.query(`INSERT INTO public.permission_templates(code) VALUES ('administration')`);
  await dataSource.query(`
    CREATE TABLE public.permission_template_permissions (
      template_code varchar(40) NOT NULL REFERENCES public.permission_templates(code) ON DELETE CASCADE,
      permission_code varchar(80) NOT NULL REFERENCES public.permissions(code) ON DELETE CASCADE,
      PRIMARY KEY(template_code, permission_code)
    )
  `);
  await dataSource.query(`
    CREATE TABLE public.user_permission_profiles (
      user_id uuid PRIMARY KEY REFERENCES public.users(id) ON DELETE CASCADE,
      template_code varchar(40) REFERENCES public.permission_templates(code),
      is_customized boolean NOT NULL DEFAULT false
    )
  `);
  await dataSource.query(`
    CREATE TABLE public.user_permissions (
      user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
      permission_code varchar(80) NOT NULL REFERENCES public.permissions(code) ON DELETE CASCADE,
      PRIMARY KEY(user_id, permission_code)
    )
  `);
}

async function readSettingsShape(
  dataSource: DataSource,
  schemaName: string,
): Promise<Array<Record<string, unknown>>> {
  return dataSource.query<Array<Record<string, unknown>>>(
    `SELECT column_name, data_type, udt_name, is_nullable,
            character_maximum_length, column_default
     FROM information_schema.columns
     WHERE table_schema = $1 AND table_name = 'invoice_settings'
     ORDER BY ordinal_position`,
    [schemaName],
  );
}

async function relationName(dataSource: DataSource, relation: string): Promise<string | null> {
  const rows = await dataSource.query<Array<{ relation_name: string | null }>>(
    'SELECT to_regclass($1)::text AS relation_name',
    [relation],
  );
  return rows[0]?.relation_name ?? null;
}

async function resetSchemas(dataSource: DataSource): Promise<void> {
  const schemas = await dataSource.query<Array<{ nspname: string }>>(
    `SELECT nspname FROM pg_namespace
     WHERE nspname <> 'public'
       AND nspname <> 'information_schema'
       AND left(nspname, 3) <> 'pg_'`,
  );
  for (const { nspname } of schemas) {
    await dataSource.query(`DROP SCHEMA ${quoteIdentifier(nspname)} CASCADE`);
  }
  await dataSource.query('DROP SCHEMA IF EXISTS public CASCADE');
  await dataSource.query('CREATE SCHEMA public AUTHORIZATION CURRENT_USER');
}
