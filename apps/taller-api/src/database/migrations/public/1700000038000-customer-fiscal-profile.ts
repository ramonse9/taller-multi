import { MigrationInterface, QueryRunner } from 'typeorm';
import { quoteIdentifier } from '../../schema-name';

interface CompanySchemaRow {
  id: string;
  schema_name: string;
}

export class CustomerFiscalProfile1700000038000 implements MigrationInterface {
  name = 'CustomerFiscalProfile1700000038000';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE public.sat_fiscal_regimes (
        code varchar(3) PRIMARY KEY CHECK (code ~ '^[0-9]{3}$'),
        name varchar(180) NOT NULL,
        supports_person boolean NOT NULL,
        supports_company boolean NOT NULL,
        is_active boolean NOT NULL DEFAULT true,
        created_at timestamptz NOT NULL DEFAULT now(),
        updated_at timestamptz NOT NULL DEFAULT now(),
        CHECK (supports_person OR supports_company)
      )
    `);
    await queryRunner.query(`
      INSERT INTO public.sat_fiscal_regimes
        (code, name, supports_person, supports_company)
      VALUES
        ('601', 'General de Ley Personas Morales', false, true),
        ('603', 'Personas Morales con Fines no Lucrativos', false, true),
        ('605', 'Sueldos y Salarios e Ingresos Asimilados a Salarios', true, false),
        ('606', 'Arrendamiento', true, false),
        ('607', 'Régimen de Enajenación o Adquisición de Bienes', true, false),
        ('608', 'Demás ingresos', true, false),
        ('610', 'Residentes en el Extranjero sin Establecimiento Permanente en México', true, true),
        ('611', 'Ingresos por Dividendos (socios y accionistas)', true, false),
        ('612', 'Personas Físicas con Actividades Empresariales y Profesionales', true, false),
        ('614', 'Ingresos por intereses', true, false),
        ('615', 'Régimen de los ingresos por obtención de premios', true, false),
        ('616', 'Sin obligaciones fiscales', true, false),
        ('620', 'Sociedades Cooperativas de Producción que optan por diferir sus ingresos', false, true),
        ('621', 'Incorporación Fiscal', true, false),
        ('622', 'Actividades Agrícolas, Ganaderas, Silvícolas y Pesqueras', false, true),
        ('623', 'Opcional para Grupos de Sociedades', false, true),
        ('624', 'Coordinados', false, true),
        ('625', 'Régimen de las Actividades Empresariales con ingresos a través de Plataformas Tecnológicas', true, false),
        ('626', 'Régimen Simplificado de Confianza', true, true)
    `);

    const companies = (await queryRunner.query(
      'SELECT id, schema_name FROM public.companies ORDER BY created_at, id',
    )) as CompanySchemaRow[];

    for (const company of companies) {
      const schema = quoteIdentifier(company.schema_name);
      await queryRunner.query(`
        ALTER TABLE ${schema}.customers
          ADD COLUMN fiscal_name varchar(180),
          ADD COLUMN fiscal_postal_code varchar(5),
          ADD COLUMN fiscal_regime_code varchar(3)
            REFERENCES public.sat_fiscal_regimes(code),
          ADD COLUMN preferred_cfdi_use_code varchar(4),
          ADD CONSTRAINT customers_fiscal_postal_code_check
            CHECK (fiscal_postal_code IS NULL OR fiscal_postal_code ~ '^[0-9]{5}$'),
          ADD CONSTRAINT customers_preferred_cfdi_use_code_check
            CHECK (
              preferred_cfdi_use_code IS NULL OR
              preferred_cfdi_use_code ~ '^[A-Z0-9]{3,4}$'
            )
      `);
      await queryRunner.query(
        `INSERT INTO public.tenant_schema_versions(company_id, version, migration_name)
         VALUES ($1, 24, $2) ON CONFLICT (company_id, version) DO NOTHING`,
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
        ALTER TABLE ${schema}.customers
          DROP CONSTRAINT IF EXISTS customers_preferred_cfdi_use_code_check,
          DROP CONSTRAINT IF EXISTS customers_fiscal_postal_code_check,
          DROP COLUMN IF EXISTS preferred_cfdi_use_code,
          DROP COLUMN IF EXISTS fiscal_regime_code,
          DROP COLUMN IF EXISTS fiscal_postal_code,
          DROP COLUMN IF EXISTS fiscal_name
      `);
      await queryRunner.query(
        'DELETE FROM public.tenant_schema_versions WHERE company_id = $1 AND version = 24',
        [company.id],
      );
    }

    await queryRunner.query('DROP TABLE IF EXISTS public.sat_fiscal_regimes');
  }
}
