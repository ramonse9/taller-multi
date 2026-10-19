import { MigrationInterface, QueryRunner } from 'typeorm';
import { quoteIdentifier } from '../../schema-name';

interface CompanySchemaRow {
  id: string;
  schema_name: string;
}

export class SimulatedInvoiceTransitions1700000046000 implements MigrationInterface {
  name = 'SimulatedInvoiceTransitions1700000046000';

  async up(queryRunner: QueryRunner): Promise<void> {
    const companies = (await queryRunner.query(
      'SELECT id, schema_name FROM public.companies ORDER BY created_at, id',
    )) as CompanySchemaRow[];

    for (const company of companies) {
      await this.upTenant(queryRunner, company.schema_name);
      await queryRunner.query(
        `INSERT INTO public.tenant_schema_versions(company_id, version, migration_name)
         VALUES ($1, 29, $2) ON CONFLICT (company_id, version) DO NOTHING`,
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
      const discarded = (await queryRunner.query(
        `SELECT count(*)::int AS total FROM ${schema}.simulated_invoices WHERE status='discarded'`,
      )) as Array<{ total: number }>;
      if ((discarded[0]?.total ?? 0) > 0) {
        throw new Error(
          `No se puede revertir ${this.name}: ${company.schema_name} contiene borradores descartados`,
        );
      }
      await this.dropLifecycleChecks(queryRunner, company.schema_name);
      await this.dropEventTypeCheck(queryRunner, company.schema_name);
      await queryRunner.query(
        `DROP INDEX IF EXISTS ${schema}.simulated_invoices_open_order_unique`,
      );
      await queryRunner.query(`
        ALTER TABLE ${schema}.simulated_invoices
          DROP COLUMN discarded_by_user_id,
          DROP COLUMN discarded_at;
        ALTER TABLE ${schema}.simulated_invoices
          ADD CONSTRAINT simulated_invoices_status_check
            CHECK (status IN ('draft','issued','cancelled')),
          ADD CONSTRAINT simulated_invoices_lifecycle_check
            CHECK ((status = 'draft' AND folio IS NULL AND issued_at IS NULL) OR
                   (status IN ('issued','cancelled') AND series IS NOT NULL AND folio IS NOT NULL AND issued_at IS NOT NULL)),
          ADD CONSTRAINT simulated_invoices_cancelled_check
            CHECK ((status <> 'cancelled' AND cancelled_at IS NULL) OR
                   (status = 'cancelled' AND cancelled_at IS NOT NULL));
        CREATE UNIQUE INDEX simulated_invoices_open_order_unique
          ON ${schema}.simulated_invoices(order_id) WHERE status <> 'cancelled';
        ALTER TABLE ${schema}.simulated_invoice_events
          ADD CONSTRAINT simulated_invoice_events_event_type_check
            CHECK (event_type IN ('created','updated','issued','cancelled'));
      `);
      await queryRunner.query(
        'DELETE FROM public.tenant_schema_versions WHERE company_id=$1 AND version=29',
        [company.id],
      );
    }
  }

  private async upTenant(queryRunner: QueryRunner, schemaName: string): Promise<void> {
    const schema = quoteIdentifier(schemaName);
    const inconsistentPue = (await queryRunner.query(
      `SELECT invoice.id, invoice.order_id
       FROM ${schema}.simulated_invoices invoice
       JOIN ${schema}.orders service_order ON service_order.id=invoice.order_id
       WHERE invoice.status='issued' AND invoice.payment_method_code='PUE'
         AND service_order.is_paid=false
       ORDER BY invoice.created_at, invoice.id LIMIT 1`,
    )) as Array<{ id: string; order_id: string }>;
    if (inconsistentPue[0]) {
      throw new Error(
        `No se puede aplicar ${this.name} en ${schemaName}: la simulación PUE ${inconsistentPue[0].id} pertenece a una orden pendiente (${inconsistentPue[0].order_id})`,
      );
    }
    await queryRunner.query(`
      ALTER TABLE ${schema}.simulated_invoices
        ADD COLUMN discarded_at timestamptz,
        ADD COLUMN discarded_by_user_id uuid REFERENCES public.users(id) ON DELETE RESTRICT;
    `);
    await this.dropLifecycleChecks(queryRunner, schemaName);
    await this.dropEventTypeCheck(queryRunner, schemaName);
    await queryRunner.query(`DROP INDEX IF EXISTS ${schema}.simulated_invoices_open_order_unique`);
    await queryRunner.query(`
      ALTER TABLE ${schema}.simulated_invoices
        ADD CONSTRAINT simulated_invoices_status_check
          CHECK (status IN ('draft','issued','cancelled','discarded')),
        ADD CONSTRAINT simulated_invoices_lifecycle_check CHECK (
          (status='draft' AND series IS NULL AND folio IS NULL AND issued_at IS NULL
            AND cancelled_at IS NULL AND discarded_at IS NULL) OR
          (status='discarded' AND series IS NULL AND folio IS NULL AND issued_at IS NULL
            AND cancelled_at IS NULL AND discarded_at IS NOT NULL) OR
          (status='issued' AND series IS NOT NULL AND folio IS NOT NULL AND issued_at IS NOT NULL
            AND cancelled_at IS NULL AND discarded_at IS NULL) OR
          (status='cancelled' AND series IS NOT NULL AND folio IS NOT NULL AND issued_at IS NOT NULL
            AND cancelled_at IS NOT NULL AND discarded_at IS NULL)
        );
      CREATE UNIQUE INDEX simulated_invoices_open_order_unique
        ON ${schema}.simulated_invoices(order_id) WHERE status IN ('draft','issued');
      ALTER TABLE ${schema}.simulated_invoice_events
        ADD CONSTRAINT simulated_invoice_events_event_type_check
          CHECK (event_type IN ('created','updated','issued','cancelled','discarded'));
    `);
  }

  private async dropLifecycleChecks(queryRunner: QueryRunner, schemaName: string): Promise<void> {
    const schema = quoteIdentifier(schemaName);
    const constraints = (await queryRunner.query(
      `SELECT constraint_record.conname AS constraint_name
       FROM pg_catalog.pg_constraint constraint_record
       JOIN pg_catalog.pg_class table_record ON table_record.oid=constraint_record.conrelid
       JOIN pg_catalog.pg_namespace namespace_record ON namespace_record.oid=table_record.relnamespace
       WHERE namespace_record.nspname=$1
         AND table_record.relname='simulated_invoices'
         AND constraint_record.contype='c'
         AND (pg_get_constraintdef(constraint_record.oid) ILIKE '%status%'
              OR pg_get_constraintdef(constraint_record.oid) ILIKE '%cancelled_at%'
              OR pg_get_constraintdef(constraint_record.oid) ILIKE '%discarded_at%')`,
      [schemaName],
    )) as Array<{ constraint_name: string }>;
    for (const constraint of constraints) {
      await queryRunner.query(
        `ALTER TABLE ${schema}.simulated_invoices DROP CONSTRAINT ${queryRunner.connection.driver.escape(constraint.constraint_name)}`,
      );
    }
  }

  private async dropEventTypeCheck(queryRunner: QueryRunner, schemaName: string): Promise<void> {
    const schema = quoteIdentifier(schemaName);
    const constraints = (await queryRunner.query(
      `SELECT constraint_record.conname AS constraint_name
       FROM pg_catalog.pg_constraint constraint_record
       JOIN pg_catalog.pg_class table_record ON table_record.oid=constraint_record.conrelid
       JOIN pg_catalog.pg_namespace namespace_record ON namespace_record.oid=table_record.relnamespace
       WHERE namespace_record.nspname=$1
         AND table_record.relname='simulated_invoice_events'
         AND constraint_record.contype='c'
         AND pg_get_constraintdef(constraint_record.oid) ILIKE '%event_type%'`,
      [schemaName],
    )) as Array<{ constraint_name: string }>;
    for (const constraint of constraints) {
      await queryRunner.query(
        `ALTER TABLE ${schema}.simulated_invoice_events DROP CONSTRAINT ${queryRunner.connection.driver.escape(constraint.constraint_name)}`,
      );
    }
  }
}
