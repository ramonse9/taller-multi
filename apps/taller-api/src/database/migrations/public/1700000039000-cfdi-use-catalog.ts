import { MigrationInterface, QueryRunner } from 'typeorm';
import { quoteIdentifier } from '../../schema-name';

interface CompanySchemaRow {
  id: string;
  schema_name: string;
}

interface InvalidCfdiPreferenceRow {
  id: string;
  customer_type: string;
  fiscal_regime_code: string | null;
  preferred_cfdi_use_code: string;
  problem: string;
}

interface CfdiUseSeed {
  code: string;
  description: string;
  supportsPerson: boolean;
  supportsCompany: boolean;
  regimes: readonly string[];
}

const BUSINESS_REGIMES = [
  '601',
  '603',
  '606',
  '612',
  '620',
  '621',
  '622',
  '623',
  '624',
  '625',
  '626',
] as const;
const BUSINESS_AND_NO_OBLIGATIONS_REGIMES = [...BUSINESS_REGIMES, '616'] as const;
const PERSONAL_DEDUCTION_REGIMES = [
  '605',
  '606',
  '607',
  '608',
  '611',
  '612',
  '614',
  '615',
  '625',
] as const;
const ALL_CURRENT_REGIMES = [
  '601',
  '603',
  '605',
  '606',
  '607',
  '608',
  '610',
  '611',
  '612',
  '614',
  '615',
  '616',
  '620',
  '621',
  '622',
  '623',
  '624',
  '625',
  '626',
] as const;

/**
 * Catálogo y compatibilidades tomados de las fuentes oficiales de CFDI 4.0 del SAT,
 * consultadas el 12 de octubre de 2026:
 * - https://wwwmatnp.sat.gob.mx/consultas/35025/formato-de-factura-electronica-%28anexo-20%29
 *   (Catálogos de datos CFDI 4.0, catCFDI)
 * - https://www.sat.gob.mx/minisitio/Factura/documentos/Guia_llenadoCFDI_DPA.pdf
 *   (campos RegimenFiscalReceptor y UsoCFDI)
 *
 * P01 no se incluye: no forma parte de los usos vigentes de CFDI 4.0. Aunque un XSD
 * histórico acepte su forma sintáctica, la vigencia y compatibilidad las determina
 * el catálogo c_UsoCFDI.
 */
