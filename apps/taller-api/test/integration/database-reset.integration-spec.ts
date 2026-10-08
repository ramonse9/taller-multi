import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { bootstrapDatabase } from '../../src/database/bootstrap';
import publicDataSource from '../../src/database/public-data-source';
import {
  createResetDataSource,
  resetLegacyDatabase,
  RESET_CONFIRMATION_PHRASE,
} from '../../src/database/reset-v1-to-v2';
import { verifyBootstrapDatabase } from '../../src/database/verify-bootstrap';

describe('Reinicio controlado V1 a V2 con PostgreSQL real', () => {
  const testDatabaseUrl = process.env.TEST_DATABASE_URL!;
  let databaseName: string;

  beforeAll(async () => {
    const fixture = new DataSource({ type: 'postgres', url: testDatabaseUrl });
    await fixture.initialize();
    try {
      const names = await fixture.query<Array<{ database_name: string }>>(
        'SELECT current_database() AS database_name',
      );
      databaseName = names[0]!.database_name;
      await resetSchemas(fixture);
      await fixture.query(
        'CREATE TABLE public.pub_companias (id varchar PRIMARY KEY, "schema" text)',
      );
      await fixture.query('CREATE SCHEMA legacy_workshop');
      await fixture.query(
        'CREATE TABLE legacy_workshop._schema_migrations (version integer PRIMARY KEY)',
      );
      await fixture.query('CREATE TABLE legacy_workshop.pri_clientes (id varchar PRIMARY KEY)');
      await fixture.query(
        'INSERT INTO public.pub_companias(id, "schema") VALUES ($1, $2)',
        ['legacy-company', 'legacy_workshop'],
      );
    } finally {
      await fixture.destroy();
    }
  });

  afterAll(async () => {
    const cleanup = new DataSource({ type: 'postgres', url: testDatabaseUrl });
    await cleanup.initialize();
    try {
      await resetSchemas(cleanup);
    } finally {
      await cleanup.destroy();
    }
  });

  it('previsualiza, limpia V1, instala V2 y verifica la base conservando su identidad', async () => {
    const preview = await resetLegacyDatabase(createResetDataSource(), {
      execute: false,
      confirmation: undefined,
      expectedDatabase: undefined,
      environment: 'test',
    });
    expect(preview).toMatchObject({
      databaseName,
      v1Detected: true,
      v2Detected: false,
      tenantSchemas: ['legacy_workshop'],
      otherConnectionCount: 0,
    });

    await resetLegacyDatabase(createResetDataSource(), {
      execute: true,
      confirmation: RESET_CONFIRMATION_PHRASE,
      expectedDatabase: databaseName,
      environment: 'test',
    });

    process.env.BOOTSTRAP_ADMIN_EMAIL = 'reset.integration@test.local';
    process.env.BOOTSTRAP_ADMIN_PASSWORD = 'ResetIntegration-2026!';
    const bootstrap = await bootstrapDatabase(publicDataSource);
    const verification = await verifyBootstrapDatabase(publicDataSource);

    expect(bootstrap.adminCreated).toBe(true);
    expect(bootstrap.migrationsExecuted).toBeGreaterThan(0);
    expect(verification.migrationCount).toBeGreaterThan(0);

    const check = new DataSource({ type: 'postgres', url: testDatabaseUrl });
    await check.initialize();
    try {
      const rows = await check.query<
        Array<{ database_name: string; legacy_schema: string | null; v2_users: string | null }>
      >(
        `SELECT current_database() AS database_name,
                to_regnamespace('legacy_workshop')::text AS legacy_schema,
                to_regclass('public.users')::text AS v2_users`,
      );
      expect(rows[0]).toEqual({
        database_name: databaseName,
        legacy_schema: null,
        v2_users: 'users',
      });
    } finally {
      await check.destroy();
    }
  });
});

async function resetSchemas(dataSource: DataSource): Promise<void> {
  const schemas = await dataSource.query<Array<{ nspname: string }>>(
    `SELECT nspname
     FROM pg_namespace
     WHERE nspname <> 'public'
       AND nspname <> 'information_schema'
       AND left(nspname, 3) <> 'pg_'`,
  );
  for (const { nspname } of schemas) {
    await dataSource.query(`DROP SCHEMA "${nspname.replaceAll('"', '""')}" CASCADE`);
  }
  await dataSource.query('DROP SCHEMA IF EXISTS public CASCADE');
  await dataSource.query('CREATE SCHEMA public AUTHORIZATION CURRENT_USER');
}
