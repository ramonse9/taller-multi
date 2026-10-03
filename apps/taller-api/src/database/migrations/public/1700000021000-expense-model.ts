import { MigrationInterface, QueryRunner } from 'typeorm';
import { quoteIdentifier } from '../../schema-name';

interface CompanySchemaRow {
  id: string;
  schema_name: string;
}

export class ExpenseModel1700000021000 implements MigrationInterface {
  name = 'ExpenseModel1700000021000';

  async up(queryRunner: QueryRunner): Promise<void> {
    const companies = (await queryRunner.query(
      'SELECT id, schema_name FROM public.companies ORDER BY created_at, id',
    )) as CompanySchemaRow[];

    for (const company of companies) {
      const schema = quoteIdentifier(company.schema_name);
      await queryRunner.query(`
        ALTER TABLE ${schema}.expense_categories
        ADD COLUMN code varchar(30),
        ADD COLUMN is_system boolean NOT NULL DEFAULT false
      `);
      await queryRunner.query(`
        UPDATE ${schema}.expense_categories SET code = CASE lower(name)
          WHEN 'renta' THEN 'rent'
          WHEN 'nómina' THEN 'payroll'
          WHEN 'nomina' THEN 'payroll'
          WHEN 'servicios' THEN 'utilities'
          WHEN 'herramientas' THEN 'tools'
          WHEN 'transporte' THEN 'transportation'
          WHEN 'otros' THEN 'other'
          ELSE 'legacy_' || replace(id::text, '-', '')
        END
      `);
      await queryRunner.query(`
        INSERT INTO ${schema}.expense_categories(code, name, is_system)
        SELECT seed.code, seed.name, true
        FROM (VALUES
          ('rent', 'Renta'), ('payroll', 'Nómina'), ('utilities', 'Servicios'),
          ('tools', 'Herramientas'), ('transportation', 'Transporte'), ('other', 'Otros')
        ) AS seed(code, name)
        WHERE NOT EXISTS (
          SELECT 1 FROM ${schema}.expense_categories category WHERE category.code = seed.code
        )
      `);
      await queryRunner.query(`
        UPDATE ${schema}.expense_categories SET is_system = true
        WHERE code IN ('rent','payroll','utilities','tools','transportation','other')
      `);
      await queryRunner.query(`
        ALTER TABLE ${schema}.expense_categories
        ALTER COLUMN code SET NOT NULL,
        ADD CONSTRAINT expense_categories_code_unique UNIQUE(code)
      `);
      await queryRunner.query(
        `CREATE UNIQUE INDEX expense_categories_name_unique
         ON ${schema}.expense_categories(lower(name))`,
      );

      await queryRunner.query(`
        ALTER TABLE ${schema}.expenses
        ADD COLUMN reference varchar(120),
        ADD COLUMN notes text,
        ADD COLUMN status varchar(20) NOT NULL DEFAULT 'draft',
        ADD COLUMN recurrence_type varchar(20) NOT NULL DEFAULT 'one_time',
        ADD COLUMN receipt_file_key varchar(500),
        ADD COLUMN confirmed_at timestamptz,
        ADD COLUMN cancelled_at timestamptz,
        ADD COLUMN updated_by_user_id uuid REFERENCES public.users(id)
      `);
      await queryRunner.query(`
        UPDATE ${schema}.expenses expense
        SET supplier_id = COALESCE(expense.supplier_id, default_supplier.id),
            updated_by_user_id = expense.created_by_user_id
        FROM ${schema}.suppliers default_supplier
        WHERE default_supplier.is_system = true
          AND (expense.supplier_id IS NULL OR expense.updated_by_user_id IS NULL)
      `);
      await queryRunner.query(`
        ALTER TABLE ${schema}.expenses
        ALTER COLUMN supplier_id SET NOT NULL,
        ALTER COLUMN updated_by_user_id SET NOT NULL,
        ADD CONSTRAINT expenses_status_check
          CHECK (status IN ('draft','confirmed','cancelled')),
        ADD CONSTRAINT expenses_recurrence_type_check
          CHECK (recurrence_type IN ('one_time','recurring'))
      `);
      await queryRunner.query(`DROP INDEX IF EXISTS ${schema}.expenses_occurred_on_idx`);
      await queryRunner.query(
        `CREATE INDEX expenses_status_date_idx
         ON ${schema}.expenses(status, occurred_on DESC, id DESC)`,
      );
      await queryRunner.query(
        `CREATE INDEX expenses_category_date_idx
         ON ${schema}.expenses(category_id, occurred_on DESC, id DESC)`,
      );
      await queryRunner.query(
        `CREATE INDEX expenses_supplier_date_idx
         ON ${schema}.expenses(supplier_id, occurred_on DESC, id DESC)`,
      );
      await queryRunner.query(`
        CREATE TABLE ${schema}.expense_status_history (
          id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
          expense_id uuid NOT NULL REFERENCES ${schema}.expenses(id) ON DELETE CASCADE,
          previous_status varchar(20),
          new_status varchar(20) NOT NULL,
          changed_by_user_id uuid NOT NULL REFERENCES public.users(id),
          changed_at timestamptz NOT NULL DEFAULT now(),
          CONSTRAINT expense_status_history_previous_check
            CHECK (previous_status IS NULL OR previous_status IN ('draft','confirmed','cancelled')),
          CONSTRAINT expense_status_history_new_check
            CHECK (new_status IN ('draft','confirmed','cancelled'))
        )
      `);
      await queryRunner.query(
        `CREATE INDEX expense_status_history_expense_date_idx
         ON ${schema}.expense_status_history(expense_id, changed_at, id)`,
      );
      await queryRunner.query(`
        INSERT INTO ${schema}.expense_status_history(
          expense_id, previous_status, new_status, changed_by_user_id, changed_at
        )
        SELECT expense.id, NULL, 'draft', expense.created_by_user_id, expense.created_at
        FROM ${schema}.expenses expense
      `);
      await queryRunner.query(
        `INSERT INTO public.tenant_schema_versions(company_id, version, migration_name)
         VALUES ($1, 16, $2) ON CONFLICT (company_id, version) DO NOTHING`,
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
      await queryRunner.query(`DROP TABLE IF EXISTS ${schema}.expense_status_history`);
      await queryRunner.query(`DROP INDEX IF EXISTS ${schema}.expenses_supplier_date_idx`);
      await queryRunner.query(`DROP INDEX IF EXISTS ${schema}.expenses_category_date_idx`);
      await queryRunner.query(`DROP INDEX IF EXISTS ${schema}.expenses_status_date_idx`);
      await queryRunner.query(`CREATE INDEX expenses_occurred_on_idx ON ${schema}.expenses(occurred_on DESC)`);
      await queryRunner.query(`
        ALTER TABLE ${schema}.expenses
        ALTER COLUMN supplier_id DROP NOT NULL,
        DROP CONSTRAINT IF EXISTS expenses_recurrence_type_check,
        DROP CONSTRAINT IF EXISTS expenses_status_check,
        DROP COLUMN IF EXISTS updated_by_user_id,
        DROP COLUMN IF EXISTS cancelled_at,
        DROP COLUMN IF EXISTS confirmed_at,
        DROP COLUMN IF EXISTS receipt_file_key,
        DROP COLUMN IF EXISTS recurrence_type,
        DROP COLUMN IF EXISTS status,
        DROP COLUMN IF EXISTS notes,
        DROP COLUMN IF EXISTS reference
      `);
      await queryRunner.query(`DROP INDEX IF EXISTS ${schema}.expense_categories_name_unique`);
      await queryRunner.query(`
        ALTER TABLE ${schema}.expense_categories
        DROP CONSTRAINT IF EXISTS expense_categories_code_unique,
        DROP COLUMN IF EXISTS is_system,
        DROP COLUMN IF EXISTS code
      `);
      await queryRunner.query(
        'DELETE FROM public.tenant_schema_versions WHERE company_id = $1 AND version = 16',
        [company.id],
      );
    }
  }
}