export const CURRENT_CFDI_USES: readonly CfdiUseSeed[] = [
  {
    code: 'G01',
    description: 'Adquisición de mercancías.',
    supportsPerson: true,
    supportsCompany: true,
    regimes: BUSINESS_REGIMES,
  },
  {
    code: 'G02',
    description: 'Devoluciones, descuentos o bonificaciones.',
    supportsPerson: true,
    supportsCompany: true,
    regimes: BUSINESS_AND_NO_OBLIGATIONS_REGIMES,
  },
  {
    code: 'G03',
    description: 'Gastos en general.',
    supportsPerson: true,
    supportsCompany: true,
    regimes: BUSINESS_REGIMES,
  },
  {
    code: 'I01',
    description: 'Construcciones.',
    supportsPerson: true,
    supportsCompany: true,
    regimes: BUSINESS_REGIMES,
  },
  {
    code: 'I02',
    description: 'Mobiliario y equipo de oficina por inversiones.',
    supportsPerson: true,
    supportsCompany: true,
    regimes: BUSINESS_REGIMES,
  },
  {
    code: 'I03',
    description: 'Equipo de transporte.',
    supportsPerson: true,
    supportsCompany: true,
    regimes: BUSINESS_REGIMES,
  },
  {
    code: 'I04',
    description: 'Equipo de cómputo y accesorios.',
    supportsPerson: true,
    supportsCompany: true,
    regimes: BUSINESS_REGIMES,
  },
  {
    code: 'I05',
    description: 'Dados, troqueles, moldes, matrices y herramental.',
    supportsPerson: true,
    supportsCompany: true,
    regimes: BUSINESS_REGIMES,
  },
  {
    code: 'I06',
    description: 'Comunicaciones telefónicas.',
    supportsPerson: true,
    supportsCompany: true,
    regimes: BUSINESS_REGIMES,
  },
  {
    code: 'I07',
    description: 'Comunicaciones satelitales.',
    supportsPerson: true,
    supportsCompany: true,
    regimes: BUSINESS_REGIMES,
  },
  {
    code: 'I08',
    description: 'Otra maquinaria y equipo.',
    supportsPerson: true,
    supportsCompany: true,
    regimes: BUSINESS_REGIMES,
  },
  {
    code: 'D01',
    description: 'Honorarios médicos, dentales y gastos hospitalarios.',
    supportsPerson: true,
    supportsCompany: false,
    regimes: PERSONAL_DEDUCTION_REGIMES,
  },
  {
    code: 'D02',
    description: 'Gastos médicos por incapacidad o discapacidad.',
    supportsPerson: true,
    supportsCompany: false,
    regimes: PERSONAL_DEDUCTION_REGIMES,
  },
  {
    code: 'D03',
    description: 'Gastos funerales.',
    supportsPerson: true,
    supportsCompany: false,
    regimes: PERSONAL_DEDUCTION_REGIMES,
  },
  {
    code: 'D04',
    description: 'Donativos.',
    supportsPerson: true,
    supportsCompany: false,
    regimes: PERSONAL_DEDUCTION_REGIMES,
  },
  {
    code: 'D05',
    description: 'Intereses reales pagados por créditos hipotecarios.',
    supportsPerson: true,
    supportsCompany: false,
    regimes: PERSONAL_DEDUCTION_REGIMES,
  },
  {
    code: 'D06',
    description: 'Aportaciones voluntarias al SAR.',
    supportsPerson: true,
    supportsCompany: false,
    regimes: PERSONAL_DEDUCTION_REGIMES,
  },
  {
    code: 'D07',
    description: 'Primas por seguros de gastos médicos.',
    supportsPerson: true,
    supportsCompany: false,
    regimes: PERSONAL_DEDUCTION_REGIMES,
  },
  {
    code: 'D08',
    description: 'Gastos de transportación escolar obligatoria.',
    supportsPerson: true,
    supportsCompany: false,
    regimes: PERSONAL_DEDUCTION_REGIMES,
  },
  {
    code: 'D09',
    description:
      'Depósitos en cuentas para el ahorro, primas que tengan como base planes de pensiones.',
    supportsPerson: true,
    supportsCompany: false,
    regimes: PERSONAL_DEDUCTION_REGIMES,
  },
  {
    code: 'D10',
    description: 'Pagos por servicios educativos (colegiaturas).',
    supportsPerson: true,
    supportsCompany: false,
    regimes: PERSONAL_DEDUCTION_REGIMES,
  },
  {
    code: 'S01',
    description: 'Sin efectos fiscales.',
    supportsPerson: true,
    supportsCompany: true,
    regimes: ALL_CURRENT_REGIMES,
  },
  {
    code: 'CP01',
    description: 'Pagos.',
    supportsPerson: true,
    supportsCompany: true,
    regimes: ALL_CURRENT_REGIMES,
  },
  {
    code: 'CN01',
    description: 'Nómina.',
    supportsPerson: true,
    supportsCompany: false,
    regimes: ['605'],
  },
] as const;

