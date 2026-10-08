import 'dotenv/config';
import { DataSource } from 'typeorm';
import { bootstrapDatabase } from './bootstrap';
import publicDataSource from './public-data-source';
import { quoteIdentifier } from './schema-name';
import { verifyBootstrapDatabase } from './verify-bootstrap';

export const RESET_CONFIRMATION_PHRASE = 'RESET_V1_AND_INSTALL_V2';

interface MarkerRow {
  v1_marker: string | null;
  v2_marker: string | null;
  migration_marker: string | null;
}

interface IdentityRow {
  database_name: string;
  database_user: string;
}

interface SchemaRow {
  schema_name: string;
}

interface ConnectionRow {
  connection_count: string;
}

export interface LegacyResetPlan {
  databaseName: string;
  databaseUser: string;
  tenantSchemas: string[];
  otherConnectionCount: number;
  v1Detected: boolean;
  v2Detected: boolean;
}

export interface LegacyResetAuthorization {
  execute: boolean;
  confirmation: string | undefined;
  expectedDatabase: string | undefined;
  environment: string | undefined;
}

export function createResetDataSource(): DataSource {
  return new DataSource({
    type: 'postgres',
    url: process.env.DATABASE_URL,
    ssl: process.env.DATABASE_SSL === 'true' ? { rejectUnauthorized: true } : false,
    synchronize: false,
    logging: false,
    extra: { max: 1, application_name: 'taller-v1-to-v2-reset' },
  });
}

export async function inspectLegacyDatabase(dataSource: DataSource): Promise<LegacyResetPlan> {
  await dataSource.initialize();
  try {
    const identity = await dataSource.query<IdentityRow[]>(
      'SELECT current_database() AS database_name, current_user AS database_user',
    );
    const markers = await dataSource.query<MarkerRow[]>(
      `SELECT to_regclass('public.pub_companias')::text AS v1_marker,
              to_regclass('public.companies')::text AS v2_marker,
              to_regclass('public.public_schema_migrations')::text AS migration_marker`,
    );
    const marker = markers[0];
    const v1Detected = marker?.v1_marker !== null && marker?.v1_marker !== undefined;
    const tenantSchemas = v1Detected
      ? await dataSource.query<SchemaRow[]>(
          `SELECT DISTINCT schema_name
           FROM (
             SELECT trim("schema")::text AS schema_name
             FROM public.pub_companias
             WHERE schema IS NOT NULL
             UNION
             SELECT migration.table_schema AS schema_name
             FROM information_schema.tables migration
             WHERE migration.table_name = '_schema_migrations'
               AND EXISTS (
                 SELECT 1
                 FROM information_schema.tables legacy_table
                 WHERE legacy_table.table_schema = migration.table_schema
                   AND left(legacy_table.table_name, 4) = 'pri_'
               )
           ) registered
           WHERE schema_name <> 'public'
             AND schema_name <> 'information_schema'
             AND schema_name !~ '^pg_'
           ORDER BY schema_name`,
        )
      : [];
    const connections = await dataSource.query<ConnectionRow[]>(
      `SELECT count(*)::text AS connection_count
       FROM pg_stat_activity
       WHERE datname = current_database()
         AND usename = current_user
         AND pid <> pg_backend_pid()`,
    );
    const current = identity[0];
    if (!current) throw new Error('Could not identify the target database');
    return {
      databaseName: current.database_name,
      databaseUser: current.database_user,
      tenantSchemas: tenantSchemas.map(({ schema_name }) => schema_name),
      otherConnectionCount: Number(connections[0]?.connection_count ?? 0),
      v1Detected,
      v2Detected: Boolean(marker?.v2_marker || marker?.migration_marker),
    };
  } finally {
    await dataSource.destroy();
  }
}

