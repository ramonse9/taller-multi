import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { RenameBasicPlanToEssential1700000043000 } from '../../src/database/migrations/public/1700000043000-rename-basic-plan-to-essential';
import { DefinitiveSubscriptionPlanMatrix1700000044000 } from '../../src/database/migrations/public/1700000044000-definitive-subscription-plan-matrix';

describe('Cambio del plan Básico a Esencial con PostgreSQL real', () => {
  const testDatabaseUrl = process.env.TEST_DATABASE_URL!;
  let control: DataSource;

  beforeAll(async () => {
    const databaseName = new URL(testDatabaseUrl).pathname.slice(1);
    if (!databaseName.endsWith('_test')) {
      throw new Error('La migración de planes solo puede probarse sobre TEST_DATABASE_URL *_test');
    }
    control = new DataSource({
      type: 'postgres',
      url: testDatabaseUrl,
      applicationName: 'taller-subscription-plan-rename-control',
    });
    await control.initialize();
  });

  beforeEach(async () => {
    await resetPublicSchema(control);
    await prepareLegacyPlans(control);
  });

  afterAll(async () => {
    await resetPublicSchema(control);
    await control.destroy();
  });

  it('conserva compañías, capacidades, límites e historial al renombrar y revertir', async () => {
    const migrations = new DataSource({
      type: 'postgres',
      url: testDatabaseUrl,
      applicationName: 'taller-subscription-plan-rename-runner',
      migrations: [
        RenameBasicPlanToEssential1700000043000,
        DefinitiveSubscriptionPlanMatrix1700000044000,
      ],
      migrationsTableName: 'subscription_plan_rename_migrations',
      synchronize: false,
    });
    await migrations.initialize();

    try {
      const executed = await migrations.runMigrations({ transaction: 'all' });
      expect(executed.map(({ name }) => name)).toEqual([
        'RenameBasicPlanToEssential1700000043000',
        'DefinitiveSubscriptionPlanMatrix1700000044000',
      ]);

      expect(await readPlanSnapshot(control, 'basic')).toBeNull();
      expect(await readPlanSnapshot(control, 'essential')).toEqual({
        code: 'essential',
        name: 'Esencial',
        description: 'Clientes, vehículos, órdenes, gastos y utilidad con conceptos libres.',
        sort_order: 1,
        is_active: true,
        features: [
          'customer_history',
          'dashboard',
          'expenses',
          'free_order_items',
          'profitability',
          'service_orders',
          'user_management',
          'vehicle_catalog',
          'vehicle_history',
        ],
        limits: { max_branches: 1, max_monthly_invoices: 0, max_users: 3 },
      });

      const subscriptions = await control.query<Array<{ company: string; plan_code: string }>>(
        `SELECT company.name AS company, subscription.plan_code
         FROM public.company_subscriptions subscription
         JOIN public.companies company ON company.id = subscription.company_id
         ORDER BY company.name`,
      );
      expect(subscriptions).toEqual([
        { company: 'Control existente', plan_code: 'control' },
        { company: 'Taller esencial', plan_code: 'essential' },
      ]);

      const history = await control.query<
        Array<{ previous_plan_code: string | null; new_plan_code: string }>
      >(
        `SELECT previous_plan_code, new_plan_code
         FROM public.company_subscription_history
         ORDER BY changed_at, id`,
      );
      expect(history).toEqual([
        { previous_plan_code: null, new_plan_code: 'essential' },
        { previous_plan_code: 'essential', new_plan_code: 'control' },
      ]);

      const controlPlan = await readPlanSnapshot(control, 'control');
      expect(controlPlan?.features).toEqual(
        expect.arrayContaining([
          'dashboard',
          'expenses',
          'inventory',
          'item_catalog',
          'profitability',
          'purchases',
          'suppliers',
        ]),
      );
      const invoicingPlan = await readPlanSnapshot(control, 'invoicing');
      expect(invoicingPlan?.features).toEqual(
        expect.arrayContaining(['inventory', 'invoicing', 'purchases', 'suppliers']),
      );

      await migrations.undoLastMigration({ transaction: 'all' });
      expect(await readPlanSnapshot(control, 'essential')).toMatchObject({
        features: ['customer_history', 'free_order_items', 'service_orders', 'vehicle_history'],
      });
      await migrations.undoLastMigration({ transaction: 'all' });
      expect(await readPlanSnapshot(control, 'essential')).toBeNull();
      expect(await readPlanSnapshot(control, 'basic')).toMatchObject({
        code: 'basic',
        name: 'Básico',
        sort_order: 1,
        features: ['customer_history', 'free_order_items', 'service_orders', 'vehicle_history'],
        limits: { max_branches: 1, max_monthly_invoices: 0, max_users: 3 },
      });
    } finally {
      await migrations.destroy();
    }
  });
});

