import 'dotenv/config';
import * as argon2 from 'argon2';
import publicDataSource from './public-data-source';

async function bootstrapDatabase(): Promise<void> {
  const email = process.env.BOOTSTRAP_ADMIN_EMAIL?.trim().toLowerCase();
  const password = process.env.BOOTSTRAP_ADMIN_PASSWORD;
  if (!email || !/^\S+@\S+\.\S+$/.test(email))
    throw new Error('BOOTSTRAP_ADMIN_EMAIL is required and must be valid');
  if (!password || password.length < 12 || password.length > 128) {
    throw new Error('BOOTSTRAP_ADMIN_PASSWORD must contain between 12 and 128 characters');
  }

  await publicDataSource.initialize();
  try {
    await publicDataSource.runMigrations({ transaction: 'all' });
    const passwordHash = await argon2.hash(password, { type: argon2.argon2id });
    const result = await publicDataSource.query<unknown[]>(
      `INSERT INTO public.users(email, password_hash, full_name, role, company_id)
       VALUES ($1, $2, 'Platform Administrator', 'platform_admin', NULL)
       ON CONFLICT (email) DO NOTHING RETURNING id`,
      [email, passwordHash],
    );
    if (result.length === 0)
      process.stdout.write('Bootstrap admin already exists; credentials were not changed.\n');
    else process.stdout.write('Public schema migrated and bootstrap admin created.\n');
  } finally {
    await publicDataSource.destroy();
  }
}

void bootstrapDatabase().catch((error: unknown) => {
  process.stderr.write(`${error instanceof Error ? error.message : 'Bootstrap failed'}\n`);
  process.exitCode = 1;
});
