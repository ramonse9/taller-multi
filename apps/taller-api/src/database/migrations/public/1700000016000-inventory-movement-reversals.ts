import { MigrationInterface, QueryRunner } from 'typeorm';
import { quoteIdentifier } from '../../schema-name';

interface CompanySchemaRow {
  id: string;
  schema_name: string;
}

export class InventoryMovementReversals1700000016000 implements MigrationInterface {
  name = 'InventoryMovementReversals1700000016000';

  async up(queryRunner: QueryRunner): Promise<void> {
    const companies = (await queryRunner.query(
      'SELECT id, schema_name FROM public.companies ORDER BY created_at, id',
    )) as CompanySchemaRow[];

    for (const company of companies) {
      const schema = quoteIdentifier(company.schema_name);
      await queryRunner.query(`
        ALTER TABLE ${schema}.inventory_movements
        ADD COLUMN reverses_movement_id uuid
          REFERENCES ${schema}.inventory_movements(id) ON DELETE SET NULL
      `);
      await queryRunner.query(`
        WITH reversal_pairs AS (
          SELECT reversal.id AS reversal_id,
                 (
                   SELECT movement.id
                   FROM ${schema}.inventory_movements movement
                   WHERE movement.order_item_id = reversal.order_item_id
                     AND movement.order_id = reversal.order_id
                     AND movement.movement_type = 'exit'
                     AND movement.created_at <= reversal.created_at
                   ORDER BY movement.created_at DESC, movement.id DESC
                   LIMIT 1
                 ) AS exit_id
          FROM ${schema}.inventory_movements reversal
          WHERE reversal.movement_type = 'entry'
            AND reversal.order_id IS NOT NULL
            AND reversal.order_item_id IS NOT NULL
        )
        UPDATE ${schema}.inventory_movements reversal
        SET reverses_movement_id = reversal_pairs.exit_id
        FROM reversal_pairs
        WHERE reversal.id = reversal_pairs.reversal_id
          AND reversal_pairs.exit_id IS NOT NULL
      `);
      await queryRunner.query(
        `CREATE UNIQUE INDEX inventory_movements_single_reversal_idx
         ON ${schema}.inventory_movements(reverses_movement_id)
         WHERE reverses_movement_id IS NOT NULL`,
      );
      await queryRunner.query(
        `INSERT INTO public.tenant_schema_versions(company_id, version, migration_name)
         VALUES ($1, 11, $2) ON CONFLICT (company_id, version) DO NOTHING`,
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
        `DROP INDEX IF EXISTS ${schema}.inventory_movements_single_reversal_idx`,
      );
      await queryRunner.query(`
        ALTER TABLE ${schema}.inventory_movements
        DROP COLUMN IF EXISTS reverses_movement_id
      `);
      await queryRunner.query(
        'DELETE FROM public.tenant_schema_versions WHERE company_id = $1 AND version = 11',
        [company.id],
      );
    }
  }
}
