import { MigrationInterface, QueryRunner } from 'typeorm';
import { quoteIdentifier } from '../../schema-name';

interface CompanySchemaRow {
  id: string;
  schema_name: string;
}

/**
 * Catálogos tomados del Anexo 20 / catálogos CFDI 4.0 publicados por el SAT.
 * La columna simulation_supported distingue la vigencia oficial del subconjunto
 * que este simulador puede calcular de forma explícita.
 */
export class SimulatedInvoiceDocuments1700000045000 implements MigrationInterface {
  name = 'SimulatedInvoiceDocuments1700000045000';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE public.sat_tax_objects (
        code varchar(2) PRIMARY KEY,
        description varchar(180) NOT NULL,
        valid_from date,
        valid_to date,
        is_active boolean NOT NULL DEFAULT true,
        simulation_supported boolean NOT NULL DEFAULT false
      );
      INSERT INTO public.sat_tax_objects VALUES
        ('01', 'No objeto de impuesto', '2022-01-01', NULL, true, true),
        ('02', 'Sí objeto de impuesto', '2022-01-01', NULL, true, true),
        ('03', 'Sí objeto del impuesto y no obligado al desglose', '2022-01-01', NULL, true, false),
        ('04', 'Sí objeto del impuesto y no causa impuesto', '2023-01-01', NULL, true, false);

      CREATE TABLE public.sat_taxes (
        code varchar(3) PRIMARY KEY,
        description varchar(80) NOT NULL,
        is_withholding boolean NOT NULL,
        is_transfer boolean NOT NULL,
        valid_from date,
        valid_to date,
        is_active boolean NOT NULL DEFAULT true,
        simulation_supported boolean NOT NULL DEFAULT false
      );
      INSERT INTO public.sat_taxes VALUES
        ('001', 'ISR', true, false, '2017-01-01', NULL, true, false),
        ('002', 'IVA', true, true, '2017-01-01', NULL, true, true),
        ('003', 'IEPS', true, true, '2017-01-01', NULL, true, false);

      CREATE TABLE public.sat_factor_types (
        code varchar(10) PRIMARY KEY,
        description varchar(80) NOT NULL,
        is_active boolean NOT NULL DEFAULT true,
        simulation_supported boolean NOT NULL DEFAULT false
      );
      INSERT INTO public.sat_factor_types VALUES
        ('Tasa', 'Tasa', true, true),
        ('Cuota', 'Cuota', true, false),
        ('Exento', 'Exento', true, true);

      CREATE TABLE public.sat_tax_rates (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        tax_code varchar(3) NOT NULL REFERENCES public.sat_taxes(code),
        factor_type_code varchar(10) NOT NULL REFERENCES public.sat_factor_types(code),
        rate numeric(10,6),
        description varchar(120) NOT NULL,
        valid_from date,
        valid_to date,
        is_active boolean NOT NULL DEFAULT true,
        simulation_supported boolean NOT NULL DEFAULT false,
        CHECK ((factor_type_code = 'Exento' AND rate IS NULL) OR
               (factor_type_code <> 'Exento' AND rate IS NOT NULL AND rate >= 0)),
        UNIQUE(tax_code, factor_type_code, rate)
      );
      INSERT INTO public.sat_tax_rates(
        tax_code, factor_type_code, rate, description, valid_from,
        is_active, simulation_supported
      ) VALUES
        ('002', 'Tasa', 0.160000, 'IVA 16%', '2017-01-01', true, true),
        ('002', 'Tasa', 0.080000, 'IVA 8%', '2019-01-01', true, true),
        ('002', 'Tasa', 0.000000, 'IVA 0%', '2017-01-01', true, true),
        ('002', 'Exento', NULL, 'IVA exento', '2017-01-01', true, true);

      CREATE TABLE public.sat_payment_forms (
        code varchar(2) PRIMARY KEY,
        description varchar(180) NOT NULL,
        valid_from date,
        valid_to date,
        is_active boolean NOT NULL DEFAULT true,
        simulation_supported boolean NOT NULL DEFAULT false
      );
      INSERT INTO public.sat_payment_forms VALUES
        ('01', 'Efectivo', '2017-01-01', NULL, true, true),
        ('02', 'Cheque nominativo', '2017-01-01', NULL, true, true),
        ('03', 'Transferencia electrónica de fondos', '2017-01-01', NULL, true, true),
        ('04', 'Tarjeta de crédito', '2017-01-01', NULL, true, true),
        ('28', 'Tarjeta de débito', '2017-01-01', NULL, true, true),
        ('99', 'Por definir', '2017-01-01', NULL, true, true);

