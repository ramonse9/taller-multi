import { MigrationInterface, QueryRunner } from 'typeorm';
import { quoteIdentifier } from '../../schema-name';

interface CompanySchemaRow {
  id: string;
  schema_name: string;
}

export class OrderExternalFolio1700000030000 implements MigrationInterface {
  name = 'OrderExternalFolio1700000030000';

  async up(queryRunner: QueryRunner): Promise<void> {
    const companies = (await queryRunner.query(
      'SELECT id, schema_name FROM public.companies ORDER BY created_at, id',
    )) as CompanySchemaRow[];

    for (const company of companies) {
      const schema = quoteIdentifier(company.schema_name);
      await queryRunner.query(`
        ALTER TABLE ${schema}.orders
        ADD COLUMN external_folio varchar(50)
      `);
      await queryRunner.query(`
        CREATE INDEX orders_external_folio_idx
        ON ${schema}.orders(lower(external_folio))
        WHERE external_folio IS NOT NULL
      `);
      await queryRunner.query(
        `INSERT INTO public.tenant_schema_versions(company_id, version, migration_name)
         VALUES ($1, 20, $2) ON CONFLICT (company_id, version) DO NOTHING`,
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
      await queryRunner.query(`DROP INDEX IF EXISTS ${schema}.orders_external_folio_idx`);
      await queryRunner.query(`ALTER TABLE ${schema}.orders DROP COLUMN IF EXISTS external_folio`);
      await queryRunner.query(
        'DELETE FROM public.tenant_schema_versions WHERE company_id = $1 AND version = 20',
        [company.id],
      );
    }
  }
}
