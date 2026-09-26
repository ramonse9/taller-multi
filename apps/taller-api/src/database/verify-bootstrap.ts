import 'dotenv/config';
import publicDataSource from './public-data-source';
import { PUBLIC_CATALOGS } from './seeds/public-catalogs.seed';

interface CountRow {
  count: string;
}

function assert(condition: boolean, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

async function count(sql: string, parameters: unknown[] = []): Promise<number> {
  const rows = await publicDataSource.query<CountRow[]>(sql, parameters);
  return Number(rows[0]?.count ?? 0);
}

async function verifyBootstrap(): Promise<void> {
  const adminEmail = process.env.BOOTSTRAP_ADMIN_EMAIL?.trim().toLowerCase();
  assert(Boolean(adminEmail), 'BOOTSTRAP_ADMIN_EMAIL is required');

  await publicDataSource.initialize();
  try {
    const migrationCount = await count('SELECT COUNT(*) FROM public.public_schema_migrations');
    assert(migrationCount > 0, 'No public migration was registered');

    const companyTypeCount = await count(
      'SELECT COUNT(*) FROM public.company_types WHERE is_active = TRUE',
    );
    assert(
      companyTypeCount === PUBLIC_CATALOGS.companyTypes.length,
      `Expected ${PUBLIC_CATALOGS.companyTypes.length} active company types; found ${companyTypeCount}`,
    );

    const personTypeCount = await count(
      'SELECT COUNT(*) FROM public.person_types WHERE is_active = TRUE',
    );
    assert(
      personTypeCount === PUBLIC_CATALOGS.personTypes.length,
      `Expected ${PUBLIC_CATALOGS.personTypes.length} active person types; found ${personTypeCount}`,
    );

    const timezoneCount = await count(
      'SELECT COUNT(*) FROM public.timezones WHERE is_active = TRUE',
    );
    assert(
      timezoneCount === PUBLIC_CATALOGS.timezones.length,
      `Expected ${PUBLIC_CATALOGS.timezones.length} active timezones; found ${timezoneCount}`,
    );

    const adminCount = await count(
      `SELECT COUNT(*)
       FROM public.users
       WHERE email = $1
         AND role = 'platform_admin'
         AND company_id IS NULL
         AND is_active = TRUE
         AND password_hash LIKE '$argon2id$%'`,
      [adminEmail],
    );
    assert(adminCount === 1, 'The platform administrator is missing or invalid');

    const tenantTableCount = await count(
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
  } finally {
    await publicDataSource.destroy();
  }
}

void verifyBootstrap().catch((error: unknown) => {
  process.stderr.write(
    `${error instanceof Error ? error.message : 'Bootstrap verification failed'}\n`,
  );
  process.exitCode = 1;
});
