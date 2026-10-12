import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { CustomerFiscalProfile1700000038000 } from '../../src/database/migrations/public/1700000038000-customer-fiscal-profile';
import { CfdiUseCatalog1700000039000 } from '../../src/database/migrations/public/1700000039000-cfdi-use-catalog';
import { CustomerRfcValidation1700000040000 } from '../../src/database/migrations/public/1700000040000-customer-rfc-validation';
import { quoteIdentifier } from '../../src/database/schema-name';
import {
  TENANT_BASE_NAME,
  TENANT_BASE_VERSION,
  TenantMigrator,
} from '../../src/database/tenant/tenant-migrator';

const LEGACY_SCHEMAS = ['legacy_fiscal_alpha', 'legacy_fiscal_beta'] as const;
const NEW_SCHEMA = 'current_fiscal_gamma';

interface LegacyTenantFixture {
  companyId: string;
  customerId: string;
  schemaName: string;
}

interface CustomerColumn {
  column_name: string;
  data_type: string;
  udt_name: string;
  is_nullable: string;
  character_maximum_length: number | null;
  column_default: string | null;
}

interface CustomerConstraint {
  constraint_type: string;
  definition: string;
}

describe('Actualización fiscal multi-tenant con PostgreSQL real', () => {
  const testDatabaseUrl = process.env.TEST_DATABASE_URL!;
  let control: DataSource;

  beforeAll(async () => {
    const databaseName = new URL(testDatabaseUrl).pathname.slice(1);
    if (!databaseName.endsWith('_test')) {
      throw new Error('La prueba fiscal solo puede ejecutarse sobre TEST_DATABASE_URL *_test');
    }
    control = new DataSource({
      type: 'postgres',
      url: testDatabaseUrl,
      applicationName: 'taller-fiscal-migration-integration-control',
    });
    await control.initialize();
  });

  beforeEach(async () => {
    await resetSchemas(control);
  });

  afterAll(async () => {
    await resetSchemas(control);
    await control.destroy();
  });

  it('actualiza dos tenants heredados, conserva datos, iguala un tenant nuevo y soporta down', async () => {
    const fixtures = await preparePreFiscalDatabase(control, false);
    const before = await Promise.all(
      fixtures.map((fixture) => readLegacyCustomer(control, fixture)),
    );
    const migrations = await createFiscalMigrationDataSource(testDatabaseUrl);

    try {
      const executed = await migrations.runMigrations({ transaction: 'all' });
      expect(executed.map(({ name }) => name)).toEqual([
        'CustomerFiscalProfile1700000038000',
        'CfdiUseCatalog1700000039000',
        'CustomerRfcValidation1700000040000',
      ]);

      for (const [index, fixture] of fixtures.entries()) {
        const columns = await readCustomerColumns(control, fixture.schemaName);
        expect(columns.map(({ column_name }) => column_name)).toEqual(
          expect.arrayContaining([
            'fiscal_name',
            'fiscal_postal_code',
            'fiscal_regime_code',
            'preferred_cfdi_use_code',
          ]),
        );

        const constraints = await readCustomerConstraints(control, fixture.schemaName);
        const definitions = constraints.map(({ definition }) => definition).join('\n');
        expect(definitions).toContain('FOREIGN KEY (fiscal_regime_code)');
        expect(definitions).toContain('sat_fiscal_regimes');
        expect(definitions).toContain('FOREIGN KEY (preferred_cfdi_use_code)');
        expect(definitions).toContain('sat_cfdi_uses');
        expect(definitions).toContain('preferred_cfdi_use_code IS NULL');
        expect(definitions).toContain('fiscal_regime_code IS NOT NULL');
        expect(definitions).toContain('XAXX010101000');
        expect(definitions).toContain('XEXX010101000');

        const after = await readLegacyCustomer(control, fixture);
        expect(after).toMatchObject(before[index]!);
        expect(after).toMatchObject({
          fiscal_name: null,
          fiscal_postal_code: null,
          fiscal_regime_code: null,
          preferred_cfdi_use_code: null,
        });
      }

      const versions = await control.query<Array<{ company_id: string; versions: number[] }>>(
        `SELECT company_id::text, array_agg(version ORDER BY version)::int[] AS versions
         FROM public.tenant_schema_versions
         WHERE version BETWEEN 24 AND 26
         GROUP BY company_id
         ORDER BY company_id`,
      );
      expect(versions).toEqual(
        fixtures
          .map(({ companyId }) => ({ company_id: companyId, versions: [24, 25, 26] }))
          .sort((left, right) => left.company_id.localeCompare(right.company_id)),
      );

      const regimes = await control.query<Array<{ count: number }>>(
        'SELECT count(*)::int AS count FROM public.sat_fiscal_regimes',
      );
      const uses = await control.query<Array<{ count: number }>>(
        'SELECT count(*)::int AS count FROM public.sat_cfdi_uses',
      );
      const mappings = await control.query<Array<{ count: number }>>(
        'SELECT count(*)::int AS count FROM public.sat_cfdi_use_fiscal_regimes',
      );
      expect(regimes[0]?.count).toBe(19);
      expect(uses[0]?.count).toBe(24);
      expect(mappings[0]?.count).toBe(251);

      const representativeMappings = await control.query<
        Array<{ cfdi_use_code: string; fiscal_regime_code: string }>
      >(
        `SELECT cfdi_use_code, fiscal_regime_code
         FROM public.sat_cfdi_use_fiscal_regimes
         WHERE (cfdi_use_code, fiscal_regime_code) IN (
           ('G01', '601'), ('G03', '612'), ('S01', '605'),
           ('CP01', '601'), ('CN01', '605')
         )
         ORDER BY cfdi_use_code, fiscal_regime_code`,
      );
      expect(representativeMappings).toHaveLength(5);
      expect(
        await control.query(
          `SELECT 1 FROM public.sat_cfdi_use_fiscal_regimes
           WHERE cfdi_use_code = 'D01' AND fiscal_regime_code = '601'`,
        ),
      ).toHaveLength(0);

      const gammaCompany = await createCurrentTenant(control, NEW_SCHEMA);
      const upgradedShape = await readCustomerShape(control, LEGACY_SCHEMAS[0]);
      const currentShape = await readCustomerShape(control, NEW_SCHEMA);
      expect(currentShape).toEqual(upgradedShape);

      const gammaVersion = await control.query<Array<{ version: number; migration_name: string }>>(
        `SELECT version, migration_name
         FROM public.tenant_schema_versions WHERE company_id = $1`,
        [gammaCompany.companyId],
      );
      expect(gammaVersion).toEqual([
        { version: TENANT_BASE_VERSION, migration_name: TENANT_BASE_NAME },
      ]);

      await control.query(`DROP SCHEMA ${quoteIdentifier(NEW_SCHEMA)} CASCADE`);
      await control.query('DELETE FROM public.companies WHERE id = $1', [gammaCompany.companyId]);

      await migrations.undoLastMigration({ transaction: 'all' });
      await migrations.undoLastMigration({ transaction: 'all' });
      await migrations.undoLastMigration({ transaction: 'all' });

      for (const fixture of fixtures) {
        const columns = await readCustomerColumns(control, fixture.schemaName);
        expect(columns.map(({ column_name }) => column_name)).not.toEqual(
          expect.arrayContaining([
            'fiscal_name',
            'fiscal_postal_code',
            'fiscal_regime_code',
            'preferred_cfdi_use_code',
          ]),
        );
        expect(await readLegacyCustomer(control, fixture)).toMatchObject(
          before[fixtures.indexOf(fixture)]!,
        );
      }
      expect(await relationName(control, 'public.sat_fiscal_regimes')).toBeNull();
      expect(await relationName(control, 'public.sat_cfdi_uses')).toBeNull();
      const remainingVersions = await control.query<Array<{ version: number }>>(
        'SELECT version FROM public.tenant_schema_versions WHERE version BETWEEN 24 AND 26',
      );
      expect(remainingVersions).toHaveLength(0);
    } finally {
      await migrations.destroy();
    }
  });

  it('revierte las tres migraciones si un solo schema contiene un RFC inválido', async () => {
    const fixtures = await preparePreFiscalDatabase(control, true);
    const migrations = await createFiscalMigrationDataSource(testDatabaseUrl);

    try {
      await expect(migrations.runMigrations({ transaction: 'all' })).rejects.toThrow(
        `No se puede migrar el schema ${LEGACY_SCHEMAS[1]}: existen RFC de clientes inválidos`,
      );

      for (const fixture of fixtures) {
        const columns = await readCustomerColumns(control, fixture.schemaName);
        expect(columns.map(({ column_name }) => column_name)).not.toEqual(
          expect.arrayContaining([
            'fiscal_name',
            'fiscal_postal_code',
            'fiscal_regime_code',
            'preferred_cfdi_use_code',
          ]),
        );
      }
      expect(await relationName(control, 'public.sat_fiscal_regimes')).toBeNull();
      expect(await relationName(control, 'public.sat_cfdi_uses')).toBeNull();
      const fiscalVersions = await control.query<Array<{ version: number }>>(
        'SELECT version FROM public.tenant_schema_versions WHERE version BETWEEN 24 AND 26',
      );
      expect(fiscalVersions).toHaveLength(0);

      const migrationTable = await relationName(control, 'public.fiscal_upgrade_migrations');
      if (migrationTable) {
        const migrationRows = await control.query<unknown[]>(
          'SELECT * FROM public.fiscal_upgrade_migrations',
        );
        expect(migrationRows).toHaveLength(0);
      }
    } finally {
      await migrations.destroy();
    }
  });
});