export async function resetLegacyDatabase(
  dataSource: DataSource,
  authorization: LegacyResetAuthorization,
): Promise<LegacyResetPlan> {
  const plan = await inspectLegacyDatabase(dataSource);
  assertResetIsAuthorized(plan, authorization);
  if (!authorization.execute) return plan;

  await dataSource.initialize();
  const runner = dataSource.createQueryRunner();
  await runner.connect();
  await runner.startTransaction();
  try {
    for (const schemaName of plan.tenantSchemas) {
      await runner.query(`DROP SCHEMA ${quoteIdentifier(schemaName)} CASCADE`);
    }
    await runner.query('DROP SCHEMA public CASCADE');
    await runner.query('CREATE SCHEMA public AUTHORIZATION CURRENT_USER');
    await runner.commitTransaction();
    return plan;
  } catch (error) {
    if (runner.isTransactionActive) await runner.rollbackTransaction();
    throw error;
  } finally {
    await runner.release();
    await dataSource.destroy();
  }
}

export function assertResetIsAuthorized(
  plan: LegacyResetPlan,
  authorization: LegacyResetAuthorization,
): void {
  const isProduction = authorization.environment === 'production';
  const isDisposableTest =
    authorization.environment === 'test' && plan.databaseName.endsWith('_test');
  if (!isProduction && !isDisposableTest) {
    throw new Error('Database reset is allowed only in production or in a database ending in _test');
  }
  if (!plan.v1Detected) {
    throw new Error('V1 marker public.pub_companias was not found; refusing to reset');
  }
  if (plan.v2Detected) {
    throw new Error('V2 structures were detected; refusing to reset an initialized V2 database');
  }
  if (!authorization.execute) return;
  if (authorization.confirmation !== RESET_CONFIRMATION_PHRASE) {
    throw new Error(`TALLER_RESET_CONFIRMATION must equal ${RESET_CONFIRMATION_PHRASE}`);
  }
  if (authorization.expectedDatabase !== plan.databaseName) {
    throw new Error(
      `TALLER_RESET_DATABASE must exactly match the target database: ${plan.databaseName}`,
    );
  }
  if (plan.otherConnectionCount > 0) {
    throw new Error(
      `Refusing to reset while ${plan.otherConnectionCount} other database connection(s) remain open`,
    );
  }
}

function printPlan(plan: LegacyResetPlan): void {
  process.stdout.write(
    `Database reset preview\n` +
      `Database: ${plan.databaseName}\n` +
      `Role: ${plan.databaseUser}\n` +
      `V1 marker: ${plan.v1Detected ? 'found' : 'missing'}\n` +
      `V2 marker: ${plan.v2Detected ? 'found' : 'not found'}\n` +
      `Other connections: ${plan.otherConnectionCount}\n` +
      `Tenant schemas: ${plan.tenantSchemas.join(', ') || '(none)'}\n`,
  );
}

async function main(): Promise<void> {
  const authorization: LegacyResetAuthorization = {
    execute: process.env.TALLER_RESET_EXECUTE === 'true',
    confirmation: process.env.TALLER_RESET_CONFIRMATION,
    expectedDatabase: process.env.TALLER_RESET_DATABASE,
    environment: process.env.NODE_ENV,
  };
  const plan = await resetLegacyDatabase(createResetDataSource(), authorization);
  printPlan(plan);
  if (!authorization.execute) {
    process.stdout.write(
      'Preview only. No schema was changed. Supply the three TALLER_RESET_* authorization variables to execute.\n',
    );
    return;
  }

  process.stdout.write('V1 schemas removed. Installing V2 on the same database and role.\n');
  const bootstrap = await bootstrapDatabase(publicDataSource);
  const verification = await verifyBootstrapDatabase(publicDataSource);
  process.stdout.write(
    `V2 installation completed. Migrations executed: ${bootstrap.migrationsExecuted}. ` +
      `Registered migrations: ${verification.migrationCount}.\n`,
  );
}

if (require.main === module) {
  void main().catch((error: unknown) => {
    process.stderr.write(`${error instanceof Error ? error.message : 'Database reset failed'}\n`);
    process.exitCode = 1;
  });
}
