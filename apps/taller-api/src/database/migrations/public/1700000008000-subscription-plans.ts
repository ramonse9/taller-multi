import { MigrationInterface, QueryRunner } from 'typeorm';

export class SubscriptionPlans1700000008000 implements MigrationInterface {
  name = 'SubscriptionPlans1700000008000';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE public.subscription_plans (
        code varchar(30) PRIMARY KEY,
        name varchar(80) NOT NULL UNIQUE,
        description varchar(300) NOT NULL,
        sort_order smallint NOT NULL UNIQUE CHECK (sort_order > 0),
        is_active boolean NOT NULL DEFAULT true,
        created_at timestamptz NOT NULL DEFAULT now(),
        updated_at timestamptz NOT NULL DEFAULT now()
      )
    `);
    await queryRunner.query(`
      CREATE TABLE public.subscription_features (
        code varchar(50) PRIMARY KEY,
        name varchar(100) NOT NULL UNIQUE,
        description varchar(300) NOT NULL
      )
    `);
    await queryRunner.query(`
      CREATE TABLE public.subscription_plan_features (
        plan_code varchar(30) NOT NULL REFERENCES public.subscription_plans(code) ON DELETE CASCADE,
        feature_code varchar(50) NOT NULL REFERENCES public.subscription_features(code) ON DELETE RESTRICT,
        PRIMARY KEY (plan_code, feature_code)
      )
    `);
    await queryRunner.query(`
      CREATE TABLE public.subscription_plan_limits (
        plan_code varchar(30) NOT NULL REFERENCES public.subscription_plans(code) ON DELETE CASCADE,
        limit_code varchar(50) NOT NULL CHECK (
          limit_code IN ('max_users', 'max_branches', 'max_monthly_invoices')
        ),
        limit_value integer CHECK (limit_value IS NULL OR limit_value >= 0),
        PRIMARY KEY (plan_code, limit_code)
      )
    `);
    await queryRunner.query(`
      CREATE TABLE public.company_subscriptions (
        company_id uuid PRIMARY KEY REFERENCES public.companies(id) ON DELETE CASCADE,
        plan_code varchar(30) NOT NULL REFERENCES public.subscription_plans(code) ON DELETE RESTRICT,
        status varchar(20) NOT NULL CHECK (
          status IN ('trialing', 'active', 'past_due', 'suspended', 'canceled')
        ),
        trial_starts_at timestamptz,
        trial_ends_at timestamptz,
        current_period_starts_at timestamptz,
        current_period_ends_at timestamptz,
        created_at timestamptz NOT NULL DEFAULT now(),
        updated_at timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT company_subscriptions_trial_dates CHECK (
          trial_starts_at IS NULL OR trial_ends_at IS NULL OR trial_ends_at > trial_starts_at
        ),
        CONSTRAINT company_subscriptions_period_dates CHECK (
          current_period_starts_at IS NULL OR current_period_ends_at IS NULL OR
          current_period_ends_at > current_period_starts_at
        )
      )
    `);
    await queryRunner.query(`
      CREATE TABLE public.company_subscription_history (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
        previous_plan_code varchar(30) REFERENCES public.subscription_plans(code) ON DELETE RESTRICT,
        new_plan_code varchar(30) NOT NULL REFERENCES public.subscription_plans(code) ON DELETE RESTRICT,
        previous_status varchar(20),
        new_status varchar(20) NOT NULL,
        reason varchar(300),
        changed_by_user_id uuid REFERENCES public.users(id) ON DELETE SET NULL,
        changed_at timestamptz NOT NULL DEFAULT now()
      )
    `);
    await queryRunner.query(
      'CREATE INDEX company_subscription_history_company_idx ON public.company_subscription_history(company_id, changed_at DESC)',
    );

    await queryRunner.query(`
      INSERT INTO public.subscription_plans(code, name, description, sort_order) VALUES
        ('basic', 'Básico', 'Historial de clientes, vehículos y órdenes con conceptos libres.', 1),
        ('control', 'Control', 'Catálogo, inventario, gastos y cálculo de utilidad.', 2),
        ('invoicing', 'Facturación', 'Control operativo completo y facturación electrónica.', 3)
    `);
    await queryRunner.query(`
      INSERT INTO public.subscription_features(code, name, description) VALUES
        ('customer_history', 'Historial de clientes', 'Registro e historial de personas y empresas.'),
        ('vehicle_history', 'Historial de vehículos', 'Registro e historial de vehículos por cliente.'),
        ('service_orders', 'Órdenes de servicio', 'Creación y seguimiento de órdenes de servicio.'),
        ('free_order_items', 'Conceptos libres', 'Captura libre de conceptos en las órdenes.'),
        ('item_catalog', 'Catálogo de conceptos', 'Catálogo de productos y servicios.'),
        ('inventory', 'Inventario', 'Existencias y movimientos de inventario.'),
        ('expenses', 'Gastos', 'Registro y clasificación de gastos.'),
        ('profitability', 'Utilidad', 'Cálculo de márgenes y utilidad por periodo.'),
        ('invoicing', 'Facturación', 'Emisión y administración de comprobantes fiscales.')
    `);
    await queryRunner.query(`
      INSERT INTO public.subscription_plan_features(plan_code, feature_code)
      SELECT 'basic', code FROM public.subscription_features
      WHERE code IN ('customer_history', 'vehicle_history', 'service_orders', 'free_order_items')
    `);
    await queryRunner.query(`
      INSERT INTO public.subscription_plan_features(plan_code, feature_code)
      SELECT 'control', code FROM public.subscription_features
      WHERE code <> 'invoicing'
    `);
    await queryRunner.query(`
      INSERT INTO public.subscription_plan_features(plan_code, feature_code)
      SELECT 'invoicing', code FROM public.subscription_features
    `);
    await queryRunner.query(`
      INSERT INTO public.subscription_plan_limits(plan_code, limit_code, limit_value) VALUES
        ('basic', 'max_users', 3), ('basic', 'max_branches', 1),
        ('basic', 'max_monthly_invoices', 0),
        ('control', 'max_users', 10), ('control', 'max_branches', 3),
        ('control', 'max_monthly_invoices', 0),
        ('invoicing', 'max_users', 25), ('invoicing', 'max_branches', 5),
        ('invoicing', 'max_monthly_invoices', 100)
    `);

    await queryRunner.query(`
      INSERT INTO public.company_subscriptions(
        company_id, plan_code, status, current_period_starts_at
      )
      SELECT id, 'basic', 'active', created_at FROM public.companies
    `);
    await queryRunner.query(`
      INSERT INTO public.company_subscription_history(
        company_id, new_plan_code, new_status, reason
      )
      SELECT id, 'basic', 'active', 'Asignación inicial durante la migración'
      FROM public.companies
    `);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP TABLE IF EXISTS public.company_subscription_history');
    await queryRunner.query('DROP TABLE IF EXISTS public.company_subscriptions');
    await queryRunner.query('DROP TABLE IF EXISTS public.subscription_plan_limits');
    await queryRunner.query('DROP TABLE IF EXISTS public.subscription_plan_features');
    await queryRunner.query('DROP TABLE IF EXISTS public.subscription_features');
    await queryRunner.query('DROP TABLE IF EXISTS public.subscription_plans');
  }
}
