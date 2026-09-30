import { MigrationInterface, QueryRunner } from 'typeorm';
import { quoteIdentifier } from '../../schema-name';

interface CompanySchemaRow {
  id: string;
  schema_name: string;
}

export class ConceptCatalog1700000011000 implements MigrationInterface {
  name = 'ConceptCatalog1700000011000';

  async up(queryRunner: QueryRunner): Promise<void> {
    const companies = (await queryRunner.query(
      'SELECT id, schema_name FROM public.companies ORDER BY created_at, id',
    )) as CompanySchemaRow[];

    for (const company of companies) {
      const schema = quoteIdentifier(company.schema_name);
      await queryRunner.query(`
        CREATE TABLE ${schema}.measurement_units (
          id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
          name varchar(80) NOT NULL,
          symbol varchar(20) NOT NULL,
          sat_code varchar(3),
          allows_decimals boolean NOT NULL DEFAULT true,
          is_active boolean NOT NULL DEFAULT true,
          created_by_user_id uuid REFERENCES public.users(id),
          updated_by_user_id uuid REFERENCES public.users(id),
          created_at timestamptz NOT NULL DEFAULT now(),
          updated_at timestamptz NOT NULL DEFAULT now(),
          CHECK (char_length(trim(name)) BETWEEN 1 AND 80),
          CHECK (char_length(trim(symbol)) BETWEEN 1 AND 20),
          CHECK (sat_code IS NULL OR sat_code ~ '^[A-Z0-9]{1,3}$')
        )
      `);
      await queryRunner.query(
        `CREATE UNIQUE INDEX measurement_units_name_unique
         ON ${schema}.measurement_units(lower(name))`,
      );
      await queryRunner.query(
        `CREATE UNIQUE INDEX measurement_units_symbol_unique
         ON ${schema}.measurement_units(lower(symbol))`,
      );
      await queryRunner.query(`
        INSERT INTO ${schema}.measurement_units(name, symbol, sat_code, allows_decimals) VALUES
          ('Pieza', 'pza', 'H87', false),
          ('Servicio', 'serv', 'E48', true),
          ('Litro', 'L', 'LTR', true),
          ('Hora', 'h', 'HUR', true)
      `);

      await queryRunner.query(`
        ALTER TABLE ${schema}.products_services
        DROP CONSTRAINT IF EXISTS products_services_sku_key,
        ADD COLUMN unit_id uuid REFERENCES ${schema}.measurement_units(id),
        ADD COLUMN sat_product_service_code varchar(8),
        ADD COLUMN updated_by_user_id uuid REFERENCES public.users(id)
      `);
      await queryRunner.query(`
        UPDATE ${schema}.products_services concept
        SET unit_id = unit.id,
            updated_by_user_id = concept.created_by_user_id
        FROM ${schema}.measurement_units unit
        WHERE unit.name = CASE WHEN concept.kind = 'service' THEN 'Servicio' ELSE 'Pieza' END
      `);
      await queryRunner.query(`
        ALTER TABLE ${schema}.products_services
        ALTER COLUMN unit_id SET NOT NULL,
        ALTER COLUMN updated_by_user_id SET NOT NULL,
        ADD CONSTRAINT products_services_sat_code_check
          CHECK (sat_product_service_code IS NULL OR sat_product_service_code ~ '^[0-9]{8}$'),
        ADD CONSTRAINT products_services_inventory_kind_check
          CHECK (kind = 'product' OR tracks_inventory = false)
      `);
      await queryRunner.query(
        `CREATE UNIQUE INDEX products_services_sku_unique
         ON ${schema}.products_services(lower(sku)) WHERE sku IS NOT NULL`,
      );
      await queryRunner.query(
        `CREATE INDEX products_services_name_idx
         ON ${schema}.products_services(lower(name))`,
      );
      await queryRunner.query(
        `INSERT INTO public.tenant_schema_versions(company_id, version, migration_name)
         VALUES ($1, 6, $2) ON CONFLICT (company_id, version) DO NOTHING`,
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
      await queryRunner.query(`DROP INDEX IF EXISTS ${schema}.products_services_name_idx`);
      await queryRunner.query(`DROP INDEX IF EXISTS ${schema}.products_services_sku_unique`);
      await queryRunner.query(`
        ALTER TABLE ${schema}.products_services
        DROP CONSTRAINT IF EXISTS products_services_inventory_kind_check,
        DROP CONSTRAINT IF EXISTS products_services_sat_code_check,
        DROP COLUMN IF EXISTS updated_by_user_id,
        DROP COLUMN IF EXISTS sat_product_service_code,
        DROP COLUMN IF EXISTS unit_id,
        ADD CONSTRAINT products_services_sku_key UNIQUE(sku)
      `);
      await queryRunner.query(`DROP TABLE IF EXISTS ${schema}.measurement_units`);
      await queryRunner.query(
        'DELETE FROM public.tenant_schema_versions WHERE company_id = $1 AND version = 6',
        [company.id],
      );
    }
  }
}
