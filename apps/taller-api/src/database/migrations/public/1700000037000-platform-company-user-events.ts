import { MigrationInterface, QueryRunner } from 'typeorm';

export class PlatformCompanyUserEvents1700000037000 implements MigrationInterface {
  name = 'PlatformCompanyUserEvents1700000037000';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE public.platform_company_user_events (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE RESTRICT,
        target_user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE RESTRICT,
        actor_user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE RESTRICT,
        event_type varchar(40) NOT NULL CHECK (event_type IN ('user_created')),
        target_role varchar(30) NOT NULL,
        template_code varchar(40),
        permission_codes varchar(80)[] NOT NULL DEFAULT '{}',
        created_at timestamptz NOT NULL DEFAULT now()
      )
    `);
    await queryRunner.query(`
      CREATE INDEX platform_company_user_events_company_created_idx
      ON public.platform_company_user_events(company_id, created_at DESC)
    `);
    await queryRunner.query(`
      CREATE INDEX platform_company_user_events_target_created_idx
      ON public.platform_company_user_events(target_user_id, created_at DESC)
    `);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP TABLE IF EXISTS public.platform_company_user_events');
  }
}
