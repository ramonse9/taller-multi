import { MigrationInterface, QueryRunner } from 'typeorm';
import { quoteIdentifier } from '../../schema-name';

interface CompanySchemaRow {
  id: string;
  schema_name: string;
}

export class ConfirmedExpenseEditing1700000032000 implements MigrationInterface {
  name = 'ConfirmedExpenseEditing1700000032000';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      UPDATE public.permissions
      SET description = 'Modificar gastos confirmados mientras no hayan sido cancelados.'
      WHERE code = 'expenses.edit'
    `);

    const companies = (await queryRunner.query(
      'SELECT id, schema_name FROM public.companies ORDER BY created_at, id',
    )) as CompanySchemaRow[];

    for (const company of companies) {
      const schema = quoteIdentifier(company.schema_name);
      await queryRunner.query(`
        CREATE TABLE ${schema}.expense_change_history (
          id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
          expense_id uuid NOT NULL REFERENCES ${schema}.expenses(id) ON DELETE CASCADE,
          changed_fields varchar(40)[] NOT NULL,
          previous_values jsonb NOT NULL,
          new_values jsonb NOT NULL,
          changed_by_user_id uuid NOT NULL REFERENCES public.users(id),
          changed_at timestamptz NOT NULL DEFAULT now(),
          CHECK (cardinality(changed_fields) > 0)
        )
      `);
      await queryRunner.query(`
        CREATE INDEX expense_change_history_expense_date_idx
        ON ${schema}.expense_change_history(expense_id, changed_at, id)
      `);
      await queryRunner.query(`
        INSERT INTO ${schema}.expense_status_history(
          expense_id, previous_status, new_status, changed_by_user_id, changed_at
        )
        SELECT expense.id, 'draft', 'confirmed', expense.updated_by_user_id, now()
        FROM ${schema}.expenses expense
        WHERE expense.status = 'draft'
      `);
      await queryRunner.query(`
        UPDATE ${schema}.expenses
        SET status = 'confirmed', confirmed_at = COALESCE(confirmed_at, now()), updated_at = now()
        WHERE status = 'draft'
      `);
      await queryRunner.query(`
        ALTER TABLE ${schema}.expenses ALTER COLUMN status SET DEFAULT 'confirmed'
      `);
      await queryRunner.query(
        `INSERT INTO public.tenant_schema_versions(company_id, version, migration_name)
         VALUES ($1, 22, $2) ON CONFLICT (company_id, version) DO NOTHING`,
        [company.id, this.name],
      );
    }
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      UPDATE public.permissions
      SET description = 'Modificar gastos en borrador.'
      WHERE code = 'expenses.edit'
    `);

    const companies = (await queryRunner.query(
      'SELECT id, schema_name FROM public.companies ORDER BY created_at DESC, id DESC',
    )) as CompanySchemaRow[];

    for (const company of companies) {
      const schema = quoteIdentifier(company.schema_name);
      await queryRunner.query(`
        ALTER TABLE ${schema}.expenses ALTER COLUMN status SET DEFAULT 'draft'
      `);
      await queryRunner.query(`DROP TABLE IF EXISTS ${schema}.expense_change_history`);
      await queryRunner.query(
        'DELETE FROM public.tenant_schema_versions WHERE company_id = $1 AND version = 22',
        [company.id],
      );
    }
  }
}
