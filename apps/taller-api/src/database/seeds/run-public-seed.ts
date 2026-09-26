import 'dotenv/config';
import publicDataSource from '../public-data-source';
import { seedPublicCatalogs } from './public-catalogs.seed';

async function runPublicSeed(): Promise<void> {
  await publicDataSource.initialize();
  const queryRunner = publicDataSource.createQueryRunner();

  try {
    await queryRunner.connect();
    await queryRunner.startTransaction();
    await seedPublicCatalogs(queryRunner);
    await queryRunner.commitTransaction();
    process.stdout.write('Public catalogs seeded successfully.\n');
  } catch (error) {
    if (queryRunner.isTransactionActive) await queryRunner.rollbackTransaction();
    throw error;
  } finally {
    await queryRunner.release();
    await publicDataSource.destroy();
  }
}

void runPublicSeed().catch((error: unknown) => {
  process.stderr.write(`${error instanceof Error ? error.message : 'Public seed failed'}\n`);
  process.exitCode = 1;
});
