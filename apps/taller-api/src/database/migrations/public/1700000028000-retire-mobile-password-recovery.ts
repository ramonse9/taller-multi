import { MigrationInterface, QueryRunner } from 'typeorm';

export class RetireMobilePasswordRecovery1700000028000 implements MigrationInterface {
  name = 'RetireMobilePasswordRecovery1700000028000';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP TABLE IF EXISTS public.password_recovery_challenges');
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE public.password_recovery_challenges (
        id uuid PRIMARY KEY,
        user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
        channel varchar(10) NOT NULL CHECK (channel IN ('sms', 'whatsapp')),
        phone varchar(16) NOT NULL,
        code_hash char(64) NOT NULL,
        expires_at timestamptz NOT NULL,
        failed_attempts smallint NOT NULL DEFAULT 0 CHECK (failed_attempts BETWEEN 0 AND 5),
        send_count smallint NOT NULL DEFAULT 1 CHECK (send_count BETWEEN 1 AND 3),
        send_window_started_at timestamptz NOT NULL DEFAULT now(),
        last_sent_at timestamptz NOT NULL DEFAULT now(),
        verified_at timestamptz,
        reset_token_hash char(64),
        reset_token_expires_at timestamptz,
        consumed_at timestamptz,
        created_at timestamptz NOT NULL DEFAULT now()
      )
    `);
    await queryRunner.query(`
      CREATE INDEX password_recovery_user_created_idx
      ON public.password_recovery_challenges(user_id, created_at DESC)
    `);
    await queryRunner.query(`
      CREATE UNIQUE INDEX password_recovery_reset_token_uq
      ON public.password_recovery_challenges(reset_token_hash)
      WHERE reset_token_hash IS NOT NULL
    `);
  }
}
