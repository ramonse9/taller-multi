import { MigrationInterface, QueryRunner } from 'typeorm';

export class RefreshTokenSessions1700000034000 implements MigrationInterface {
  name = 'RefreshTokenSessions1700000034000';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE public.auth_refresh_tokens (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        session_id uuid NOT NULL
          REFERENCES public.auth_sessions(id) ON DELETE CASCADE,
        token_hash varchar(128) NOT NULL UNIQUE,
        generation integer NOT NULL CHECK (generation > 0),
        issued_at timestamptz NOT NULL DEFAULT now(),
        expires_at timestamptz NOT NULL,
        consumed_at timestamptz,
        revoked_at timestamptz,
        replaced_by_token_id uuid,
        CONSTRAINT auth_refresh_tokens_session_generation_key
          UNIQUE (session_id, generation),
        CONSTRAINT auth_refresh_tokens_replacement_fk
          FOREIGN KEY (replaced_by_token_id)
          REFERENCES public.auth_refresh_tokens(id) ON DELETE SET NULL,
        CONSTRAINT auth_refresh_tokens_expiration_check
          CHECK (expires_at > issued_at)
      )
    `);
    await queryRunner.query(`
      CREATE INDEX auth_refresh_tokens_session_id_idx
      ON public.auth_refresh_tokens(session_id)
    `);
    await queryRunner.query(`
      CREATE INDEX auth_refresh_tokens_active_expiration_idx
      ON public.auth_refresh_tokens(expires_at)
      WHERE consumed_at IS NULL AND revoked_at IS NULL
    `);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP TABLE IF EXISTS public.auth_refresh_tokens');
  }
}
