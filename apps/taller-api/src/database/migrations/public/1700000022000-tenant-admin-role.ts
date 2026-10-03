import { MigrationInterface, QueryRunner } from 'typeorm';

export class TenantAdminRole1700000022000 implements MigrationInterface {
  name = 'TenantAdminRole1700000022000';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('ALTER TABLE public.users DROP CONSTRAINT users_role_check');
    await queryRunner.query(`
      ALTER TABLE public.users
      ADD CONSTRAINT users_role_check
      CHECK (role IN ('platform_admin', 'company_admin', 'admin', 'user'))
    `);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query("UPDATE public.users SET role = 'user' WHERE role = 'admin'");
    await queryRunner.query('ALTER TABLE public.users DROP CONSTRAINT users_role_check');
    await queryRunner.query(`
      ALTER TABLE public.users
      ADD CONSTRAINT users_role_check
      CHECK (role IN ('platform_admin', 'company_admin', 'user'))
    `);
  }
}
