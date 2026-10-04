import { MigrationInterface, QueryRunner } from 'typeorm';
import { quoteIdentifier } from '../../schema-name';

interface CompanySchemaRow {
  id: string;
  schema_name: string;
}

export class OptionalOrderItemCosts1700000026000 implements MigrationInterface {
  name = 'OptionalOrderItemCosts1700000026000';

  async up(queryRunner: QueryRunner): Promise<void> {
    const companies = (await queryRunner.query(
      'SELECT id, schema_name FROM public.companies ORDER BY created_at, id',
    )) as CompanySchemaRow[];

    for (const company of companies) {
      const schema = quoteIdentifier(company.schema_name);
      await queryRunner.query(`
        ALTER TABLE ${schema}.order_items
        DROP CONSTRAINT IF EXISTS order_items_free_product_cost_check
      `);
      await queryRunner.query(
        `INSERT INTO public.tenant_schema_versions(company_id, version, migration_name)
         VALUES ($1, 18, $2) ON CONFLICT (company_id, version) DO NOTHING`,
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
        UPDATE ${schema}.order_items
        SET unit_cost = COALESCE(unit_cost, 0),
            cost_total = COALESCE(cost_total, 0)
        WHERE product_service_id IS NULL
          AND kind = 'product'
          AND unit_cost IS NULL
      `);
      await queryRunner.query(`
        ALTER TABLE ${schema}.order_items
        ADD CONSTRAINT order_items_free_product_cost_check CHECK (
          product_service_id IS NOT NULL OR kind <> 'product' OR unit_cost IS NOT NULL
        )
      `);
      await queryRunner.query(
        'DELETE FROM public.tenant_schema_versions WHERE company_id = $1 AND version = 18',
        [company.id],
      );
    }
  }
}
