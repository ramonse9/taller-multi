import { MigrationInterface, QueryRunner } from 'typeorm';
import { quoteIdentifier } from '../../schema-name';

interface CompanySchemaRow {
  id: string;
  schema_name: string;
}

export class InventoryCostLots1700000015000 implements MigrationInterface {
  name = 'InventoryCostLots1700000015000';

  async up(queryRunner: QueryRunner): Promise<void> {
    const companies = (await queryRunner.query(
      'SELECT id, schema_name FROM public.companies ORDER BY created_at, id',
    )) as CompanySchemaRow[];

    for (const company of companies) {
      const schema = quoteIdentifier(company.schema_name);
      await queryRunner.query(`
        ALTER TABLE ${schema}.inventory_lots
        ADD COLUMN source_type varchar(24) NOT NULL DEFAULT 'purchase',
        ADD COLUMN source_reference varchar(250),
        ADD COLUMN created_by_user_id uuid REFERENCES public.users(id),
        ADD COLUMN entry_movement_id uuid UNIQUE
          REFERENCES ${schema}.inventory_movements(id) ON DELETE SET NULL,
        ADD CONSTRAINT inventory_lots_source_type_check
          CHECK (source_type IN ('opening_balance', 'manual_entry', 'adjustment', 'purchase', 'order_return'))
      `);
      await queryRunner.query(`
        WITH remaining AS (
          SELECT product_id, COALESCE(sum(remaining_quantity), 0) AS quantity
          FROM ${schema}.inventory_lots GROUP BY product_id
        )
        INSERT INTO ${schema}.inventory_lots(
          product_id, received_quantity, remaining_quantity, unit_cost,
          received_at, source_type, source_reference
        )
        SELECT concept.id,
               concept.stock - COALESCE(remaining.quantity, 0),
               concept.stock - COALESCE(remaining.quantity, 0),
               COALESCE((
                 SELECT movement.unit_cost
                 FROM ${schema}.inventory_movements movement
                 WHERE movement.product_id = concept.id AND movement.unit_cost IS NOT NULL
                 ORDER BY movement.created_at DESC, movement.id DESC LIMIT 1
               ), concept.cost),
               now(), 'opening_balance', 'Existencia previa a la gestión de lotes'
        FROM ${schema}.products_services concept
        LEFT JOIN remaining ON remaining.product_id = concept.id
        WHERE concept.tracks_inventory = true
          AND concept.stock > COALESCE(remaining.quantity, 0)
      `);
      await queryRunner.query(`
        CREATE TABLE ${schema}.inventory_lot_allocations (
          id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
          movement_id uuid NOT NULL REFERENCES ${schema}.inventory_movements(id) ON DELETE CASCADE,
          lot_id uuid NOT NULL REFERENCES ${schema}.inventory_lots(id),
          quantity numeric(12,3) NOT NULL CHECK (quantity > 0),
          unit_cost numeric(14,2) NOT NULL CHECK (unit_cost >= 0),
          created_at timestamptz NOT NULL DEFAULT now(),
          UNIQUE(movement_id, lot_id)
        )
      `);
      await queryRunner.query(
        `CREATE INDEX inventory_lot_allocations_lot_idx
         ON ${schema}.inventory_lot_allocations(lot_id, created_at, id)`,
      );
      await queryRunner.query(
        `INSERT INTO public.tenant_schema_versions(company_id, version, migration_name)
         VALUES ($1, 10, $2) ON CONFLICT (company_id, version) DO NOTHING`,
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
      await queryRunner.query(`DROP TABLE IF EXISTS ${schema}.inventory_lot_allocations`);
      await queryRunner.query(`
        DELETE FROM ${schema}.inventory_lots
        WHERE source_type = 'opening_balance' AND purchase_item_id IS NULL
      `);
      await queryRunner.query(`
        ALTER TABLE ${schema}.inventory_lots
        DROP CONSTRAINT IF EXISTS inventory_lots_source_type_check,
        DROP COLUMN IF EXISTS entry_movement_id,
        DROP COLUMN IF EXISTS created_by_user_id,
        DROP COLUMN IF EXISTS source_reference,
        DROP COLUMN IF EXISTS source_type
      `);
      await queryRunner.query(
        'DELETE FROM public.tenant_schema_versions WHERE company_id = $1 AND version = 10',
        [company.id],
      );
    }
  }
}
