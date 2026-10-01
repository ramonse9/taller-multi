import { MigrationInterface, QueryRunner } from 'typeorm';
import { quoteIdentifier } from '../../schema-name';

interface CompanySchemaRow {
  id: string;
  schema_name: string;
}

export class OrderCatalogIntegration1700000013000 implements MigrationInterface {
  name = 'OrderCatalogIntegration1700000013000';

  async up(queryRunner: QueryRunner): Promise<void> {
    const companies = (await queryRunner.query(
      'SELECT id, schema_name FROM public.companies ORDER BY created_at, id',
    )) as CompanySchemaRow[];

    for (const company of companies) {
      const schema = quoteIdentifier(company.schema_name);
      await queryRunner.query(`
        ALTER TABLE ${schema}.orders
        ADD COLUMN total_cost numeric(14,2),
        ADD COLUMN gross_profit numeric(14,2),
        ADD COLUMN inventory_applied_at timestamptz,
        ADD CONSTRAINT orders_total_cost_check CHECK (total_cost IS NULL OR total_cost >= 0)
      `);
      await queryRunner.query(`
        ALTER TABLE ${schema}.order_items
        ADD COLUMN unit_name varchar(80) NOT NULL DEFAULT 'Unidad',
        ADD COLUMN unit_symbol varchar(20) NOT NULL DEFAULT 'u',
        ADD COLUMN unit_cost numeric(14,2),
        ADD COLUMN cost_total numeric(14,2),
        ADD COLUMN tracks_inventory boolean NOT NULL DEFAULT false,
        ADD CONSTRAINT order_items_unit_cost_check CHECK (unit_cost IS NULL OR unit_cost >= 0),
        ADD CONSTRAINT order_items_cost_total_check CHECK (cost_total IS NULL OR cost_total >= 0)
      `);
      await queryRunner.query(`
        UPDATE ${schema}.order_items item
        SET unit_name = unit.name,
            unit_symbol = unit.symbol,
            unit_cost = concept.cost,
            cost_total = round(item.quantity * concept.cost, 2),
            tracks_inventory = concept.tracks_inventory
        FROM ${schema}.products_services concept
        JOIN ${schema}.measurement_units unit ON unit.id = concept.unit_id
        WHERE item.product_service_id = concept.id
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
      await queryRunner.query(`
        ALTER TABLE ${schema}.inventory_movements
        DROP CONSTRAINT IF EXISTS inventory_movements_order_item_id_fkey,
        ADD CONSTRAINT inventory_movements_order_item_id_fkey
          FOREIGN KEY (order_item_id) REFERENCES ${schema}.order_items(id) ON DELETE SET NULL,
        ADD COLUMN order_id uuid REFERENCES ${schema}.orders(id) ON DELETE SET NULL
      `);
      await queryRunner.query(`
        UPDATE ${schema}.inventory_movements movement
        SET order_id = item.order_id
        FROM ${schema}.order_items item
        WHERE movement.order_item_id = item.id
      `);
      await queryRunner.query(
        `CREATE INDEX inventory_movements_order_date_idx
         ON ${schema}.inventory_movements(order_id, created_at, id)
         WHERE order_id IS NOT NULL`,
      );
      await queryRunner.query(
        `INSERT INTO public.tenant_schema_versions(company_id, version, migration_name)
         VALUES ($1, 8, $2) ON CONFLICT (company_id, version) DO NOTHING`,
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
      await queryRunner.query(`DROP INDEX IF EXISTS ${schema}.inventory_movements_order_date_idx`);
      await queryRunner.query(`
        ALTER TABLE ${schema}.inventory_movements
        DROP COLUMN IF EXISTS order_id,
        DROP CONSTRAINT IF EXISTS inventory_movements_order_item_id_fkey,
        ADD CONSTRAINT inventory_movements_order_item_id_fkey
          FOREIGN KEY (order_item_id) REFERENCES ${schema}.order_items(id)
      `);
      await queryRunner.query(`
        ALTER TABLE ${schema}.order_items
        DROP CONSTRAINT IF EXISTS order_items_cost_total_check,
        DROP CONSTRAINT IF EXISTS order_items_unit_cost_check,
        DROP COLUMN IF EXISTS tracks_inventory,
        DROP COLUMN IF EXISTS cost_total,
        DROP COLUMN IF EXISTS unit_cost,
        DROP COLUMN IF EXISTS unit_symbol,
        DROP COLUMN IF EXISTS unit_name
      `);
      await queryRunner.query(`
        ALTER TABLE ${schema}.orders
        DROP CONSTRAINT IF EXISTS orders_total_cost_check,
        DROP COLUMN IF EXISTS inventory_applied_at,
        DROP COLUMN IF EXISTS gross_profit,
        DROP COLUMN IF EXISTS total_cost
      `);
      await queryRunner.query(
        'DELETE FROM public.tenant_schema_versions WHERE company_id = $1 AND version = 8',
        [company.id],
      );
    }
  }
}
