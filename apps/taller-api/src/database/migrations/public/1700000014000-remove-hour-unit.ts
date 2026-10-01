import { MigrationInterface, QueryRunner } from 'typeorm';
import { quoteIdentifier } from '../../schema-name';

interface CompanySchemaRow {
  id: string;
  schema_name: string;
}

export class RemoveHourUnit1700000014000 implements MigrationInterface {
  name = 'RemoveHourUnit1700000014000';

  async up(queryRunner: QueryRunner): Promise<void> {
    const companies = (await queryRunner.query(
      'SELECT id, schema_name FROM public.companies ORDER BY created_at, id',
    )) as CompanySchemaRow[];

    for (const company of companies) {
      const schema = quoteIdentifier(company.schema_name);
      await queryRunner.query(`
        DELETE FROM ${schema}.measurement_units unit
        WHERE lower(unit.name) = 'hora' AND lower(unit.symbol) = 'h'
          AND NOT EXISTS (
            SELECT 1 FROM ${schema}.products_services concept WHERE concept.unit_id = unit.id
          )
      `);
      await queryRunner.query(`
        UPDATE ${schema}.measurement_units
        SET is_active = false, updated_at = now()
        WHERE lower(name) = 'hora' AND lower(symbol) = 'h'
      `);
      await queryRunner.query(
        `INSERT INTO public.tenant_schema_versions(company_id, version, migration_name)
         VALUES ($1, 9, $2) ON CONFLICT (company_id, version) DO NOTHING`,
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
        UPDATE ${schema}.measurement_units
        SET is_active = true, updated_at = now()
        WHERE lower(name) = 'hora' AND lower(symbol) = 'h'
      `);
      await queryRunner.query(`
        INSERT INTO ${schema}.measurement_units(name, symbol, sat_code, allows_decimals)
        SELECT 'Hora', 'h', 'HUR', true
        WHERE NOT EXISTS (
          SELECT 1 FROM ${schema}.measurement_units
          WHERE lower(name) = 'hora' OR lower(symbol) = 'h'
        )
      `);
      await queryRunner.query(
        'DELETE FROM public.tenant_schema_versions WHERE company_id = $1 AND version = 9',
        [company.id],
      );
    }
  }
}
