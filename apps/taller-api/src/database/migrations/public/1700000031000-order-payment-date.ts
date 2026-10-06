import { MigrationInterface, QueryRunner } from 'typeorm';
import { quoteIdentifier } from '../../schema-name';

interface CompanySchemaRow {
  id: string;
  schema_name: string;
}

export class OrderPaymentDate1700000031000 implements MigrationInterface {
  name = 'OrderPaymentDate1700000031000';

  async up(queryRunner: QueryRunner): Promise<void> {
    const companies = (await queryRunner.query(
      'SELECT id, schema_name FROM public.companies ORDER BY created_at, id',
    )) as CompanySchemaRow[];

    for (const company of companies) {
      const schema = quoteIdentifier(company.schema_name);
      await queryRunner.query(`
        ALTER TABLE ${schema}.orders
        ADD COLUMN paid_at timestamptz
      `);
      await queryRunner.query(`
        UPDATE ${schema}.orders
        SET paid_at = COALESCE(closed_at, updated_at, created_at)
        WHERE is_paid = true
      `);
      await queryRunner.query(`
        ALTER TABLE ${schema}.orders
        ADD CONSTRAINT orders_payment_state_check
        CHECK ((is_paid = true AND paid_at IS NOT NULL) OR (is_paid = false AND paid_at IS NULL))
      `);
      await queryRunner.query(`
        CREATE INDEX orders_paid_at_idx
        ON ${schema}.orders(paid_at DESC)
        WHERE paid_at IS NOT NULL
      `);
      await queryRunner.query(
        `INSERT INTO public.tenant_schema_versions(company_id, version, migration_name)
         VALUES ($1, 21, $2) ON CONFLICT (company_id, version) DO NOTHING`,
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
      await queryRunner.query(`DROP INDEX IF EXISTS ${schema}.orders_paid_at_idx`);
      await queryRunner.query(
        `ALTER TABLE ${schema}.orders DROP CONSTRAINT IF EXISTS orders_payment_state_check`,
      );
      await queryRunner.query(`ALTER TABLE ${schema}.orders DROP COLUMN IF EXISTS paid_at`);
      await queryRunner.query(
        'DELETE FROM public.tenant_schema_versions WHERE company_id = $1 AND version = 21',
        [company.id],
      );
    }
  }
}
