import { MigrationInterface, QueryRunner } from 'typeorm';
import { quoteIdentifier } from '../../schema-name';

interface CompanySchemaRow {
  id: string;
  schema_name: string;
}

export class Inventory1700000012000 implements MigrationInterface {
  name = 'Inventory1700000012000';

  async up(queryRunner: QueryRunner): Promise<void> {
    const companies = (await queryRunner.query(
      'SELECT id, schema_name FROM public.companies ORDER BY created_at, id',
    )) as CompanySchemaRow[];

    for (const company of companies) {
      const schema = quoteIdentifier(company.schema_name);
      await queryRunner.query(`
        ALTER TABLE ${schema}.products_services
        ADD COLUMN stock numeric(14,3) NOT NULL DEFAULT 0 CHECK (stock >= 0),
        ADD COLUMN minimum_stock numeric(14,3) NOT NULL DEFAULT 0 CHECK (minimum_stock >= 0)
      `);
      await queryRunner.query(
        `CREATE INDEX products_services_low_stock_idx
         ON ${schema}.products_services(stock, minimum_stock)
         WHERE tracks_inventory = true AND is_active = true`,
      );

      await queryRunner.query(`
        ALTER TABLE ${schema}.inventory_movements
        DROP CONSTRAINT IF EXISTS inventory_movements_movement_type_check,
        DROP CONSTRAINT IF EXISTS inventory_movements_quantity_check,
        ADD COLUMN previous_stock numeric(14,3),
        ADD COLUMN resulting_stock numeric(14,3)
      `);
      await queryRunner.query(`
        UPDATE ${schema}.inventory_movements
        SET quantity = CASE
              WHEN movement_type = 'sale' THEN -abs(quantity)
              WHEN movement_type IN ('purchase', 'return') THEN abs(quantity)
              ELSE quantity
            END,
            movement_type = CASE
              WHEN movement_type IN ('purchase', 'return') THEN 'entry'
              WHEN movement_type = 'sale' THEN 'exit'
              ELSE 'adjustment'
            END,
            reason = COALESCE(NULLIF(trim(reason), ''), 'Movimiento migrado')
      `);
      await queryRunner.query(`
        WITH balances AS (
          SELECT id, quantity,
                 sum(quantity) OVER (
                   PARTITION BY product_id ORDER BY created_at, id
                   ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW
                 ) AS resulting_stock
          FROM ${schema}.inventory_movements
        )
        UPDATE ${schema}.inventory_movements movement
        SET previous_stock = balances.resulting_stock - balances.quantity,
            resulting_stock = balances.resulting_stock
        FROM balances WHERE balances.id = movement.id
      `);
      await queryRunner.query(`
        UPDATE ${schema}.products_services concept
        SET stock = balance.stock
        FROM (
          SELECT product_id, sum(quantity) AS stock
          FROM ${schema}.inventory_movements GROUP BY product_id
        ) balance
        WHERE balance.product_id = concept.id
      `);
      await queryRunner.query(`
        ALTER TABLE ${schema}.inventory_movements
        ALTER COLUMN reason SET NOT NULL,
        ALTER COLUMN previous_stock SET NOT NULL,
        ALTER COLUMN resulting_stock SET NOT NULL,
        ADD CONSTRAINT inventory_movements_type_check
          CHECK (movement_type IN ('entry', 'exit', 'adjustment')),
        ADD CONSTRAINT inventory_movements_quantity_direction_check
          CHECK (
            (movement_type = 'entry' AND quantity > 0) OR
            (movement_type = 'exit' AND quantity < 0) OR
            (movement_type = 'adjustment' AND quantity <> 0)
          ),
        ADD CONSTRAINT inventory_movements_balances_check
          CHECK (previous_stock >= 0 AND resulting_stock >= 0),
        ADD CONSTRAINT inventory_movements_unit_cost_check
          CHECK (unit_cost IS NULL OR unit_cost >= 0)
      `);
      await queryRunner.query(
        `INSERT INTO public.tenant_schema_versions(company_id, version, migration_name)
         VALUES ($1, 7, $2) ON CONFLICT (company_id, version) DO NOTHING`,
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
        ALTER TABLE ${schema}.inventory_movements
        DROP CONSTRAINT IF EXISTS inventory_movements_unit_cost_check,
        DROP CONSTRAINT IF EXISTS inventory_movements_balances_check,
        DROP CONSTRAINT IF EXISTS inventory_movements_quantity_direction_check,
        DROP CONSTRAINT IF EXISTS inventory_movements_type_check,
        ALTER COLUMN reason DROP NOT NULL,
        DROP COLUMN IF EXISTS resulting_stock,
        DROP COLUMN IF EXISTS previous_stock
      `);
      await queryRunner.query(`
        UPDATE ${schema}.inventory_movements
        SET movement_type = CASE
              WHEN movement_type = 'entry' THEN 'purchase'
              WHEN movement_type = 'exit' THEN 'sale'
              ELSE 'adjustment'
            END,
            quantity = abs(quantity)
      `);
      await queryRunner.query(`
        ALTER TABLE ${schema}.inventory_movements
        ADD CONSTRAINT inventory_movements_movement_type_check
          CHECK (movement_type IN ('purchase', 'sale', 'adjustment', 'return')),
        ADD CONSTRAINT inventory_movements_quantity_check CHECK (quantity <> 0)
      `);
      await queryRunner.query(`DROP INDEX IF EXISTS ${schema}.products_services_low_stock_idx`);
      await queryRunner.query(`
        ALTER TABLE ${schema}.products_services
        DROP COLUMN IF EXISTS minimum_stock,
        DROP COLUMN IF EXISTS stock
      `);
      await queryRunner.query(
        'DELETE FROM public.tenant_schema_versions WHERE company_id = $1 AND version = 7',
        [company.id],
      );
    }
  }
}
