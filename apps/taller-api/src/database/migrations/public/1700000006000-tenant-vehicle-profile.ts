import { MigrationInterface, QueryRunner } from 'typeorm';
import { quoteIdentifier } from '../../schema-name';

interface CompanySchemaRow {
  id: string;
  schema_name: string;
}

export class TenantVehicleProfile1700000006000 implements MigrationInterface {
  name = 'TenantVehicleProfile1700000006000';

  async up(queryRunner: QueryRunner): Promise<void> {
    const companies = (await queryRunner.query(
      'SELECT id, schema_name FROM public.companies ORDER BY created_at, id',
    )) as CompanySchemaRow[];

    for (const company of companies) {
      const vehicles = `${quoteIdentifier(company.schema_name)}.vehicles`;
      await queryRunner.query(`ALTER TABLE ${vehicles} DROP CONSTRAINT IF EXISTS vehicles_vin_key`);
      await queryRunner.query(
        `ALTER TABLE ${vehicles} DROP CONSTRAINT IF EXISTS vehicles_license_plate_key`,
      );
      await queryRunner.query(`ALTER TABLE ${vehicles} RENAME COLUMN vin TO serial_number`);
      await queryRunner.query(`
        ALTER TABLE ${vehicles}
        ALTER COLUMN serial_number TYPE varchar(10)
          USING upper(right(trim(serial_number), 10)),
        ALTER COLUMN brand_id SET NOT NULL,
        ALTER COLUMN model_id SET NOT NULL,
        ALTER COLUMN model_year SET NOT NULL,
        ALTER COLUMN color SET NOT NULL,
        DROP COLUMN odometer,
        ADD COLUMN updated_by_user_id uuid REFERENCES public.users(id)
      `);
      await queryRunner.query(`
        UPDATE ${vehicles}
        SET updated_by_user_id = created_by_user_id,
            license_plate = nullif(upper(trim(license_plate)), ''),
            color = trim(color)
      `);
      await queryRunner.query(`
        ALTER TABLE ${vehicles}
        ALTER COLUMN updated_by_user_id SET NOT NULL,
        ADD CONSTRAINT vehicles_customer_brand_serial_number_key
          UNIQUE (customer_id, brand_id, serial_number),
        ADD CONSTRAINT vehicles_serial_number_format
          CHECK (serial_number IS NULL OR serial_number ~ '^[A-HJ-NPR-Z0-9]{10}$'),
        ADD CONSTRAINT vehicles_color_length CHECK (char_length(trim(color)) BETWEEN 1 AND 50)
      `);
      await queryRunner.query(
        `CREATE INDEX vehicles_serial_number_idx ON ${vehicles} (serial_number)
         WHERE serial_number IS NOT NULL`,
      );
      await queryRunner.query(
        `INSERT INTO public.tenant_schema_versions(company_id, version, migration_name)
         VALUES ($1, 2, $2) ON CONFLICT (company_id, version) DO NOTHING`,
        [company.id, this.name],
      );
    }
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    const companies = (await queryRunner.query(
      'SELECT id, schema_name FROM public.companies ORDER BY created_at DESC, id DESC',
    )) as CompanySchemaRow[];

    for (const company of companies) {
      const vehicles = `${quoteIdentifier(company.schema_name)}.vehicles`;
      await queryRunner.query(
        `DROP INDEX IF EXISTS ${quoteIdentifier(company.schema_name)}.vehicles_serial_number_idx`,
      );
      await queryRunner.query(`
        ALTER TABLE ${vehicles}
        DROP CONSTRAINT IF EXISTS vehicles_color_length,
        DROP CONSTRAINT IF EXISTS vehicles_serial_number_format,
        DROP CONSTRAINT IF EXISTS vehicles_customer_brand_serial_number_key,
        DROP COLUMN IF EXISTS updated_by_user_id,
        ADD COLUMN odometer integer CHECK (odometer IS NULL OR odometer >= 0),
        ALTER COLUMN brand_id DROP NOT NULL,
        ALTER COLUMN model_id DROP NOT NULL,
        ALTER COLUMN model_year DROP NOT NULL,
        ALTER COLUMN color DROP NOT NULL,
        ALTER COLUMN serial_number TYPE varchar(17)
      `);
      await queryRunner.query(`ALTER TABLE ${vehicles} RENAME COLUMN serial_number TO vin`);
      await queryRunner.query(
        `ALTER TABLE ${vehicles} ADD CONSTRAINT vehicles_vin_key UNIQUE (vin)`,
      );
      await queryRunner.query(
        `ALTER TABLE ${vehicles} ADD CONSTRAINT vehicles_license_plate_key UNIQUE (license_plate)`,
      );
      await queryRunner.query(
        'DELETE FROM public.tenant_schema_versions WHERE company_id = $1 AND version = 2',
        [company.id],
      );
    }
  }
}
