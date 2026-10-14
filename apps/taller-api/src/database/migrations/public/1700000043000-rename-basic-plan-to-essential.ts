import { MigrationInterface, QueryRunner } from 'typeorm';

export class RenameBasicPlanToEssential1700000043000 implements MigrationInterface {
  name = 'RenameBasicPlanToEssential1700000043000';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM public.subscription_plans WHERE code = 'basic') THEN
          RAISE EXCEPTION 'No se encontró el plan basic que debe migrarse a essential';
        END IF;
        IF EXISTS (SELECT 1 FROM public.subscription_plans WHERE code = 'essential') THEN
          RAISE EXCEPTION 'El plan essential ya existe; no es seguro continuar la migración';
        END IF;
      END $$
    `);
    await queryRunner.query(`
      INSERT INTO public.subscription_plans(
        code, name, description, sort_order, is_active, created_at, updated_at
      )
      SELECT 'essential', 'Esencial', description,
             (SELECT max(sort_order) + 1 FROM public.subscription_plans),
             is_active, created_at, now()
      FROM public.subscription_plans
      WHERE code = 'basic'
    `);
    await queryRunner.query(`
      INSERT INTO public.subscription_plan_features(plan_code, feature_code)
      SELECT 'essential', feature_code
      FROM public.subscription_plan_features
      WHERE plan_code = 'basic'
    `);
    await queryRunner.query(`
      INSERT INTO public.subscription_plan_limits(plan_code, limit_code, limit_value)
      SELECT 'essential', limit_code, limit_value
      FROM public.subscription_plan_limits
      WHERE plan_code = 'basic'
    `);
    await queryRunner.query(`
      UPDATE public.company_subscriptions
      SET plan_code = 'essential', updated_at = now()
      WHERE plan_code = 'basic'
    `);
    await queryRunner.query(`
      UPDATE public.company_subscription_history
      SET previous_plan_code = 'essential'
      WHERE previous_plan_code = 'basic'
    `);
    await queryRunner.query(`
      UPDATE public.company_subscription_history
      SET new_plan_code = 'essential'
      WHERE new_plan_code = 'basic'
    `);
    await queryRunner.query("DELETE FROM public.subscription_plans WHERE code = 'basic'");
    await queryRunner.query(`
      UPDATE public.subscription_plans
      SET sort_order = 1, updated_at = now()
      WHERE code = 'essential'
    `);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM public.subscription_plans WHERE code = 'essential') THEN
          RAISE EXCEPTION 'No se encontró el plan essential que debe revertirse a basic';
        END IF;
        IF EXISTS (SELECT 1 FROM public.subscription_plans WHERE code = 'basic') THEN
          RAISE EXCEPTION 'El plan basic ya existe; no es seguro revertir la migración';
        END IF;
      END $$
    `);
    await queryRunner.query(`
      INSERT INTO public.subscription_plans(
        code, name, description, sort_order, is_active, created_at, updated_at
      )
      SELECT 'basic', 'Básico', description,
             (SELECT max(sort_order) + 1 FROM public.subscription_plans),
             is_active, created_at, now()
      FROM public.subscription_plans
      WHERE code = 'essential'
    `);
    await queryRunner.query(`
      INSERT INTO public.subscription_plan_features(plan_code, feature_code)
      SELECT 'basic', feature_code
      FROM public.subscription_plan_features
      WHERE plan_code = 'essential'
    `);
    await queryRunner.query(`
      INSERT INTO public.subscription_plan_limits(plan_code, limit_code, limit_value)
      SELECT 'basic', limit_code, limit_value
      FROM public.subscription_plan_limits
      WHERE plan_code = 'essential'
    `);
    await queryRunner.query(`
      UPDATE public.company_subscriptions
      SET plan_code = 'basic', updated_at = now()
      WHERE plan_code = 'essential'
    `);
    await queryRunner.query(`
      UPDATE public.company_subscription_history
      SET previous_plan_code = 'basic'
      WHERE previous_plan_code = 'essential'
    `);
    await queryRunner.query(`
      UPDATE public.company_subscription_history
      SET new_plan_code = 'basic'
      WHERE new_plan_code = 'essential'
    `);
    await queryRunner.query("DELETE FROM public.subscription_plans WHERE code = 'essential'");
    await queryRunner.query(`
      UPDATE public.subscription_plans
      SET sort_order = 1, updated_at = now()
      WHERE code = 'basic'
    `);
  }
}
