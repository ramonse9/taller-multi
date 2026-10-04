import { MigrationInterface, QueryRunner } from 'typeorm';
import { quoteIdentifier } from '../../schema-name';

interface CompanySchemaRow {
  id: string;
  schema_name: string;
}

export class OrderItemKind1700000025000 implements MigrationInterface {
  name = 'OrderItemKind1700000025000';

  async up(queryRunner: QueryRunner): Promise<void> {
    const companies = (await queryRunner.query(
      'SELECT id, schema_name FROM public.companies ORDER BY created_at, id',
    )) as CompanySchemaRow[];

    for (const company of companies) {
      const schema = quoteIdentifier(company.schema_name);
      await queryRunner.query(`
        ALTER TABLE ${schema}.order_items
        ADD COLUMN kind varchar(10)
      `);
      await queryRunner.query(`
        UPDATE ${schema}.order_items item
        SET kind = concept.kind
        FROM ${schema}.products_services concept
        WHERE item.product_service_id = concept.id
      `);
      await queryRunner.query(`
        UPDATE ${schema}.order_items
        SET kind = 'service',
            unit_name = CASE WHEN unit_name = 'Unidad' THEN 'Servicio' ELSE unit_name END,
            unit_symbol = CASE WHEN unit_symbol = 'u' THEN 'serv' ELSE unit_symbol END,
            unit_cost = COALESCE(unit_cost, 0),
            cost_total = COALESCE(cost_total, 0)
        WHERE product_service_id IS NULL
      `);
      await queryRunner.query(`
        ALTER TABLE ${schema}.order_items
        ALTER COLUMN kind SET NOT NULL,
        ADD CONSTRAINT order_items_kind_check CHECK (kind IN ('product','service')),
        ADD CONSTRAINT order_items_free_product_cost_check CHECK (
          product_service_id IS NOT NULL OR kind <> 'product' OR unit_cost IS NOT NULL
        )
      `);
      await queryRunner.query(`
        UPDATE ${schema}.orders service_order
        SET total_cost = totals.total_cost,
            gross_profit = CASE
              WHEN service_order.total IS NULL OR totals.total_cost IS NULL THEN NULL
              ELSE service_order.total - totals.total_cost
            END
        FROM (
          SELECT order_id,
                 CASE WHEN count(*) FILTER (WHERE cost_total IS NULL) > 0 THEN NULL
                      ELSE COALESCE(sum(cost_total), 0) END AS total_cost
          FROM ${schema}.order_items GROUP BY order_id
        ) totals
        WHERE totals.order_id = service_order.id
      `);
      await queryRunner.query(
        `INSERT INTO public.tenant_schema_versions(company_id, version, migration_name)
         VALUES ($1, 17, $2) ON CONFLICT (company_id, version) DO NOTHING`,
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
        DROP CONSTRAINT IF EXISTS order_items_free_product_cost_check,
        DROP CONSTRAINT IF EXISTS order_items_kind_check,
        DROP COLUMN IF EXISTS kind
      `);
      await queryRunner.query(
        'DELETE FROM public.tenant_schema_versions WHERE company_id = $1 AND version = 17',
        [company.id],
      );
    }
  }
}
