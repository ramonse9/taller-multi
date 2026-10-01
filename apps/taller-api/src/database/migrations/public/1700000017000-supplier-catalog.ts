import { MigrationInterface, QueryRunner } from 'typeorm';
import { quoteIdentifier } from '../../schema-name';

interface CompanySchemaRow {
  id: string;
  schema_name: string;
}

export class SupplierCatalog1700000017000 implements MigrationInterface {
  name = 'SupplierCatalog1700000017000';

  async up(queryRunner: QueryRunner): Promise<void> {
    const companies = (await queryRunner.query(
      'SELECT id, schema_name FROM public.companies ORDER BY created_at, id',
    )) as CompanySchemaRow[];

    for (const company of companies) {
      const schema = quoteIdentifier(company.schema_name);
      await queryRunner.query(`
        ALTER TABLE ${schema}.suppliers
        DROP CONSTRAINT IF EXISTS suppliers_name_key,
        ALTER COLUMN created_by_user_id DROP NOT NULL,
        ADD COLUMN legal_name varchar(180),
        ADD COLUMN notes text,
        ADD COLUMN is_system boolean NOT NULL DEFAULT false,
        ADD COLUMN updated_by_user_id uuid REFERENCES public.users(id),
        ADD CONSTRAINT suppliers_system_active_check CHECK (NOT is_system OR is_active)
      `);
      await queryRunner.query(`
        UPDATE ${schema}.suppliers
        SET updated_by_user_id = created_by_user_id
        WHERE updated_by_user_id IS NULL
      `);
      await queryRunner.query(
        `CREATE UNIQUE INDEX suppliers_name_unique
         ON ${schema}.suppliers(lower(name))`,
      );
      await queryRunner.query(
        `CREATE UNIQUE INDEX suppliers_tax_id_unique
         ON ${schema}.suppliers(upper(tax_id)) WHERE tax_id IS NOT NULL`,
      );
      await queryRunner.query(
        `CREATE UNIQUE INDEX suppliers_single_system_idx
         ON ${schema}.suppliers(is_system) WHERE is_system = true`,
      );
      await queryRunner.query(`
        INSERT INTO ${schema}.suppliers(name, is_system)
        VALUES ('Proveedor general', true)
        ON CONFLICT DO NOTHING
      `);
      await queryRunner.query(
        `INSERT INTO public.tenant_schema_versions(company_id, version, migration_name)
         VALUES ($1, 12, $2) ON CONFLICT (company_id, version) DO NOTHING`,
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
        DELETE FROM ${schema}.suppliers supplier
        WHERE supplier.is_system = true
          AND NOT EXISTS (SELECT 1 FROM ${schema}.purchases WHERE supplier_id = supplier.id)
          AND NOT EXISTS (SELECT 1 FROM ${schema}.expenses WHERE supplier_id = supplier.id)
      `);
      await queryRunner.query(
        `
        UPDATE ${schema}.suppliers
        SET created_by_user_id = COALESCE(
          created_by_user_id,
          (SELECT id FROM public.users WHERE company_id = $1 ORDER BY created_at, id LIMIT 1)
        )
      `,
        [company.id],
      );
      await queryRunner.query(`DROP INDEX IF EXISTS ${schema}.suppliers_single_system_idx`);
      await queryRunner.query(`DROP INDEX IF EXISTS ${schema}.suppliers_tax_id_unique`);
      await queryRunner.query(`DROP INDEX IF EXISTS ${schema}.suppliers_name_unique`);
      await queryRunner.query(`
        ALTER TABLE ${schema}.suppliers
        DROP CONSTRAINT IF EXISTS suppliers_system_active_check,
        DROP COLUMN IF EXISTS updated_by_user_id,
        DROP COLUMN IF EXISTS is_system,
        DROP COLUMN IF EXISTS notes,
        DROP COLUMN IF EXISTS legal_name,
        ALTER COLUMN created_by_user_id SET NOT NULL,
        ADD CONSTRAINT suppliers_name_key UNIQUE(name)
      `);
      await queryRunner.query(
        'DELETE FROM public.tenant_schema_versions WHERE company_id = $1 AND version = 12',
        [company.id],
      );
    }
  }
}