async function createFiscalMigrationDataSource(testDatabaseUrl: string): Promise<DataSource> {
  const dataSource = new DataSource({
    type: 'postgres',
    url: testDatabaseUrl,
    applicationName: 'taller-fiscal-migration-integration-runner',
    migrations: [
      CustomerFiscalProfile1700000038000,
      CfdiUseCatalog1700000039000,
      CustomerRfcValidation1700000040000,
    ],
    migrationsTableName: 'fiscal_upgrade_migrations',
    synchronize: false,
  });
  await dataSource.initialize();
  return dataSource;
}

async function preparePreFiscalDatabase(
  dataSource: DataSource,
  invalidSecondTenant: boolean,
): Promise<LegacyTenantFixture[]> {
  await dataSource.query('CREATE EXTENSION IF NOT EXISTS pgcrypto');
  await dataSource.query('CREATE EXTENSION IF NOT EXISTS citext');
  await dataSource.query(`
    CREATE TABLE public.companies (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      name varchar(150) NOT NULL UNIQUE,
      schema_name varchar(63) NOT NULL UNIQUE,
      created_at timestamptz NOT NULL DEFAULT now()
    )
  `);
  await dataSource.query(`
    CREATE TABLE public.users (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      full_name varchar(150) NOT NULL
    )
  `);
  await dataSource.query(`
    CREATE TABLE public.tenant_schema_versions (
      company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
      version integer NOT NULL CHECK (version > 0),
      migration_name varchar(150) NOT NULL,
      applied_at timestamptz NOT NULL DEFAULT now(),
      PRIMARY KEY (company_id, version)
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
      UNIQUE (brand_id, name)
    )
  `);

  const fixtures: LegacyTenantFixture[] = [];
  for (const [index, schemaName] of LEGACY_SCHEMAS.entries()) {
    const companyRows = await dataSource.query<Array<{ id: string }>>(
      `INSERT INTO public.companies(name, schema_name, created_at)
       VALUES ($1, $2, $3::timestamptz) RETURNING id::text`,
      [`Legacy fiscal ${index + 1}`, schemaName, `2026-01-0${index + 1}T00:00:00Z`],
    );
    const companyId = companyRows[0]!.id;
    const userRows = await dataSource.query<Array<{ id: string }>>(
      `INSERT INTO public.users(full_name) VALUES ($1) RETURNING id::text`,
      [`Usuario heredado ${index + 1}`],
    );
    const userId = userRows[0]!.id;
    const schema = quoteIdentifier(schemaName);
    await dataSource.query(`CREATE SCHEMA ${schema}`);
    await dataSource.query(`
      CREATE TABLE ${schema}.customers (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        customer_type varchar(10) NOT NULL DEFAULT 'person'
          CHECK (customer_type IN ('person', 'company')),
        display_name varchar(180) NOT NULL,
        legal_name varchar(180), contact_name varchar(180),
        tax_id varchar(20), email citext, phone varchar(30), notes text,
        is_active boolean NOT NULL DEFAULT true,
        created_by_user_id uuid NOT NULL REFERENCES public.users(id),
        updated_by_user_id uuid NOT NULL REFERENCES public.users(id),
        created_at timestamptz NOT NULL DEFAULT now(),
        updated_at timestamptz NOT NULL DEFAULT now(),
        UNIQUE (tax_id),
        CHECK (
          customer_type = 'company' OR
          (legal_name IS NULL AND contact_name IS NULL)
        )
      )
    `);
    const taxId = invalidSecondTenant && index === 1 ? 'RFC-INVALIDO' : `LOPA90010${index + 1}AB1`;
    const customerRows = await dataSource.query<Array<{ id: string }>>(
      `INSERT INTO ${schema}.customers(
         customer_type, display_name, tax_id, email, phone, notes,
         created_by_user_id, updated_by_user_id,
         created_at, updated_at
       ) VALUES (
         'person', $1, $2, $3, $4, $5, $6, $6,
         $7::timestamptz, $8::timestamptz
       ) RETURNING id::text`,
      [
        `Cliente heredado ${index + 1}`,
        taxId,
        `legacy${index + 1}@example.test`,
        `667100000${index + 1}`,
        `Notas heredadas ${index + 1}`,
        userId,
        `2025-12-0${index + 1}T10:00:00Z`,
        `2026-01-0${index + 1}T11:00:00Z`,
      ],
    );
    await dataSource.query(
      `INSERT INTO public.tenant_schema_versions(company_id, version, migration_name)
       VALUES ($1, 23, 'legacy-pre-fiscal-v23')`,
      [companyId],
    );
    fixtures.push({ companyId, customerId: customerRows[0]!.id, schemaName });
  }
  return fixtures;
}

