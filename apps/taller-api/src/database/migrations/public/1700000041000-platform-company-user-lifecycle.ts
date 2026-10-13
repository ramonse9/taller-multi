import { MigrationInterface, QueryRunner } from 'typeorm';

export class PlatformCompanyUserLifecycle1700000041000 implements MigrationInterface {
  name = 'PlatformCompanyUserLifecycle1700000041000';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE public.platform_company_user_events
        DROP CONSTRAINT IF EXISTS platform_company_user_events_event_type_check
    `);
    await queryRunner.query(`
      ALTER TABLE public.platform_company_user_events
        ADD CONSTRAINT platform_company_user_events_event_type_check
        CHECK (event_type IN (
          'user_created', 'user_updated', 'user_deactivated', 'user_reactivated'
        )),
        ADD COLUMN previous_role varchar(30),
        ADD COLUMN previous_is_active boolean,
        ADD COLUMN current_is_active boolean,
        ADD COLUMN previous_template_code varchar(40),
        ADD COLUMN previous_permission_codes varchar(80)[] NOT NULL DEFAULT '{}',
        ADD COLUMN changes jsonb NOT NULL DEFAULT '{}'::jsonb
    `);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DELETE FROM public.platform_company_user_events
      WHERE event_type <> 'user_created'
    `);
    await queryRunner.query(`
      ALTER TABLE public.platform_company_user_events
        DROP CONSTRAINT IF EXISTS platform_company_user_events_event_type_check,
        DROP COLUMN IF EXISTS changes,
        DROP COLUMN IF EXISTS previous_permission_codes,
        DROP COLUMN IF EXISTS previous_template_code,
        DROP COLUMN IF EXISTS current_is_active,
        DROP COLUMN IF EXISTS previous_is_active,
        DROP COLUMN IF EXISTS previous_role
    `);
    await queryRunner.query(`
      ALTER TABLE public.platform_company_user_events
        ADD CONSTRAINT platform_company_user_events_event_type_check
        CHECK (event_type IN ('user_created'))
    `);
  }
}
