import { MigrationInterface, QueryRunner } from 'typeorm';
import { quoteIdentifier } from '../../schema-name';

interface CompanySchemaRow {
  id: string;
  schema_name: string;
}

export class PurchaseInventoryTraceability1700000019000 implements MigrationInterface {
  name = 'PurchaseInventoryTraceability1700000019000';

  async up(queryRunner: QueryRunner): Promise<void> {
    const companies = (await queryRunner.query(
      'SELECT id, schema_name FROM public.companies ORDER BY created_at, id',
    )) as CompanySchemaRow[];

    for (const company of companies) {
      const schema = quoteIdentifier(company.schema_name);
      await queryRunner.query(`
        ALTER TABLE ${schema}.inventory_movements
        ADD COLUMN purchase_id uuid REFERENCES ${schema}.purchases(id) ON DELETE SET NULL,
        ADD COLUMN purchase_item_id uuid REFERENCES ${schema}.purchase_items(id) ON DELETE SET NULL
      `);
      await queryRunner.query(`
        UPDATE ${schema}.inventory_movements movement
        SET purchase_id = item.purchase_id,
            purchase_item_id = item.id
        FROM ${schema}.inventory_lots lot
        JOIN ${schema}.purchase_items item ON item.id = lot.purchase_item_id
        WHERE movement.lot_id = lot.id
          AND movement.purchase_item_id IS NULL
      `);
      await queryRunner.query(
        `CREATE UNIQUE INDEX inventory_lots_purchase_item_unique
         ON ${schema}.inventory_lots(purchase_item_id) WHERE purchase_item_id IS NOT NULL`,
      );
      await queryRunner.query(
        `CREATE INDEX inventory_movements_purchase_date_idx
         ON ${schema}.inventory_movements(purchase_id, created_at, id)
         WHERE purchase_id IS NOT NULL`,
      );
      await queryRunner.query(
        `CREATE UNIQUE INDEX inventory_movements_purchase_item_entry_unique
         ON ${schema}.inventory_movements(purchase_item_id)
         WHERE purchase_item_id IS NOT NULL AND movement_type = 'entry'`,
      );
      await queryRunner.query(
        `INSERT INTO public.tenant_schema_versions(company_id, version, migration_name)
         VALUES ($1, 14, $2) ON CONFLICT (company_id, version) DO NOTHING`,
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
      await queryRunner.query(
        `DROP INDEX IF EXISTS ${schema}.inventory_movements_purchase_item_entry_unique`,
      );
      await queryRunner.query(
        `DROP INDEX IF EXISTS ${schema}.inventory_movements_purchase_date_idx`,
      );
      await queryRunner.query(`DROP INDEX IF EXISTS ${schema}.inventory_lots_purchase_item_unique`);
      await queryRunner.query(`
        ALTER TABLE ${schema}.inventory_movements
        DROP COLUMN IF EXISTS purchase_item_id,
        DROP COLUMN IF EXISTS purchase_id
      `);
      await queryRunner.query(
        'DELETE FROM public.tenant_schema_versions WHERE company_id = $1 AND version = 14',
        [company.id],
      );
    }
  }
}
