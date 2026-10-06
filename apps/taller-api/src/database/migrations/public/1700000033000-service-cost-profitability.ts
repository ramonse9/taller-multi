import { MigrationInterface, QueryRunner } from 'typeorm';
import { quoteIdentifier } from '../../schema-name';

interface CompanySchemaRow {
  id: string;
  schema_name: string;
}

export class ServiceCostProfitability1700000033000 implements MigrationInterface {
  name = 'ServiceCostProfitability1700000033000';

  async up(queryRunner: QueryRunner): Promise<void> {
    const companies = (await queryRunner.query(
      'SELECT id, schema_name FROM public.companies ORDER BY created_at, id',
    )) as CompanySchemaRow[];

    for (const company of companies) {
      const schema = quoteIdentifier(company.schema_name);
      await queryRunner.query(`
        UPDATE ${schema}.orders service_order
        SET total_cost = totals.total_cost,
            gross_profit = CASE
              WHEN service_order.total IS NULL OR totals.has_unknown_product_cost THEN NULL
              ELSE service_order.total - totals.total_cost
            END
        FROM (
          SELECT item.order_id,
                 COALESCE(sum(item.cost_total), 0) AS total_cost,
                 count(*) FILTER (
                   WHERE item.kind = 'product'
                     AND item.product_service_id IS NULL
                     AND item.cost_total IS NULL
                 ) > 0 AS has_unknown_product_cost
          FROM ${schema}.order_items item
          GROUP BY item.order_id
        ) totals
        WHERE totals.order_id = service_order.id
      `);
      await queryRunner.query(
        `INSERT INTO public.tenant_schema_versions(company_id, version, migration_name)
         VALUES ($1, 23, $2) ON CONFLICT (company_id, version) DO NOTHING`,
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
        UPDATE ${schema}.orders service_order
        SET total_cost = totals.total_cost,
            gross_profit = CASE
              WHEN service_order.total IS NULL OR totals.has_unknown_cost THEN NULL
              ELSE service_order.total - totals.total_cost
            END
        FROM (
          SELECT item.order_id,
                 COALESCE(sum(item.cost_total), 0) AS total_cost,
                 count(*) FILTER (WHERE item.cost_total IS NULL) > 0 AS has_unknown_cost
          FROM ${schema}.order_items item
          GROUP BY item.order_id
        ) totals
        WHERE totals.order_id = service_order.id
      `);
      await queryRunner.query(
        'DELETE FROM public.tenant_schema_versions WHERE company_id = $1 AND version = 23',
        [company.id],
      );
    }
  }
}