export class CfdiUseCatalog1700000039000 implements MigrationInterface {
  name = 'CfdiUseCatalog1700000039000';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE public.sat_cfdi_uses (
        code varchar(4) PRIMARY KEY CHECK (code ~ '^[A-Z0-9]{3,4}$'),
        description varchar(180) NOT NULL,
        supports_person boolean NOT NULL,
        supports_company boolean NOT NULL,
        valid_from date NOT NULL,
        valid_to date,
        is_active boolean NOT NULL DEFAULT true,
        created_at timestamptz NOT NULL DEFAULT now(),
        updated_at timestamptz NOT NULL DEFAULT now(),
        CHECK (supports_person OR supports_company),
        CHECK (valid_to IS NULL OR valid_to >= valid_from)
      )
    `);
    await queryRunner.query(`
      CREATE TABLE public.sat_cfdi_use_fiscal_regimes (
        cfdi_use_code varchar(4) NOT NULL
          REFERENCES public.sat_cfdi_uses(code) ON DELETE CASCADE,
        fiscal_regime_code varchar(3) NOT NULL
          REFERENCES public.sat_fiscal_regimes(code) ON DELETE RESTRICT,
        PRIMARY KEY (cfdi_use_code, fiscal_regime_code)
      )
    `);
    await queryRunner.query(`
      CREATE INDEX sat_cfdi_use_fiscal_regimes_regime_idx
        ON public.sat_cfdi_use_fiscal_regimes(fiscal_regime_code, cfdi_use_code)
    `);

    for (const use of CURRENT_CFDI_USES) {
      await queryRunner.query(
        `INSERT INTO public.sat_cfdi_uses
          (code, description, supports_person, supports_company, valid_from, valid_to, is_active)
         VALUES ($1, $2, $3, $4, DATE '2022-01-01', NULL, true)`,
        [use.code, use.description, use.supportsPerson, use.supportsCompany],
      );
    }

    const useCodes: string[] = [];
    const regimeCodes: string[] = [];
    for (const use of CURRENT_CFDI_USES) {
      for (const regime of use.regimes) {
        useCodes.push(use.code);
        regimeCodes.push(regime);
      }
    }
    await queryRunner.query(
      `INSERT INTO public.sat_cfdi_use_fiscal_regimes(cfdi_use_code, fiscal_regime_code)
       SELECT mapping.cfdi_use_code, mapping.fiscal_regime_code
       FROM unnest($1::varchar[], $2::varchar[])
         AS mapping(cfdi_use_code, fiscal_regime_code)`,
      [useCodes, regimeCodes],
    );

    const companies = (await queryRunner.query(
      'SELECT id, schema_name FROM public.companies ORDER BY created_at, id',
    )) as CompanySchemaRow[];

    for (const company of companies) {
      const schema = quoteIdentifier(company.schema_name);
      const invalidRows = (await queryRunner.query(`
        SELECT customer.id::text, customer.customer_type, customer.fiscal_regime_code,
               customer.preferred_cfdi_use_code,
               CASE
                 WHEN cfdi_use.code IS NULL THEN 'uso inexistente'
                 WHEN cfdi_use.is_active = false THEN 'uso inactivo'
                 WHEN CURRENT_DATE < cfdi_use.valid_from OR
                      (cfdi_use.valid_to IS NOT NULL AND CURRENT_DATE > cfdi_use.valid_to)
                   THEN 'uso fuera de vigencia'
                 WHEN customer.fiscal_regime_code IS NULL THEN 'régimen fiscal requerido'
                 WHEN customer.customer_type = 'person' AND cfdi_use.supports_person = false
                   THEN 'uso incompatible con persona física'
                 WHEN customer.customer_type = 'company' AND cfdi_use.supports_company = false
                   THEN 'uso incompatible con persona moral'
                 WHEN compatibility.cfdi_use_code IS NULL
                   THEN 'uso incompatible con régimen fiscal'
                 ELSE 'preferencia inválida'
               END AS problem
        FROM ${schema}.customers customer
        LEFT JOIN public.sat_cfdi_uses cfdi_use
          ON cfdi_use.code = customer.preferred_cfdi_use_code
        LEFT JOIN public.sat_cfdi_use_fiscal_regimes compatibility
          ON compatibility.cfdi_use_code = customer.preferred_cfdi_use_code
         AND compatibility.fiscal_regime_code = customer.fiscal_regime_code
        WHERE customer.preferred_cfdi_use_code IS NOT NULL
          AND (
            cfdi_use.code IS NULL OR cfdi_use.is_active = false OR
            CURRENT_DATE < cfdi_use.valid_from OR
            (cfdi_use.valid_to IS NOT NULL AND CURRENT_DATE > cfdi_use.valid_to) OR
            customer.fiscal_regime_code IS NULL OR
            (customer.customer_type = 'person' AND cfdi_use.supports_person = false) OR
            (customer.customer_type = 'company' AND cfdi_use.supports_company = false) OR
            compatibility.cfdi_use_code IS NULL
          )
        ORDER BY customer.id
        LIMIT 20
      `)) as InvalidCfdiPreferenceRow[];

      if (invalidRows.length > 0) {
        const details = invalidRows
          .map(
            (row) =>
              `${row.id}: ${row.preferred_cfdi_use_code}/${row.fiscal_regime_code ?? 'sin régimen'} (${row.problem})`,
          )
          .join('; ');
        throw new Error(
          `No se puede migrar el schema ${company.schema_name}: existen preferencias de Uso CFDI inválidas. Corrige los datos antes de reintentar. ${details}`,
        );
      }

      await queryRunner.query(`
        ALTER TABLE ${schema}.customers
          ADD CONSTRAINT customers_preferred_cfdi_use_code_fkey
            FOREIGN KEY (preferred_cfdi_use_code)
            REFERENCES public.sat_cfdi_uses(code),
          ADD CONSTRAINT customers_cfdi_use_requires_regime_check
            CHECK (preferred_cfdi_use_code IS NULL OR fiscal_regime_code IS NOT NULL)
      `);
      await queryRunner.query(
        `INSERT INTO public.tenant_schema_versions(company_id, version, migration_name)
         VALUES ($1, 25, $2) ON CONFLICT (company_id, version) DO NOTHING`,
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
          DROP CONSTRAINT IF EXISTS customers_cfdi_use_requires_regime_check,
          DROP CONSTRAINT IF EXISTS customers_preferred_cfdi_use_code_fkey
      `);
      await queryRunner.query(
        'DELETE FROM public.tenant_schema_versions WHERE company_id = $1 AND version = 25',
        [company.id],
      );
    }

    await queryRunner.query('DROP TABLE IF EXISTS public.sat_cfdi_use_fiscal_regimes');
    await queryRunner.query('DROP TABLE IF EXISTS public.sat_cfdi_uses');
  }
}
