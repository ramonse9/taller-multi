import { MigrationInterface, QueryRunner } from 'typeorm';
import { quoteIdentifier } from '../../schema-name';

interface CompanySchemaRow {
  id: string;
  schema_name: string;
}

export class SimulatedInvoicingSettings1700000042000 implements MigrationInterface {
  name = 'SimulatedInvoicingSettings1700000042000';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      INSERT INTO public.permissions(code, module, action, name, description, sort_order) VALUES
        ('invoices.view', 'invoices', 'view', 'Consultar facturación', 'Consultar configuración y documentos de facturación simulada.', 41),
        ('invoices.create', 'invoices', 'create', 'Crear facturas', 'Preparar facturas simuladas.', 42),
        ('invoices.edit', 'invoices', 'edit', 'Editar facturas', 'Modificar facturas simuladas editables.', 43),
        ('invoices.simulate_issue', 'invoices', 'simulate_issue', 'Emitir simulaciones', 'Emitir documentos simulados sin validez fiscal.', 44),
        ('invoices.cancel_simulation', 'invoices', 'cancel_simulation', 'Cancelar simulaciones', 'Cancelar documentos emitidos en modo simulación.', 45),
        ('invoices.configure', 'invoices', 'configure', 'Configurar facturación', 'Administrar la configuración fiscal del emisor.', 46)
    `);
    await queryRunner.query(`
      INSERT INTO public.permission_template_permissions(template_code, permission_code)
      SELECT 'administration', code
      FROM public.permissions
      WHERE code IN (
        'invoices.view', 'invoices.create', 'invoices.edit',
        'invoices.simulate_issue', 'invoices.cancel_simulation'
      )
    `);
    await queryRunner.query(`
      INSERT INTO public.user_permissions(user_id, permission_code)
      SELECT profile.user_id, permission.code
      FROM public.user_permission_profiles profile
      CROSS JOIN public.permissions permission
      WHERE permission.code IN (
        'invoices.view', 'invoices.create', 'invoices.edit',
        'invoices.simulate_issue', 'invoices.cancel_simulation'
      )
        AND profile.template_code = 'administration'
        AND profile.is_customized = false
      ON CONFLICT DO NOTHING
    `);

    const companies = (await queryRunner.query(
      'SELECT id, schema_name FROM public.companies ORDER BY created_at, id',
    )) as CompanySchemaRow[];

    for (const company of companies) {
      const schema = quoteIdentifier(company.schema_name);
      await queryRunner.query(this.createSettingsTable(schema));
      await queryRunner.query(this.createEventsTable(schema));
      await queryRunner.query(`
        INSERT INTO ${schema}.invoice_settings(id) VALUES (1)
      `);
      await queryRunner.query(
        `INSERT INTO public.tenant_schema_versions(company_id, version, migration_name)
         VALUES ($1, 27, $2) ON CONFLICT (company_id, version) DO NOTHING`,
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
      await queryRunner.query(`DROP TABLE IF EXISTS ${schema}.invoice_settings_events`);
      await queryRunner.query(`DROP TABLE IF EXISTS ${schema}.invoice_settings`);
      await queryRunner.query(
        'DELETE FROM public.tenant_schema_versions WHERE company_id = $1 AND version = 27',
        [company.id],
      );
    }

    await queryRunner.query(`
      DELETE FROM public.permissions WHERE code IN (
        'invoices.view', 'invoices.create', 'invoices.edit',
        'invoices.simulate_issue', 'invoices.cancel_simulation', 'invoices.configure'
      )
    `);
  }

  private createSettingsTable(schema: string): string {
    return `CREATE TABLE ${schema}.invoice_settings (
      id smallint PRIMARY KEY DEFAULT 1 CHECK (id = 1),
      mode varchar(20) NOT NULL DEFAULT 'disabled'
        CHECK (mode IN ('disabled', 'simulation')),
      fiscal_name varchar(180),
      tax_id varchar(13),
      fiscal_regime_code varchar(3) REFERENCES public.sat_fiscal_regimes(code),
      fiscal_postal_code varchar(5),
      default_series varchar(25) NOT NULL DEFAULT 'A',
      next_internal_folio bigint NOT NULL DEFAULT 1 CHECK (next_internal_folio > 0),
      prices_include_tax boolean,
      currency_code varchar(3) NOT NULL DEFAULT 'MXN' CHECK (currency_code = 'MXN'),
      is_active boolean NOT NULL DEFAULT false,
      updated_by_user_id uuid REFERENCES public.users(id) ON DELETE SET NULL,
      created_at timestamptz NOT NULL DEFAULT now(),
      updated_at timestamptz NOT NULL DEFAULT now(),
      CHECK (tax_id IS NULL OR tax_id ~ '^[A-ZÑ&]{3,4}[0-9]{2}(0[1-9]|1[0-2])(0[1-9]|[12][0-9]|3[01])[A-Z0-9]{2}[0-9A]$'),
      CHECK (tax_id IS NULL OR tax_id NOT IN ('XAXX010101000', 'XEXX010101000')),
      CHECK (fiscal_postal_code IS NULL OR fiscal_postal_code ~ '^[0-9]{5}$'),
      CHECK (fiscal_regime_code IS NULL OR fiscal_regime_code ~ '^[0-9]{3}$'),
      CHECK (default_series ~ '^[A-Z0-9_-]{1,25}$')
    )`;
  }

  private createEventsTable(schema: string): string {
    return `CREATE TABLE ${schema}.invoice_settings_events (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      event_type varchar(30) NOT NULL
        CHECK (event_type IN ('profile_updated', 'mode_changed')),
      changed_fields varchar(50)[] NOT NULL,
      previous_values jsonb NOT NULL,
      new_values jsonb NOT NULL,
      actor_user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE RESTRICT,
      created_at timestamptz NOT NULL DEFAULT now(),
      CHECK (cardinality(changed_fields) > 0)
    )`;
  }
}
