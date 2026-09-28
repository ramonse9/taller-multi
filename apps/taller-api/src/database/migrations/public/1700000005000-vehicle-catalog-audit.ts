import { MigrationInterface, QueryRunner } from 'typeorm';

export class VehicleCatalogAudit1700000005000 implements MigrationInterface {
  name = 'VehicleCatalogAudit1700000005000';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      'ALTER TABLE public.vehicle_brands ALTER COLUMN name TYPE citext USING name::citext',
    );
    await queryRunner.query(`
      ALTER TABLE public.vehicle_brands
      ADD CONSTRAINT vehicle_brands_name_length
      CHECK (char_length(trim(name::text)) BETWEEN 2 AND 100)
    `);
    await queryRunner.query(`
      ALTER TABLE public.vehicle_brands
      ADD COLUMN created_by_user_id uuid REFERENCES public.users(id) ON DELETE RESTRICT,
      ADD COLUMN updated_by_user_id uuid REFERENCES public.users(id) ON DELETE RESTRICT,
      ADD COLUMN created_at timestamptz NOT NULL DEFAULT now(),
      ADD COLUMN updated_at timestamptz NOT NULL DEFAULT now()
    `);
    await queryRunner.query(
      'ALTER TABLE public.vehicle_models ALTER COLUMN name TYPE citext USING name::citext',
    );
    await queryRunner.query(`
      ALTER TABLE public.vehicle_models
      ADD CONSTRAINT vehicle_models_name_length
      CHECK (char_length(trim(name::text)) BETWEEN 1 AND 100)
    `);
    await queryRunner.query(`
      ALTER TABLE public.vehicle_models
      ADD COLUMN created_by_user_id uuid REFERENCES public.users(id) ON DELETE RESTRICT,
      ADD COLUMN updated_by_user_id uuid REFERENCES public.users(id) ON DELETE RESTRICT,
      ADD COLUMN created_at timestamptz NOT NULL DEFAULT now(),
      ADD COLUMN updated_at timestamptz NOT NULL DEFAULT now()
    `);
    await queryRunner.query(
      'CREATE INDEX vehicle_models_brand_active_name_idx ON public.vehicle_models(brand_id, is_active, name)',
    );
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP INDEX IF EXISTS public.vehicle_models_brand_active_name_idx');
    await queryRunner.query(
      'ALTER TABLE public.vehicle_models DROP CONSTRAINT IF EXISTS vehicle_models_name_length',
    );
    await queryRunner.query(`
      ALTER TABLE public.vehicle_models
      DROP COLUMN IF EXISTS updated_at,
      DROP COLUMN IF EXISTS created_at,
      DROP COLUMN IF EXISTS updated_by_user_id,
      DROP COLUMN IF EXISTS created_by_user_id
    `);
    await queryRunner.query(
      'ALTER TABLE public.vehicle_models ALTER COLUMN name TYPE varchar(100) USING name::text',
    );
    await queryRunner.query(`
      ALTER TABLE public.vehicle_brands
      DROP COLUMN IF EXISTS updated_at,
      DROP COLUMN IF EXISTS created_at,
      DROP COLUMN IF EXISTS updated_by_user_id,
      DROP COLUMN IF EXISTS created_by_user_id
    `);
    await queryRunner.query(
      'ALTER TABLE public.vehicle_brands DROP CONSTRAINT IF EXISTS vehicle_brands_name_length',
    );
    await queryRunner.query(
      'ALTER TABLE public.vehicle_brands ALTER COLUMN name TYPE varchar(100) USING name::text',
    );
  }
}
