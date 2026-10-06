import { MigrationInterface, QueryRunner } from 'typeorm';
import { quoteIdentifier } from '../../schema-name';

interface CompanySchemaRow {
  id: string;
  schema_name: string;
}

export class OrderItemBillingBehavior1700000029000 implements MigrationInterface {
  name = 'OrderItemBillingBehavior1700000029000';

  async up(queryRunner: QueryRunner): Promise<void> {
    const companies = (await queryRunner.query(
      'SELECT id, schema_name FROM public.companies ORDER BY created_at, id',
    )) as CompanySchemaRow[];

    for (const company of companies) {
      const schema = quoteIdentifier(company.schema_name);
      await queryRunner.query(`
        ALTER TABLE ${schema}.order_items
        ADD COLUMN affects_order_total boolean NOT NULL DEFAULT true
      `);
      await queryRunner.query(
        `INSERT INTO public.tenant_schema_versions(company_id, version, migration_name)
         VALUES ($1, 19, $2) ON CONFLICT (company_id, version) DO NOTHING`,
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
        ALTER TABLE ${schema}.order_items
        DROP COLUMN IF EXISTS affects_order_total
      `);
      await queryRunner.query(
        'DELETE FROM public.tenant_schema_versions WHERE company_id = $1 AND version = 19',
        [company.id],
      );
    }
  }
}
