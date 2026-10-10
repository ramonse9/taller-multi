import { MigrationInterface, QueryRunner } from 'typeorm';

export class PlatformAdminSecurityEvents1700000035000 implements MigrationInterface {
  name = 'PlatformAdminSecurityEvents1700000035000';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE public.platform_admin_security_events (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        target_user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE RESTRICT,
        event_type varchar(40) NOT NULL CHECK (event_type IN ('password_changed')),
        source varchar(40) NOT NULL CHECK (source IN ('local_admin_command')),
        environment varchar(20) NOT NULL CHECK (environment IN ('local', 'production')),
        created_at timestamptz NOT NULL DEFAULT now()
      )
    `);
    await queryRunner.query(`
      CREATE INDEX platform_admin_security_events_target_created_idx
      ON public.platform_admin_security_events(target_user_id, created_at DESC)
    `);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP TABLE IF EXISTS public.platform_admin_security_events');
  }
}