async function createCurrentTenant(
  dataSource: DataSource,
  schemaName: string,
): Promise<{ companyId: string }> {
  const companyRows = await dataSource.query<Array<{ id: string }>>(
    `INSERT INTO public.companies(name, schema_name)
     VALUES ('Current fiscal gamma', $1) RETURNING id::text`,
    [schemaName],
  );
  const companyId = companyRows[0]!.id;
  const runner = dataSource.createQueryRunner();
  await runner.connect();
  try {
    await runner.startTransaction();
    await runner.query(`CREATE SCHEMA ${quoteIdentifier(schemaName)}`);
    await new TenantMigrator().migrateBase(runner, schemaName);
    await runner.query(
      `INSERT INTO public.tenant_schema_versions(company_id, version, migration_name)
       VALUES ($1, $2, $3)`,
      [companyId, TENANT_BASE_VERSION, TENANT_BASE_NAME],
    );
    await runner.commitTransaction();
  } catch (error: unknown) {
    if (runner.isTransactionActive) await runner.rollbackTransaction();
    throw error;
  } finally {
    await runner.release();
  }
  return { companyId };
}

async function readLegacyCustomer(
  dataSource: DataSource,
  fixture: LegacyTenantFixture,
): Promise<Record<string, unknown>> {
  const rows = await dataSource.query<Array<Record<string, unknown>>>(
    `SELECT * FROM ${quoteIdentifier(fixture.schemaName)}.customers WHERE id = $1`,
    [fixture.customerId],
  );
  return rows[0]!;
}

