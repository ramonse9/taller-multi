import { MigrationInterface, QueryRunner } from 'typeorm';

export class RemoveSubscriptionTrials1700000036000 implements MigrationInterface {
  name = 'RemoveSubscriptionTrials1700000036000';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      INSERT INTO public.company_subscription_history(
        company_id, previous_plan_code, new_plan_code, previous_status, new_status, reason
      )
      SELECT company_id, plan_code, plan_code, 'trialing', 'active',
             'Periodo de prueba retirado; suscripción activada'
      FROM public.company_subscriptions
      WHERE status = 'trialing'
    `);
    await queryRunner.query(`
      UPDATE public.company_subscriptions
      SET status = 'active',
          current_period_starts_at = COALESCE(
            current_period_starts_at,
            trial_starts_at,
            created_at
          ),
          current_period_ends_at = NULL,
          updated_at = now()
      WHERE status = 'trialing'
    `);
    await queryRunner.query(`
      ALTER TABLE public.company_subscriptions
      DROP CONSTRAINT IF EXISTS company_subscriptions_trial_dates
    `);
    await queryRunner.query(`
      ALTER TABLE public.company_subscriptions
      DROP COLUMN IF EXISTS trial_starts_at,
      DROP COLUMN IF EXISTS trial_ends_at
    `);
    await queryRunner.query(`
      ALTER TABLE public.company_subscriptions
      DROP CONSTRAINT IF EXISTS company_subscriptions_status_check
    `);
    await queryRunner.query(`
      ALTER TABLE public.company_subscriptions
      ADD CONSTRAINT company_subscriptions_status_check CHECK (
        status IN ('active', 'past_due', 'suspended', 'canceled')
      )
    `);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE public.company_subscriptions
      DROP CONSTRAINT IF EXISTS company_subscriptions_status_check
    `);
    await queryRunner.query(`
      ALTER TABLE public.company_subscriptions
      ADD COLUMN trial_starts_at timestamptz,
      ADD COLUMN trial_ends_at timestamptz
    `);
    await queryRunner.query(`
      ALTER TABLE public.company_subscriptions
      ADD CONSTRAINT company_subscriptions_trial_dates CHECK (
        trial_starts_at IS NULL OR trial_ends_at IS NULL OR trial_ends_at > trial_starts_at
      )
    `);
    await queryRunner.query(`
      ALTER TABLE public.company_subscriptions
      ADD CONSTRAINT company_subscriptions_status_check CHECK (
        status IN ('trialing', 'active', 'past_due', 'suspended', 'canceled')
      )
    `);
  }
}