async function prepareLegacyPlans(dataSource: DataSource): Promise<void> {
  await dataSource.query('CREATE EXTENSION IF NOT EXISTS pgcrypto');
  await dataSource.query(`
    CREATE TABLE public.companies (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      name varchar(150) NOT NULL UNIQUE
    )
  `);
  await dataSource.query(`
    CREATE TABLE public.subscription_plans (
      code varchar(30) PRIMARY KEY,
      name varchar(80) NOT NULL UNIQUE,
      description varchar(300) NOT NULL,
      sort_order smallint NOT NULL UNIQUE,
      is_active boolean NOT NULL DEFAULT true,
      created_at timestamptz NOT NULL DEFAULT now(),
      updated_at timestamptz NOT NULL DEFAULT now()
    )
  `);
  await dataSource.query(`
    CREATE TABLE public.subscription_features (
      code varchar(50) PRIMARY KEY,
      name varchar(100),
      description varchar(300)
    )
  `);
  await dataSource.query(`
    CREATE TABLE public.subscription_plan_features (
      plan_code varchar(30) NOT NULL REFERENCES public.subscription_plans(code) ON DELETE CASCADE,
      feature_code varchar(50) NOT NULL REFERENCES public.subscription_features(code),
      PRIMARY KEY (plan_code, feature_code)
    )
  `);
  await dataSource.query(`
    CREATE TABLE public.subscription_plan_limits (
      plan_code varchar(30) NOT NULL REFERENCES public.subscription_plans(code) ON DELETE CASCADE,
      limit_code varchar(50) NOT NULL,
      limit_value integer,
      PRIMARY KEY (plan_code, limit_code)
    )
  `);
  await dataSource.query(`
    CREATE TABLE public.company_subscriptions (
      company_id uuid PRIMARY KEY REFERENCES public.companies(id) ON DELETE CASCADE,
      plan_code varchar(30) NOT NULL REFERENCES public.subscription_plans(code) ON DELETE RESTRICT,
      status varchar(20) NOT NULL,
      created_at timestamptz NOT NULL DEFAULT now(),
      updated_at timestamptz NOT NULL DEFAULT now()
    )
  `);
  await dataSource.query(`
    CREATE TABLE public.company_subscription_history (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
      previous_plan_code varchar(30) REFERENCES public.subscription_plans(code) ON DELETE RESTRICT,
      new_plan_code varchar(30) NOT NULL REFERENCES public.subscription_plans(code) ON DELETE RESTRICT,
      new_status varchar(20) NOT NULL,
      changed_at timestamptz NOT NULL DEFAULT now()
    )
  `);
  await dataSource.query(`
    INSERT INTO public.subscription_plans(code, name, description, sort_order) VALUES
      ('basic', 'Básico', 'Historial de clientes, vehículos y órdenes con conceptos libres.', 1),
      ('control', 'Control', 'Catálogo, inventario, gastos y cálculo de utilidad.', 2),
      ('invoicing', 'Facturación', 'Control operativo completo y facturación electrónica.', 3)
  `);
  await dataSource.query(`
    INSERT INTO public.subscription_features(code) VALUES
      ('customer_history'), ('vehicle_history'), ('service_orders'), ('free_order_items'),
      ('item_catalog'), ('inventory'), ('expenses'), ('profitability'), ('invoicing')
  `);
  await dataSource.query(`
    INSERT INTO public.subscription_plan_features(plan_code, feature_code)
    SELECT 'basic', code FROM public.subscription_features WHERE code <> 'inventory'
      AND code NOT IN ('item_catalog', 'expenses', 'profitability', 'invoicing')
  `);
  await dataSource.query(`
    INSERT INTO public.subscription_plan_features(plan_code, feature_code)
    SELECT 'control', code FROM public.subscription_features WHERE code <> 'invoicing'
  `);
  await dataSource.query(`
    INSERT INTO public.subscription_plan_features(plan_code, feature_code)
    SELECT 'invoicing', code FROM public.subscription_features
  `);
  await dataSource.query(`
    INSERT INTO public.subscription_plan_limits(plan_code, limit_code, limit_value) VALUES
      ('basic', 'max_users', 3),
      ('basic', 'max_branches', 1),
      ('basic', 'max_monthly_invoices', 0)
  `);
  await dataSource.query(`
    WITH companies AS (
      INSERT INTO public.companies(name) VALUES ('Taller esencial'), ('Control existente')
      RETURNING id, name
    )
    INSERT INTO public.company_subscriptions(company_id, plan_code, status)
    SELECT id, CASE WHEN name = 'Taller esencial' THEN 'basic' ELSE 'control' END, 'active'
    FROM companies
  `);
  await dataSource.query(`
    INSERT INTO public.company_subscription_history(
      company_id, previous_plan_code, new_plan_code, new_status, changed_at
    )
    SELECT id, null, 'basic', 'active', '2026-01-01T00:00:00Z'
    FROM public.companies WHERE name = 'Taller esencial'
  `);
  await dataSource.query(`
    INSERT INTO public.company_subscription_history(
      company_id, previous_plan_code, new_plan_code, new_status, changed_at
    )
    SELECT id, 'basic', 'control', 'active', '2026-02-01T00:00:00Z'
    FROM public.companies WHERE name = 'Control existente'
  `);
}

async function readPlanSnapshot(
  dataSource: DataSource,
  code: string,
): Promise<PlanSnapshot | null> {
  const rows = await dataSource.query<
    Array<{
      code: string;
      name: string;
      description: string;
      sort_order: number;
      is_active: boolean;
      features: string[];
      limits: Record<string, number>;
    }>
  >(
    `SELECT plan.code, plan.name, plan.description, plan.sort_order, plan.is_active,
            COALESCE((
              SELECT jsonb_agg(feature_code ORDER BY feature_code)
              FROM public.subscription_plan_features
              WHERE plan_code = plan.code
            ), '[]'::jsonb) AS features,
            COALESCE((
              SELECT jsonb_object_agg(limit_code, limit_value ORDER BY limit_code)
              FROM public.subscription_plan_limits
              WHERE plan_code = plan.code
            ), '{}'::jsonb) AS limits
     FROM public.subscription_plans plan
     WHERE plan.code = $1`,
    [code],
  );
  return rows[0] ?? null;
}

interface PlanSnapshot {
  code: string;
  name: string;
  description: string;
  sort_order: number;
  is_active: boolean;
  features: string[];
  limits: Record<string, number>;
}

async function resetPublicSchema(dataSource: DataSource): Promise<void> {
  await dataSource.query('DROP SCHEMA IF EXISTS public CASCADE');
  await dataSource.query('CREATE SCHEMA public AUTHORIZATION CURRENT_USER');
}
