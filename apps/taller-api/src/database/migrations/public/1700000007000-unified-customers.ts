import { MigrationInterface, QueryRunner } from 'typeorm';
import { quoteIdentifier } from '../../schema-name';

interface CompanySchemaRow {
  id: string;
  schema_name: string;
}

export class UnifiedCustomers1700000007000 implements MigrationInterface {
  name = 'UnifiedCustomers1700000007000';

  async up(queryRunner: QueryRunner): Promise<void> {
    const companies = (await queryRunner.query(
      'SELECT id, schema_name FROM public.companies ORDER BY created_at, id',
    )) as CompanySchemaRow[];

    for (const company of companies) {
      const schema = quoteIdentifier(company.schema_name);
      const customers = `${schema}.customers`;
      const corporateCustomers = `${schema}.corporate_customers`;

      await queryRunner.query(`ALTER TABLE ${customers} RENAME COLUMN full_name TO display_name`);
      await queryRunner.query(
        `ALTER INDEX ${schema}.customers_name_idx RENAME TO customers_display_name_idx`,
      );
      await queryRunner.query(`
        ALTER TABLE ${customers}
        ADD COLUMN customer_type varchar(10) NOT NULL DEFAULT 'person',
        ADD COLUMN legal_name varchar(180),
        ADD COLUMN contact_name varchar(180)
      `);
      await queryRunner.query(`
        INSERT INTO ${customers} (
          display_name, customer_type, legal_name, tax_id, email, phone, is_active,
          created_by_user_id, updated_by_user_id, created_at, updated_at
        )
        SELECT corporate.legal_name, 'company', corporate.legal_name,
               CASE
                 WHEN corporate.tax_id IS NOT NULL AND EXISTS (
                   SELECT 1 FROM ${customers} existing
                   WHERE existing.tax_id = corporate.tax_id
                 ) THEN NULL
                 ELSE corporate.tax_id
               END,
               corporate.email, corporate.phone, corporate.is_active,
               corporate.created_by_user_id, corporate.created_by_user_id,
               corporate.created_at, corporate.updated_at
        FROM ${corporateCustomers} corporate
      `);
      await queryRunner.query(`
        ALTER TABLE ${customers}
        DROP COLUMN corporate_customer_id,
        ADD CONSTRAINT customers_type_check
          CHECK (customer_type IN ('person', 'company')),
        ADD CONSTRAINT customers_company_fields_check
          CHECK (
            customer_type = 'company' OR
            (legal_name IS NULL AND contact_name IS NULL)
          )
      `);
      await queryRunner.query(`DROP TABLE ${corporateCustomers}`);
      await queryRunner.query(
        `INSERT INTO public.tenant_schema_versions(company_id, version, migration_name)
         VALUES ($1, 3, $2) ON CONFLICT (company_id, version) DO NOTHING`,
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
      const customers = `${schema}.customers`;
      const corporateCustomers = `${schema}.corporate_customers`;

      await queryRunner.query(`
        CREATE TABLE ${corporateCustomers} (
          id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
          legal_name varchar(180) NOT NULL,
          tax_id varchar(20), email citext, phone varchar(30),
          is_active boolean NOT NULL DEFAULT true,
          created_by_user_id uuid NOT NULL REFERENCES public.users(id),
          created_at timestamptz NOT NULL DEFAULT now(),
          updated_at timestamptz NOT NULL DEFAULT now(),
          UNIQUE (legal_name), UNIQUE (tax_id)
        )
      `);
      await queryRunner.query(`
        INSERT INTO ${corporateCustomers} (
          legal_name, tax_id, email, phone, is_active, created_by_user_id,
          created_at, updated_at
        )
        SELECT coalesce(legal_name, display_name), tax_id, email, phone, is_active,
               created_by_user_id, created_at, updated_at
        FROM ${customers}
        WHERE customer_type = 'company'
      `);
      await queryRunner.query(`DELETE FROM ${customers} WHERE customer_type = 'company'`);
      await queryRunner.query(`
        ALTER TABLE ${customers}
        DROP CONSTRAINT customers_company_fields_check,
        DROP CONSTRAINT customers_type_check,
        DROP COLUMN contact_name,
        DROP COLUMN legal_name,
        DROP COLUMN customer_type,
        ADD COLUMN corporate_customer_id uuid REFERENCES ${corporateCustomers}(id) ON DELETE SET NULL
      `);
      await queryRunner.query(`ALTER TABLE ${customers} RENAME COLUMN display_name TO full_name`);
      await queryRunner.query(
        `ALTER INDEX ${schema}.customers_display_name_idx RENAME TO customers_name_idx`,
      );
      await queryRunner.query(
        'DELETE FROM public.tenant_schema_versions WHERE company_id = $1 AND version = 3',
        [company.id],
      );
    }
  }
}
