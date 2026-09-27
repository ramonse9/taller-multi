import { MigrationInterface, QueryRunner } from 'typeorm';

export class TenantLoginIdentities1700000002000 implements MigrationInterface {
  name = 'TenantLoginIdentities1700000002000';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('ALTER TABLE public.companies ADD COLUMN login_code varchar(40)');
    await queryRunner.query(`
      UPDATE public.companies
      SET login_code = left(
        COALESCE(
          NULLIF(trim(both '_' from regexp_replace(lower(name), '[^a-z0-9]+', '_', 'g')), ''),
          'company'
        ),
        30
      ) || '_' || left(replace(id::text, '-', ''), 6)
    `);
    await queryRunner.query('ALTER TABLE public.companies ALTER COLUMN login_code SET NOT NULL');
    await queryRunner.query(
      'ALTER TABLE public.companies ADD CONSTRAINT companies_login_code_key UNIQUE (login_code)',
    );
    await queryRunner.query(`
      ALTER TABLE public.companies
      ADD CONSTRAINT companies_login_code_format
      CHECK (login_code ~ '^[a-z][a-z0-9_]{1,39}$')
    `);

    await queryRunner.query('ALTER TABLE public.users ALTER COLUMN email DROP NOT NULL');
    await queryRunner.query('ALTER TABLE public.users ADD COLUMN username citext');
    await queryRunner.query('ALTER TABLE public.users ADD COLUMN phone varchar(16)');
    await queryRunner.query(`
      WITH candidates AS (
        SELECT
          id,
          company_id,
          COALESCE(
            NULLIF(regexp_replace(lower(split_part(email::text, '@', 1)), '[^a-z0-9._-]+', '', 'g'), ''),
            'user'
          ) AS base_username
        FROM public.users
        WHERE role <> 'platform_admin'
      ), ranked AS (
        SELECT
          id,
          base_username,
          row_number() OVER (PARTITION BY company_id, base_username ORDER BY id) AS occurrence
        FROM candidates
      )
      UPDATE public.users u
      SET username = left(r.base_username, 24) ||
        CASE WHEN r.occurrence = 1 THEN '' ELSE '_' || r.occurrence::text END
      FROM ranked r
      WHERE u.id = r.id
    `);
    await queryRunner.query(`
      ALTER TABLE public.users
      ADD CONSTRAINT users_tenant_username_required CHECK (
        (role = 'platform_admin' AND username IS NULL) OR
        (role <> 'platform_admin' AND username IS NOT NULL)
      )
    `);
    await queryRunner.query(`
      ALTER TABLE public.users
      ADD CONSTRAINT users_platform_email_required CHECK (
        role <> 'platform_admin' OR email IS NOT NULL
      )
    `);
    await queryRunner.query(`
      ALTER TABLE public.users
      ADD CONSTRAINT users_username_format CHECK (
        username IS NULL OR username::text ~ '^[a-z][a-z0-9._-]{1,29}$'
      )
    `);
    await queryRunner.query(`
      ALTER TABLE public.users
      ADD CONSTRAINT users_phone_format CHECK (
        phone IS NULL OR phone ~ '^\\+[1-9][0-9]{7,14}$'
      )
    `);
    await queryRunner.query(
      'CREATE UNIQUE INDEX users_company_username_uq ON public.users(company_id, username)',
    );
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP INDEX IF EXISTS public.users_company_username_uq');
    await queryRunner.query(
      'ALTER TABLE public.users DROP CONSTRAINT IF EXISTS users_phone_format',
    );
    await queryRunner.query(
      'ALTER TABLE public.users DROP CONSTRAINT IF EXISTS users_username_format',
    );
    await queryRunner.query(
      'ALTER TABLE public.users DROP CONSTRAINT IF EXISTS users_platform_email_required',
    );
    await queryRunner.query(
      'ALTER TABLE public.users DROP CONSTRAINT IF EXISTS users_tenant_username_required',
    );
    await queryRunner.query('ALTER TABLE public.users DROP COLUMN IF EXISTS phone');
    await queryRunner.query('ALTER TABLE public.users DROP COLUMN IF EXISTS username');
    await queryRunner.query('ALTER TABLE public.users ALTER COLUMN email SET NOT NULL');
    await queryRunner.query(
      'ALTER TABLE public.companies DROP CONSTRAINT IF EXISTS companies_login_code_format',
    );
    await queryRunner.query(
      'ALTER TABLE public.companies DROP CONSTRAINT IF EXISTS companies_login_code_key',
    );
    await queryRunner.query('ALTER TABLE public.companies DROP COLUMN IF EXISTS login_code');
  }
}
