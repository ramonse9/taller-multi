import { MigrationInterface, QueryRunner } from 'typeorm';

export class GeneratedSchemasAndTemporaryPasswords1700000001000 implements MigrationInterface {
  name = 'GeneratedSchemasAndTemporaryPasswords1700000001000';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      'CREATE SEQUENCE IF NOT EXISTS public.tenant_schema_number_seq AS bigint START 1',
    );
    await queryRunner.query(`
      SELECT setval(
        'public.tenant_schema_number_seq',
        GREATEST((SELECT count(*) + 1 FROM public.companies), 1),
        false
      )
    `);
    await queryRunner.query(
      'ALTER TABLE public.companies ALTER COLUMN schema_name TYPE varchar(63)',
    );
    await queryRunner.query(
      'ALTER TABLE public.companies DROP CONSTRAINT IF EXISTS companies_schema_name_format',
    );
    await queryRunner.query(`
      ALTER TABLE public.companies
      ADD CONSTRAINT companies_schema_name_format
      CHECK (schema_name ~ '^[a-z_][a-z0-9_]{2,62}$')
    `);
    await queryRunner.query(`
      ALTER TABLE public.users
      ADD COLUMN IF NOT EXISTS must_change_password boolean NOT NULL DEFAULT false
    `);
    await queryRunner.query(`
      UPDATE public.company_types
      SET name = name || ' (anterior)', is_active = false
      WHERE code IN ('workshop', 'multi_service')
        AND name NOT LIKE '% (anterior)'
    `);
    await queryRunner.query(`
      INSERT INTO public.company_types(code, name, is_active) VALUES
        ('mul', 'Multiservicios', true),
        ('car', 'Carrocería', true),
        ('mec', 'Mecánica automotriz', true)
      ON CONFLICT (code) DO UPDATE SET name = EXCLUDED.name, is_active = true
    `);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      "DELETE FROM public.company_types WHERE code IN ('mul', 'car', 'mec') AND NOT EXISTS (SELECT 1 FROM public.companies WHERE company_type_code = public.company_types.code)",
    );
    await queryRunner.query(
      "UPDATE public.company_types SET is_active = true WHERE code IN ('workshop', 'multi_service')",
    );
    await queryRunner.query('ALTER TABLE public.users DROP COLUMN IF EXISTS must_change_password');
    await queryRunner.query('DROP SEQUENCE IF EXISTS public.tenant_schema_number_seq');
  }
}
