import { MigrationInterface, QueryRunner } from 'typeorm';

export class AdministrativePasswordResets1700000027000 implements MigrationInterface {
  name = 'AdministrativePasswordResets1700000027000';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE public.password_reset_events (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE RESTRICT,
        target_user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE RESTRICT,
        reset_by_user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE RESTRICT,
        reset_by_role varchar(30) NOT NULL,
        target_role varchar(30) NOT NULL,
        source varchar(30) NOT NULL CHECK (source IN ('tenant_admin', 'platform_admin')),
        created_at timestamptz NOT NULL DEFAULT now()
      )
    `);
    await queryRunner.query(`
      CREATE INDEX password_reset_events_company_created_idx
      ON public.password_reset_events(company_id, created_at DESC)
    `);
    await queryRunner.query(`
      CREATE INDEX password_reset_events_target_created_idx
      ON public.password_reset_events(target_user_id, created_at DESC)
    `);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP TABLE IF EXISTS public.password_reset_events');
  }
}
