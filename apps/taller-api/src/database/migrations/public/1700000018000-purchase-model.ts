import { MigrationInterface, QueryRunner } from 'typeorm';
import { quoteIdentifier } from '../../schema-name';

interface CompanySchemaRow {
  id: string;
  schema_name: string;
}

export class PurchaseModel1700000018000 implements MigrationInterface {
  name = 'PurchaseModel1700000018000';

  async up(queryRunner: QueryRunner): Promise<void> {
    const companies = (await queryRunner.query(
      'SELECT id, schema_name FROM public.companies ORDER BY created_at, id',
    )) as CompanySchemaRow[];

    for (const company of companies) {
      const schema = quoteIdentifier(company.schema_name);
      await queryRunner.query(`
        ALTER TABLE ${schema}.purchases
        ADD COLUMN reference varchar(120),
        ADD COLUMN notes text,
        ADD COLUMN updated_by_user_id uuid REFERENCES public.users(id),
        ADD COLUMN confirmed_at timestamptz,
        ADD COLUMN cancelled_at timestamptz
      `);
      await queryRunner.query(`
        UPDATE ${schema}.purchases
        SET updated_by_user_id = created_by_user_id
        WHERE updated_by_user_id IS NULL
      `);
      await queryRunner.query(`
        ALTER TABLE ${schema}.purchases
        ALTER COLUMN updated_by_user_id SET NOT NULL
      `);
      await queryRunner.query(`
        ALTER TABLE ${schema}.purchase_items
        ADD COLUMN position integer,
        ADD COLUMN product_name varchar(180),
        ADD COLUMN product_sku varchar(80),
        ADD COLUMN unit_name varchar(80),
        ADD COLUMN unit_symbol varchar(20),
        ADD COLUMN created_at timestamptz NOT NULL DEFAULT now()
      `);
      await queryRunner.query(`
        WITH numbered AS (
          SELECT item.id, row_number() OVER (
            PARTITION BY item.purchase_id ORDER BY item.id
          )::integer AS position
          FROM ${schema}.purchase_items item
        )
        UPDATE ${schema}.purchase_items item
        SET position = numbered.position,
            product_name = concept.name,
            product_sku = concept.sku,
            unit_name = unit.name,
            unit_symbol = unit.symbol
        FROM numbered, ${schema}.products_services concept
        JOIN ${schema}.measurement_units unit ON unit.id = concept.unit_id
        WHERE item.id = numbered.id AND concept.id = item.product_id
      `);
      await queryRunner.query(`
        ALTER TABLE ${schema}.purchase_items
        ALTER COLUMN position SET NOT NULL,
        ALTER COLUMN product_name SET NOT NULL,
        ALTER COLUMN unit_name SET NOT NULL,
        ALTER COLUMN unit_symbol SET NOT NULL,
        ADD CONSTRAINT purchase_items_position_unique UNIQUE(purchase_id, position)
      `);
      await queryRunner.query(
        `CREATE INDEX purchases_status_date_idx
         ON ${schema}.purchases(status, purchased_at DESC, id DESC)`,
      );
      await queryRunner.query(
        `CREATE INDEX purchases_supplier_date_idx
         ON ${schema}.purchases(supplier_id, purchased_at DESC, id DESC)`,
      );
      await queryRunner.query(
        `INSERT INTO public.tenant_schema_versions(company_id, version, migration_name)
         VALUES ($1, 13, $2) ON CONFLICT (company_id, version) DO NOTHING`,
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
      await queryRunner.query(`DROP INDEX IF EXISTS ${schema}.purchases_supplier_date_idx`);
      await queryRunner.query(`DROP INDEX IF EXISTS ${schema}.purchases_status_date_idx`);
      await queryRunner.query(`
        ALTER TABLE ${schema}.purchase_items
        DROP CONSTRAINT IF EXISTS purchase_items_position_unique,
        DROP COLUMN IF EXISTS created_at,
        DROP COLUMN IF EXISTS unit_symbol,
        DROP COLUMN IF EXISTS unit_name,
        DROP COLUMN IF EXISTS product_sku,
        DROP COLUMN IF EXISTS product_name,
        DROP COLUMN IF EXISTS position
      `);
      await queryRunner.query(`
        ALTER TABLE ${schema}.purchases
        DROP COLUMN IF EXISTS cancelled_at,
        DROP COLUMN IF EXISTS confirmed_at,
        DROP COLUMN IF EXISTS updated_by_user_id,
        DROP COLUMN IF EXISTS notes,
        DROP COLUMN IF EXISTS reference
      `);
      await queryRunner.query(
        'DELETE FROM public.tenant_schema_versions WHERE company_id = $1 AND version = 13',
        [company.id],
      );
    }
  }
}
