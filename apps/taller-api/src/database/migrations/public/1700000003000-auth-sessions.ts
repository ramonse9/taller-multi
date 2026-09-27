import { MigrationInterface, QueryRunner } from 'typeorm';

export class AuthSessions1700000003000 implements MigrationInterface {
  name = 'AuthSessions1700000003000';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE public.auth_sessions (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
        last_used_at timestamptz NOT NULL DEFAULT now(),
        created_at timestamptz NOT NULL DEFAULT now(),
        revoked_at timestamptz,
        user_agent varchar(500),
        ip_address inet
      )
    `);
    await queryRunner.query(
      'CREATE INDEX auth_sessions_user_id_idx ON public.auth_sessions(user_id)',
    );
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP TABLE IF EXISTS public.auth_sessions');
  }
}
