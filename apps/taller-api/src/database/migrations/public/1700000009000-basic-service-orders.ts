import { MigrationInterface, QueryRunner } from 'typeorm';
import { quoteIdentifier } from '../../schema-name';

interface CompanySchemaRow {
  id: string;
  schema_name: string;
}

export class BasicServiceOrders1700000009000 implements MigrationInterface {
  name = 'BasicServiceOrders1700000009000';

  async up(queryRunner: QueryRunner): Promise<void> {
    const companies = (await queryRunner.query(
      'SELECT id, schema_name FROM public.companies ORDER BY created_at, id',
    )) as CompanySchemaRow[];

    for (const company of companies) {
      const schema = quoteIdentifier(company.schema_name);
      const orders = `${schema}.orders`;
      const items = `${schema}.order_items`;

      await queryRunner.query(`
        ALTER TABLE ${orders}
        ADD COLUMN updated_by_user_id uuid REFERENCES public.users(id),
        ALTER COLUMN subtotal DROP NOT NULL,
        ALTER COLUMN subtotal DROP DEFAULT,
        ALTER COLUMN total DROP NOT NULL,
        ALTER COLUMN total DROP DEFAULT
      `);
      await queryRunner.query(
        `UPDATE ${orders} SET updated_by_user_id = created_by_user_id WHERE updated_by_user_id IS NULL`,
      );
      await queryRunner.query(
        `ALTER TABLE ${orders} ALTER COLUMN updated_by_user_id SET NOT NULL`,
      );
      await queryRunner.query(`
        ALTER TABLE ${orders}
        ADD CONSTRAINT orders_vehicle_required CHECK (vehicle_id IS NOT NULL) NOT VALID
      `);
      await queryRunner.query(
        `CREATE INDEX orders_customer_created_idx ON ${orders}(customer_id, created_at DESC)`,
      );
      await queryRunner.query(
        `CREATE INDEX orders_vehicle_created_idx ON ${orders}(vehicle_id, created_at DESC)`,
      );

      await queryRunner.query(`
        ALTER TABLE ${items}
        ALTER COLUMN unit_price DROP NOT NULL,
        ALTER COLUMN total DROP NOT NULL,
        ADD COLUMN position integer
      `);
      await queryRunner.query(`
        WITH positions AS (
          SELECT id, row_number() OVER (PARTITION BY order_id ORDER BY created_at, id) AS position
          FROM ${items}
        )
        UPDATE ${items} item SET position = positions.position
        FROM positions WHERE positions.id = item.id
      `);
      await queryRunner.query(`
        ALTER TABLE ${items}
        ALTER COLUMN position SET NOT NULL,
        ADD CONSTRAINT order_items_position_positive CHECK (position > 0),
        ADD CONSTRAINT order_items_order_position_unique UNIQUE(order_id, position)
      `);

      await queryRunner.query(`
        CREATE TABLE ${schema}.order_status_history (
          id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
          order_id uuid NOT NULL REFERENCES ${orders}(id) ON DELETE CASCADE,
          previous_status varchar(24),
          new_status varchar(24) NOT NULL
            CHECK (new_status IN ('draft','open','in_progress','completed','cancelled')),
          note varchar(500),
          changed_by_user_id uuid NOT NULL REFERENCES public.users(id),
          changed_at timestamptz NOT NULL DEFAULT now()
        )
      `);
      await queryRunner.query(`
        CREATE INDEX order_status_history_order_date_idx
        ON ${schema}.order_status_history(order_id, changed_at, id)
      `);
      await queryRunner.query(`
        INSERT INTO ${schema}.order_status_history(
          order_id, previous_status, new_status, note, changed_by_user_id, changed_at
        )
        SELECT id, NULL, status, 'Estado inicial migrado', created_by_user_id, created_at
        FROM ${orders}
      `);
      await queryRunner.query(
        `INSERT INTO public.tenant_schema_versions(company_id, version, migration_name)
         VALUES ($1, 4, $2) ON CONFLICT (company_id, version) DO NOTHING`,
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
      const orders = `${schema}.orders`;
      const items = `${schema}.order_items`;
      await queryRunner.query(`DROP TABLE IF EXISTS ${schema}.order_status_history`);
      await queryRunner.query(`DROP INDEX IF EXISTS ${schema}.orders_vehicle_created_idx`);
      await queryRunner.query(`DROP INDEX IF EXISTS ${schema}.orders_customer_created_idx`);
      await queryRunner.query(`
        ALTER TABLE ${items}
        DROP CONSTRAINT IF EXISTS order_items_order_position_unique,
        DROP CONSTRAINT IF EXISTS order_items_position_positive,
        DROP COLUMN IF EXISTS position
      `);
      await queryRunner.query(
        `UPDATE ${items} SET unit_price = 0, total = 0 WHERE unit_price IS NULL OR total IS NULL`,
      );
      await queryRunner.query(`
        ALTER TABLE ${items}
        ALTER COLUMN unit_price SET NOT NULL,
        ALTER COLUMN total SET NOT NULL
      `);
      await queryRunner.query(`
        ALTER TABLE ${orders}
        DROP CONSTRAINT IF EXISTS orders_vehicle_required,
        DROP COLUMN IF EXISTS updated_by_user_id
      `);
      await queryRunner.query(
        `UPDATE ${orders} SET subtotal = 0, total = 0 WHERE subtotal IS NULL OR total IS NULL`,
      );
      await queryRunner.query(`
        ALTER TABLE ${orders}
        ALTER COLUMN subtotal SET DEFAULT 0,
        ALTER COLUMN subtotal SET NOT NULL,
        ALTER COLUMN total SET DEFAULT 0,
        ALTER COLUMN total SET NOT NULL
      `);
      await queryRunner.query(
        'DELETE FROM public.tenant_schema_versions WHERE company_id = $1 AND version = 4',
        [company.id],
      );
    }
  }
}
