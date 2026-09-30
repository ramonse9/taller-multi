import { MigrationInterface, QueryRunner } from 'typeorm';
import { quoteIdentifier } from '../../schema-name';

interface CompanySchemaRow {
  id: string;
  schema_name: string;
}

export class SimplifiedOrderStatuses1700000010000 implements MigrationInterface {
  name = 'SimplifiedOrderStatuses1700000010000';

  async up(queryRunner: QueryRunner): Promise<void> {
    const companies = (await queryRunner.query(
      'SELECT id, schema_name FROM public.companies ORDER BY created_at, id',
    )) as CompanySchemaRow[];

    for (const company of companies) {
      const schema = quoteIdentifier(company.schema_name);
      await queryRunner.query(`
        ALTER TABLE ${schema}.orders
        DROP CONSTRAINT IF EXISTS orders_status_check
      `);
      await queryRunner.query(`
        ALTER TABLE ${schema}.order_status_history
        DROP CONSTRAINT IF EXISTS order_status_history_new_status_check
      `);
      await queryRunner.query(`
        UPDATE ${schema}.orders
        SET status = 'in_progress', closed_at = NULL
        WHERE status IN ('draft', 'open')
      `);
      await queryRunner.query(`
        UPDATE ${schema}.order_status_history
        SET previous_status = CASE
              WHEN previous_status IN ('draft', 'open') THEN 'in_progress'
              ELSE previous_status
            END,
            new_status = CASE
              WHEN new_status IN ('draft', 'open') THEN 'in_progress'
              ELSE new_status
            END
      `);
      await queryRunner.query(`
        DELETE FROM ${schema}.order_status_history
        WHERE previous_status IS NOT NULL AND previous_status = new_status
      `);
      await queryRunner.query(`
        ALTER TABLE ${schema}.orders
        ALTER COLUMN status SET DEFAULT 'in_progress',
        ADD CONSTRAINT orders_status_check
          CHECK (status IN ('in_progress', 'completed', 'cancelled'))
      `);
      await queryRunner.query(`
        ALTER TABLE ${schema}.order_status_history
        DROP COLUMN note,
        ADD CONSTRAINT order_status_history_new_status_check
          CHECK (new_status IN ('in_progress', 'completed', 'cancelled'))
      `);
      await queryRunner.query(
        `INSERT INTO public.tenant_schema_versions(company_id, version, migration_name)
         VALUES ($1, 5, $2) ON CONFLICT (company_id, version) DO NOTHING`,
        [company.id, this.name],
      );
    }
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    const companies = (await queryRunner.query(
      'SELECT id, schema_name FROM public.companies ORDER BY created_at DESC, id DESC',
    )) as CompanySchemaRow[];

    for (const company of companies) {
      const schema = quoteIdentifier(company.schema_name);
      await queryRunner.query(`
        ALTER TABLE ${schema}.orders
        DROP CONSTRAINT IF EXISTS orders_status_check,
        ALTER COLUMN status SET DEFAULT 'draft',
        ADD CONSTRAINT orders_status_check
          CHECK (status IN ('draft', 'open', 'in_progress', 'completed', 'cancelled'))
      `);
      await queryRunner.query(`
        ALTER TABLE ${schema}.order_status_history
        DROP CONSTRAINT IF EXISTS order_status_history_new_status_check,
        ADD COLUMN note varchar(500),
        ADD CONSTRAINT order_status_history_new_status_check
          CHECK (new_status IN ('draft', 'open', 'in_progress', 'completed', 'cancelled'))
      `);
      await queryRunner.query(
        'DELETE FROM public.tenant_schema_versions WHERE company_id = $1 AND version = 5',
        [company.id],
      );
    }
  }
}