async function readCustomerColumns(
  dataSource: DataSource,
  schemaName: string,
): Promise<CustomerColumn[]> {
  return dataSource.query<CustomerColumn[]>(
    `SELECT column_name, data_type, udt_name, is_nullable,
            character_maximum_length, column_default
     FROM information_schema.columns
     WHERE table_schema = $1 AND table_name = 'customers'
     ORDER BY column_name`,
    [schemaName],
  );
}

async function readCustomerConstraints(
  dataSource: DataSource,
  schemaName: string,
): Promise<CustomerConstraint[]> {
  return dataSource.query<CustomerConstraint[]>(
    `SELECT con.contype::text AS constraint_type,
            pg_get_constraintdef(con.oid, true) AS definition
     FROM pg_constraint con
     JOIN pg_class relation ON relation.oid = con.conrelid
     JOIN pg_namespace namespace ON namespace.oid = relation.relnamespace
     WHERE namespace.nspname = $1 AND relation.relname = 'customers'
     ORDER BY con.contype, pg_get_constraintdef(con.oid, true)`,
    [schemaName],
  );
}

async function readCustomerShape(
  dataSource: DataSource,
  schemaName: string,
): Promise<{ columns: CustomerColumn[]; constraints: CustomerConstraint[] }> {
  return {
    columns: await readCustomerColumns(dataSource, schemaName),
    constraints: await readCustomerConstraints(dataSource, schemaName),
  };
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
