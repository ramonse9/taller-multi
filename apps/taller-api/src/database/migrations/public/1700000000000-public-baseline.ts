import { MigrationInterface, QueryRunner } from 'typeorm';

export class PublicBaseline1700000000000 implements MigrationInterface {
  name = 'PublicBaseline1700000000000';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('CREATE EXTENSION IF NOT EXISTS pgcrypto');
    await queryRunner.query('CREATE EXTENSION IF NOT EXISTS citext');
    await queryRunner.query('REVOKE CREATE ON SCHEMA public FROM PUBLIC');
    await queryRunner.query(`
      CREATE TABLE public.company_types (
        code varchar(30) PRIMARY KEY,
        name varchar(100) NOT NULL UNIQUE,
        is_active boolean NOT NULL DEFAULT true
      )
    `);
    await queryRunner.query(`
      CREATE TABLE public.person_types (
        code varchar(20) PRIMARY KEY,
        name varchar(100) NOT NULL UNIQUE,
        is_active boolean NOT NULL DEFAULT true
      )
    `);
    await queryRunner.query(`
      CREATE TABLE public.timezones (
        code varchar(80) PRIMARY KEY,
        description varchar(150) NOT NULL,
        is_active boolean NOT NULL DEFAULT true
      )
    `);
    await queryRunner.query(`
      CREATE TABLE public.companies (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        name varchar(150) NOT NULL UNIQUE,
        schema_name varchar(50) NOT NULL UNIQUE,
        company_type_code varchar(30) NOT NULL REFERENCES public.company_types(code),
        person_type_code varchar(20) NOT NULL REFERENCES public.person_types(code),
        is_active boolean NOT NULL DEFAULT true,
        withholds_isr boolean NOT NULL DEFAULT false,
        withholds_iva boolean NOT NULL DEFAULT false,
        created_at timestamptz NOT NULL DEFAULT now(),
        updated_at timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT companies_schema_name_format CHECK (schema_name ~ '^[a-z][a-z0-9_]{2,49}$'),
        CONSTRAINT companies_schema_name_reserved CHECK (schema_name <> 'public' AND schema_name <> 'information_schema' AND schema_name !~ '^pg_')
      )
    `);
    await queryRunner.query(`
      CREATE TABLE public.users (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        email citext NOT NULL UNIQUE,
        password_hash text NOT NULL,
        full_name varchar(150) NOT NULL,
        role varchar(30) NOT NULL CHECK (role IN ('platform_admin', 'company_admin', 'user')),
        company_id uuid REFERENCES public.companies(id) ON DELETE RESTRICT,
        timezone_code varchar(80) NOT NULL DEFAULT 'America/Mazatlan' REFERENCES public.timezones(code),
        is_active boolean NOT NULL DEFAULT true,
        failed_login_attempts smallint NOT NULL DEFAULT 0 CHECK (failed_login_attempts >= 0),
        locked_until timestamptz,
        created_at timestamptz NOT NULL DEFAULT now(),
        updated_at timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT users_company_membership CHECK (
          (role = 'platform_admin' AND company_id IS NULL) OR
          (role <> 'platform_admin' AND company_id IS NOT NULL)
        )
      )
    `);
    await queryRunner.query('CREATE INDEX users_company_id_idx ON public.users(company_id)');
    await queryRunner.query(`
      CREATE TABLE public.tenant_schema_versions (
        company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
        version integer NOT NULL CHECK (version > 0),
        migration_name varchar(150) NOT NULL,
        applied_at timestamptz NOT NULL DEFAULT now(),
        PRIMARY KEY (company_id, version)
      )
    `);
    await queryRunner.query(`
      CREATE TABLE public.vehicle_brands (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        name varchar(100) NOT NULL UNIQUE,
        is_active boolean NOT NULL DEFAULT true
      )
    `);
    await queryRunner.query(`
      CREATE TABLE public.vehicle_models (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        brand_id uuid NOT NULL REFERENCES public.vehicle_brands(id) ON DELETE RESTRICT,
        name varchar(100) NOT NULL,
        is_active boolean NOT NULL DEFAULT true,
        UNIQUE (brand_id, name)
      )
    `);
    await queryRunner.query(`
      INSERT INTO public.company_types(code, name) VALUES
        ('workshop', 'Taller automotriz'), ('multi_service', 'Multiservicios')
    `);
    await queryRunner.query(`
      INSERT INTO public.person_types(code, name) VALUES
        ('individual', 'Persona física'), ('legal_entity', 'Persona moral')
    `);
    await queryRunner.query(`
      INSERT INTO public.timezones(code, description) VALUES
        ('America/Mazatlan', 'Hora estándar de la montaña'),
        ('America/Mexico_City', 'Hora del centro de México'),
        ('America/Tijuana', 'Hora del Pacífico')
    `);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP TABLE IF EXISTS public.vehicle_models');
    await queryRunner.query('DROP TABLE IF EXISTS public.vehicle_brands');
    await queryRunner.query('DROP TABLE IF EXISTS public.tenant_schema_versions');
    await queryRunner.query('DROP TABLE IF EXISTS public.users');
    await queryRunner.query('DROP TABLE IF EXISTS public.companies');
    await queryRunner.query('DROP TABLE IF EXISTS public.timezones');
    await queryRunner.query('DROP TABLE IF EXISTS public.person_types');
    await queryRunner.query('DROP TABLE IF EXISTS public.company_types');
  }
}
