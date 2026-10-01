import { MigrationInterface, QueryRunner } from 'typeorm';
import { quoteIdentifier } from '../../schema-name';

interface CompanySchemaRow {
  id: string;
  schema_name: string;
}

export class PurchaseStatusHistory1700000020000 implements MigrationInterface {
  name = 'PurchaseStatusHistory1700000020000';

  async up(queryRunner: QueryRunner): Promise<void> {
    const companies = (await queryRunner.query(
      'SELECT id, schema_name FROM public.companies ORDER BY created_at, id',
    )) as CompanySchemaRow[];

    for (const company of companies) {
      const schema = quoteIdentifier(company.schema_name);
      await queryRunner.query(`
        CREATE TABLE ${schema}.purchase_status_history (
          id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
          purchase_id uuid NOT NULL REFERENCES ${schema}.purchases(id) ON DELETE CASCADE,
          previous_status varchar(20),
          new_status varchar(20) NOT NULL,
          changed_by_user_id uuid NOT NULL REFERENCES public.users(id),
          changed_at timestamptz NOT NULL DEFAULT now(),
          CONSTRAINT purchase_status_history_previous_check
            CHECK (previous_status IS NULL OR previous_status IN ('draft','confirmed','cancelled')),
          CONSTRAINT purchase_status_history_new_check
            CHECK (new_status IN ('draft','confirmed','cancelled'))
        )
      `);
      await queryRunner.query(
        `CREATE INDEX purchase_status_history_purchase_date_idx
         ON ${schema}.purchase_status_history(purchase_id, changed_at, id)`,
      );
      await queryRunner.query(`
        INSERT INTO ${schema}.purchase_status_history(
          purchase_id, previous_status, new_status, changed_by_user_id, changed_at
        )
        SELECT purchase.id, NULL, 'draft', purchase.created_by_user_id, purchase.created_at
        FROM ${schema}.purchases purchase
      `);
      await queryRunner.query(`
        INSERT INTO ${schema}.purchase_status_history(
          purchase_id, previous_status, new_status, changed_by_user_id, changed_at
        )
        SELECT purchase.id, 'draft', 'confirmed', purchase.updated_by_user_id,
               purchase.confirmed_at
        FROM ${schema}.purchases purchase
        WHERE purchase.confirmed_at IS NOT NULL
      `);
      await queryRunner.query(`
        INSERT INTO ${schema}.purchase_status_history(
          purchase_id, previous_status, new_status, changed_by_user_id, changed_at
        )
        SELECT purchase.id,
               CASE WHEN purchase.confirmed_at IS NULL THEN 'draft' ELSE 'confirmed' END,
               'cancelled', purchase.updated_by_user_id,
               COALESCE(purchase.cancelled_at, purchase.updated_at)
        FROM ${schema}.purchases purchase
        WHERE purchase.status = 'cancelled'
      `);
      await queryRunner.query(
        `INSERT INTO public.tenant_schema_versions(company_id, version, migration_name)
         VALUES ($1, 15, $2) ON CONFLICT (company_id, version) DO NOTHING`,
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
      await queryRunner.query(`DROP TABLE IF EXISTS ${schema}.purchase_status_history`);
      await queryRunner.query(
        'DELETE FROM public.tenant_schema_versions WHERE company_id = $1 AND version = 15',
        [company.id],
      );
    }
  }
}
