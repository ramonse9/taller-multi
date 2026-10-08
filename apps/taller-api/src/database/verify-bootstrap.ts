import 'dotenv/config';
import { DataSource } from 'typeorm';
import publicDataSource from './public-data-source';
import { PUBLIC_CATALOGS } from './seeds/public-catalogs.seed';

interface CountRow {
  count: string;
}

export interface BootstrapVerificationResult {
  migrationCount: number;
  companyTypeCount: number;
  personTypeCount: number;
  timezoneCount: number;
}

function assert(condition: boolean, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

async function count(
  dataSource: DataSource,
  sql: string,
  parameters: unknown[] = [],
): Promise<number> {
  const rows = await dataSource.query<CountRow[]>(sql, parameters);
  return Number(rows[0]?.count ?? 0);
}

export async function verifyBootstrapDatabase(
  dataSource: DataSource = publicDataSource,
): Promise<BootstrapVerificationResult> {
  await dataSource.initialize();
  try {
    const migrationCount = await count(
      dataSource,
      'SELECT COUNT(*) FROM public.public_schema_migrations',
    );
    assert(migrationCount > 0, 'No public migration was registered');

    const companyTypeCount = await count(
      dataSource,
      'SELECT COUNT(*) FROM public.company_types WHERE is_active = TRUE',
    );
    assert(
      companyTypeCount === PUBLIC_CATALOGS.companyTypes.length,
      `Expected ${PUBLIC_CATALOGS.companyTypes.length} active company types; found ${companyTypeCount}`,
    );

    const personTypeCount = await count(
      dataSource,
      'SELECT COUNT(*) FROM public.person_types WHERE is_active = TRUE',
    );
    assert(
      personTypeCount === PUBLIC_CATALOGS.personTypes.length,
      `Expected ${PUBLIC_CATALOGS.personTypes.length} active person types; found ${personTypeCount}`,
    );

    const timezoneCount = await count(
      dataSource,
      'SELECT COUNT(*) FROM public.timezones WHERE is_active = TRUE',
    );
    assert(
      timezoneCount === PUBLIC_CATALOGS.timezones.length,
      `Expected ${PUBLIC_CATALOGS.timezones.length} active timezones; found ${timezoneCount}`,
    );

    const adminCount = await count(
      dataSource,
      `SELECT COUNT(*)
       FROM public.users
       WHERE role = 'platform_admin'
         AND company_id IS NULL
         AND is_active = TRUE
         AND password_hash LIKE '$argon2id$%'`,
    );
    assert(adminCount > 0, 'The platform administrator is missing or invalid');

    const tenantTableCount = await count(
      dataSource,
      `SELECT COUNT(*)
       FROM information_schema.tables
       WHERE table_schema = 'public'
         AND table_name = ANY($1::text[])`,
      [['clients', 'vehicles', 'work_orders', 'inventory_movements', 'invoices']],
    );
    assert(tenantTableCount === 0, 'Tenant operational tables were found in the public schema');

    process.stdout.write(
      'Bootstrap verification passed.\n' +
        `Registered public migrations: ${migrationCount}\n` +
        `Catalogs: ${companyTypeCount} company types, ${personTypeCount} person types, ${timezoneCount} timezones.\n` +
        'Platform administrator: valid.\n',
    );
    return { migrationCount, companyTypeCount, personTypeCount, timezoneCount };
  } finally {
    await dataSource.destroy();
  }
}

if (require.main === module) {
  void verifyBootstrapDatabase().catch((error: unknown) => {
    process.stderr.write(
      `${error instanceof Error ? error.message : 'Bootstrap verification failed'}\n`,
    );
    process.exitCode = 1;
  });
}
