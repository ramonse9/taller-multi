import { MigrationInterface, QueryRunner } from 'typeorm';

const BASE_FEATURES = [
  'dashboard',
  'customer_history',
  'vehicle_history',
  'vehicle_catalog',
  'service_orders',
  'free_order_items',
  'expenses',
  'profitability',
  'user_management',
] as const;

const CONTROL_FEATURES = ['item_catalog', 'suppliers', 'purchases', 'inventory'] as const;

export class DefinitiveSubscriptionPlanMatrix1700000044000 implements MigrationInterface {
  name = 'DefinitiveSubscriptionPlanMatrix1700000044000';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DO $$
      BEGIN
        IF (
          SELECT count(*) FROM public.subscription_plans
          WHERE code IN ('essential', 'control', 'invoicing')
        ) <> 3 THEN
          RAISE EXCEPTION 'La matriz requiere los planes essential, control e invoicing';
        END IF;
      END $$
    `);
    await queryRunner.query(`
      INSERT INTO public.subscription_features(code, name, description) VALUES
        ('dashboard', 'Tablero operativo', 'Resumen operativo, indicadores y actividad reciente.'),
        ('vehicle_catalog', 'Marcas y modelos', 'Consulta y administración del catálogo global de marcas y modelos.'),
        ('user_management', 'Usuarios y permisos', 'Administración de usuarios, roles y permisos de la compañía.'),
        ('suppliers', 'Proveedores', 'Registro y administración de proveedores.'),
        ('purchases', 'Compras', 'Registro, confirmación y seguimiento de compras.')
    `);
    await queryRunner.query(`
      INSERT INTO public.subscription_plan_features(plan_code, feature_code)
      SELECT plan.code, feature.code
      FROM public.subscription_plans plan
      JOIN public.subscription_features feature
        ON feature.code = ANY($1::varchar[])
      WHERE plan.code IN ('essential', 'control', 'invoicing')
      ON CONFLICT DO NOTHING
    `, [BASE_FEATURES]);
    await queryRunner.query(`
      INSERT INTO public.subscription_plan_features(plan_code, feature_code)
      SELECT plan.code, feature.code
      FROM public.subscription_plans plan
      JOIN public.subscription_features feature
        ON feature.code = ANY($1::varchar[])
      WHERE plan.code IN ('control', 'invoicing')
      ON CONFLICT DO NOTHING
    `, [CONTROL_FEATURES]);
    await queryRunner.query(`
      INSERT INTO public.subscription_plan_features(plan_code, feature_code)
      VALUES ('invoicing', 'invoicing')
      ON CONFLICT DO NOTHING
    `);
    await queryRunner.query(`
      DELETE FROM public.subscription_plan_features
      WHERE plan_code = 'essential'
        AND feature_code IN ('item_catalog', 'suppliers', 'purchases', 'inventory', 'invoicing')
    `);
    await queryRunner.query(`
      DELETE FROM public.subscription_plan_features
      WHERE plan_code = 'control' AND feature_code = 'invoicing'
    `);
    await queryRunner.query(`
      UPDATE public.subscription_plans
      SET name = CASE code
            WHEN 'essential' THEN 'Esencial'
            WHEN 'control' THEN 'Control'
            WHEN 'invoicing' THEN 'Facturación'
          END,
          description = CASE code
            WHEN 'essential' THEN 'Clientes, vehículos, órdenes, gastos y utilidad con conceptos libres.'
            WHEN 'control' THEN 'Todo Esencial más catálogo, proveedores, compras e inventario.'
            WHEN 'invoicing' THEN 'Todo Control más preparación fiscal y facturación simulada sin validez fiscal.'
          END,
          updated_at = now()
      WHERE code IN ('essential', 'control', 'invoicing')
    `);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DELETE FROM public.subscription_plan_features
      WHERE feature_code IN ('dashboard', 'vehicle_catalog', 'user_management', 'suppliers', 'purchases')
    `);
    await queryRunner.query(`
      DELETE FROM public.subscription_plan_features
      WHERE plan_code = 'essential' AND feature_code IN ('expenses', 'profitability')
    `);
    await queryRunner.query(`
      DELETE FROM public.subscription_features
      WHERE code IN ('dashboard', 'vehicle_catalog', 'user_management', 'suppliers', 'purchases')
    `);
    await queryRunner.query(`
      UPDATE public.subscription_plans
      SET description = CASE code
            WHEN 'essential' THEN 'Historial de clientes, vehículos y órdenes con conceptos libres.'
            WHEN 'control' THEN 'Catálogo, inventario, gastos y cálculo de utilidad.'
            WHEN 'invoicing' THEN 'Control operativo completo y facturación electrónica.'
          END,
          updated_at = now()
      WHERE code IN ('essential', 'control', 'invoicing')
    `);
  }
}
