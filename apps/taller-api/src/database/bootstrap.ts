import 'dotenv/config';
import * as argon2 from 'argon2';
import { DataSource } from 'typeorm';
import publicDataSource from './public-data-source';
import { seedPublicCatalogs } from './seeds/public-catalogs.seed';

interface AdminRow {
  company_id: string | null;
  is_active: boolean;
  role: string;
}

export interface BootstrapResult {
  adminCreated: boolean;
  migrationsExecuted: number;
}

function bootstrapCredentials(): { email: string; password: string } {
  const email = process.env.BOOTSTRAP_ADMIN_EMAIL?.trim().toLowerCase();
  const password = process.env.BOOTSTRAP_ADMIN_PASSWORD;
  if (!email || !/^\S+@\S+\.\S+$/.test(email)) {
    throw new Error('BOOTSTRAP_ADMIN_EMAIL is required and must be valid');
  }
  if (!password || password.length < 12 || password.length > 128) {
    throw new Error('BOOTSTRAP_ADMIN_PASSWORD must contain between 12 and 128 characters');
  }
  return { email, password };
}

export async function bootstrapDatabase(
  dataSource: DataSource = publicDataSource,
): Promise<BootstrapResult> {
  await dataSource.initialize();
  const queryRunner = dataSource.createQueryRunner();

  try {
    const migrations = await dataSource.runMigrations({ transaction: 'all' });
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      await seedPublicCatalogs(queryRunner);
      const activePlatformAdmins = (await queryRunner.query(
        `SELECT company_id, role, is_active
         FROM public.users
         WHERE role = 'platform_admin'
           AND company_id IS NULL
           AND is_active = TRUE
           AND password_hash LIKE '$argon2id$%'
         FOR UPDATE`,
      )) as AdminRow[];

      let adminCreated = false;
      if (activePlatformAdmins.length === 0) {
        const { email, password } = bootstrapCredentials();
        const matchingAccounts = (await queryRunner.query(
          `SELECT company_id, role, is_active
           FROM public.users
           WHERE email = $1
           FOR UPDATE`,
          [email],
        )) as AdminRow[];
        const existingAdmin = matchingAccounts[0];
        if (existingAdmin) {
          const isValidPlatformAdmin =
            existingAdmin.role === 'platform_admin' &&
            existingAdmin.company_id === null &&
            existingAdmin.is_active;
          if (!isValidPlatformAdmin) {
            throw new Error(
              `The account ${email} already exists but is not an active platform administrator`,
            );
          }
        }
        const passwordHash = await argon2.hash(password, {
          type: argon2.argon2id,
        });
        await queryRunner.query(
          `INSERT INTO public.users(
             email, password_hash, full_name, role, company_id
           )
           VALUES ($1, $2, 'Platform Administrator', 'platform_admin', NULL)`,
          [email, passwordHash],
        );
        adminCreated = true;
      }

      await queryRunner.commitTransaction();
      return { adminCreated, migrationsExecuted: migrations.length };
    } catch (error) {
      if (queryRunner.isTransactionActive) await queryRunner.rollbackTransaction();
      throw error;
    }
  } finally {
    await queryRunner.release();
    await dataSource.destroy();
  }
}

async function main(): Promise<void> {
  const result = await bootstrapDatabase();
  process.stdout.write(
    `Public migrations executed: ${result.migrationsExecuted}\n` +
      'Public catalogs seeded successfully.\n' +
      (result.adminCreated
        ? 'Platform administrator created.\n'
        : 'Platform administrator already exists and is valid.\n'),
  );
}

if (require.main === module) {
  void main().catch((error: unknown) => {
    process.stderr.write(`${error instanceof Error ? error.message : 'Bootstrap failed'}\n`);
    process.exitCode = 1;
  });
}