      CREATE TABLE public.sat_payment_methods (
        code varchar(3) PRIMARY KEY,
        description varchar(120) NOT NULL,
        valid_from date,
        valid_to date,
        is_active boolean NOT NULL DEFAULT true,
        simulation_supported boolean NOT NULL DEFAULT false
      );
      INSERT INTO public.sat_payment_methods VALUES
        ('PUE', 'Pago en una sola exhibición', '2017-01-01', NULL, true, true),
        ('PPD', 'Pago en parcialidades o diferido', '2017-01-01', NULL, true, true);

      CREATE TABLE public.sat_export_codes (
        code varchar(2) PRIMARY KEY,
        description varchar(180) NOT NULL,
        valid_from date,
        valid_to date,
        is_active boolean NOT NULL DEFAULT true,
        simulation_supported boolean NOT NULL DEFAULT false
      );
      INSERT INTO public.sat_export_codes VALUES
        ('01', 'No aplica', '2022-01-01', NULL, true, true),
        ('02', 'Definitiva con clave A1', '2022-01-01', NULL, true, false),
        ('03', 'Temporal', '2022-01-01', NULL, true, false),
        ('04', 'Definitiva con clave distinta a A1', '2022-01-01', NULL, true, false);
    `);

    const companies = (await queryRunner.query(
      'SELECT id, schema_name FROM public.companies ORDER BY created_at, id',
    )) as CompanySchemaRow[];
    for (const company of companies) {
      const schema = quoteIdentifier(company.schema_name);
      await this.createTenantTables(queryRunner, schema);
      await queryRunner.query(
        `INSERT INTO public.tenant_schema_versions(company_id, version, migration_name)
         VALUES ($1, 28, $2) ON CONFLICT (company_id, version) DO NOTHING`,
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
      await queryRunner.query(`DROP TABLE IF EXISTS ${schema}.simulated_invoice_events`);
      await queryRunner.query(`DROP TABLE IF EXISTS ${schema}.simulated_invoice_items`);
      await queryRunner.query(`DROP TABLE IF EXISTS ${schema}.simulated_invoices`);
      await queryRunner.query(
        'DELETE FROM public.tenant_schema_versions WHERE company_id = $1 AND version = 28',
        [company.id],
      );
    }
    await queryRunner.query('DROP TABLE IF EXISTS public.sat_export_codes');
    await queryRunner.query('DROP TABLE IF EXISTS public.sat_payment_methods');
    await queryRunner.query('DROP TABLE IF EXISTS public.sat_payment_forms');
    await queryRunner.query('DROP TABLE IF EXISTS public.sat_tax_rates');
    await queryRunner.query('DROP TABLE IF EXISTS public.sat_factor_types');
    await queryRunner.query('DROP TABLE IF EXISTS public.sat_taxes');
    await queryRunner.query('DROP TABLE IF EXISTS public.sat_tax_objects');
  }

  private async createTenantTables(queryRunner: QueryRunner, schema: string): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE ${schema}.simulated_invoices (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        order_id uuid NOT NULL REFERENCES ${schema}.orders(id) ON DELETE RESTRICT,
        status varchar(20) NOT NULL DEFAULT 'draft'
          CHECK (status IN ('draft', 'issued', 'cancelled')),
        series varchar(25),
        folio bigint CHECK (folio IS NULL OR folio > 0),
        issuer_fiscal_name varchar(180) NOT NULL,
        issuer_tax_id varchar(13) NOT NULL,
        issuer_fiscal_regime_code varchar(3) NOT NULL REFERENCES public.sat_fiscal_regimes(code),
        issuer_postal_code varchar(5) NOT NULL,
        receiver_fiscal_name varchar(180) NOT NULL,
        receiver_tax_id varchar(13) NOT NULL,
        receiver_fiscal_regime_code varchar(3) NOT NULL REFERENCES public.sat_fiscal_regimes(code),
        receiver_postal_code varchar(5) NOT NULL,
        cfdi_use_code varchar(4) NOT NULL REFERENCES public.sat_cfdi_uses(code),
        payment_form_code varchar(2) NOT NULL REFERENCES public.sat_payment_forms(code),
        payment_method_code varchar(3) NOT NULL REFERENCES public.sat_payment_methods(code),
        export_code varchar(2) NOT NULL DEFAULT '01' REFERENCES public.sat_export_codes(code),
        currency_code varchar(3) NOT NULL DEFAULT 'MXN' CHECK (currency_code = 'MXN'),
        prices_include_tax boolean NOT NULL,
        subtotal numeric(14,2) NOT NULL DEFAULT 0 CHECK (subtotal >= 0),
        transferred_tax numeric(14,2) NOT NULL DEFAULT 0 CHECK (transferred_tax >= 0),
        total numeric(14,2) NOT NULL DEFAULT 0 CHECK (total >= 0),
        issued_at timestamptz,
        cancelled_at timestamptz,
        created_by_user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE RESTRICT,
        updated_by_user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE RESTRICT,
        issued_by_user_id uuid REFERENCES public.users(id) ON DELETE RESTRICT,
        cancelled_by_user_id uuid REFERENCES public.users(id) ON DELETE RESTRICT,
        created_at timestamptz NOT NULL DEFAULT now(),
        updated_at timestamptz NOT NULL DEFAULT now(),
        CHECK ((status = 'draft' AND folio IS NULL AND issued_at IS NULL) OR
               (status IN ('issued', 'cancelled') AND series IS NOT NULL AND folio IS NOT NULL AND issued_at IS NOT NULL)),
        CHECK ((status <> 'cancelled' AND cancelled_at IS NULL) OR
               (status = 'cancelled' AND cancelled_at IS NOT NULL)),
        UNIQUE(series, folio)
      );
      CREATE UNIQUE INDEX simulated_invoices_open_order_unique
        ON ${schema}.simulated_invoices(order_id) WHERE status <> 'cancelled';
      CREATE INDEX simulated_invoices_status_date_idx
        ON ${schema}.simulated_invoices(status, created_at DESC, id DESC);

      CREATE TABLE ${schema}.simulated_invoice_items (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        invoice_id uuid NOT NULL REFERENCES ${schema}.simulated_invoices(id) ON DELETE CASCADE,
        order_item_id uuid REFERENCES ${schema}.order_items(id) ON DELETE SET NULL,
        position integer NOT NULL CHECK (position > 0),
        description varchar(300) NOT NULL,
        product_service_code varchar(8),
        unit_code varchar(3),
        unit_name varchar(80) NOT NULL,
        quantity numeric(14,3) NOT NULL CHECK (quantity > 0),
        unit_price numeric(14,2) NOT NULL CHECK (unit_price >= 0),
        tax_object_code varchar(2) NOT NULL REFERENCES public.sat_tax_objects(code),
        tax_code varchar(3) REFERENCES public.sat_taxes(code),
        factor_type_code varchar(10) REFERENCES public.sat_factor_types(code),
        tax_rate numeric(10,6),
        base_amount numeric(14,2) NOT NULL CHECK (base_amount >= 0),
        tax_amount numeric(14,2) NOT NULL DEFAULT 0 CHECK (tax_amount >= 0),
        total numeric(14,2) NOT NULL CHECK (total >= 0),
        CHECK ((tax_object_code = '01' AND tax_code IS NULL AND factor_type_code IS NULL AND tax_rate IS NULL AND tax_amount = 0)
          OR (tax_object_code = '02' AND tax_code IS NOT NULL AND factor_type_code IS NOT NULL))
      );
      CREATE INDEX simulated_invoice_items_invoice_idx
        ON ${schema}.simulated_invoice_items(invoice_id, position, id);

      CREATE TABLE ${schema}.simulated_invoice_events (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        invoice_id uuid NOT NULL REFERENCES ${schema}.simulated_invoices(id) ON DELETE CASCADE,
        event_type varchar(20) NOT NULL CHECK (event_type IN ('created', 'updated', 'issued', 'cancelled')),
        details jsonb NOT NULL DEFAULT '{}'::jsonb,
        actor_user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE RESTRICT,
        created_at timestamptz NOT NULL DEFAULT now()
      );
      CREATE INDEX simulated_invoice_events_invoice_date_idx
        ON ${schema}.simulated_invoice_events(invoice_id, created_at, id);
    `);
  }
}
