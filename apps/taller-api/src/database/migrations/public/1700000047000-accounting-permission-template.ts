import { MigrationInterface, QueryRunner } from 'typeorm';

export class AccountingPermissionTemplate1700000047000 implements MigrationInterface {
  name = 'AccountingPermissionTemplate1700000047000';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      INSERT INTO public.permissions(code, module, action, name, description, sort_order)
      VALUES (
        'clients.edit_fiscal', 'clients', 'edit_fiscal', 'Editar datos fiscales',
        'Actualizar exclusivamente RFC, nombre fiscal, código postal fiscal, régimen fiscal y Uso CFDI preferido.',
        47
      )
    `);
    await queryRunner.query(`
      INSERT INTO public.permission_templates(code, name, description, sort_order)
      VALUES (
        'accounting', 'Contabilidad',
        'Consulta de órdenes y preparación de facturación simulada sin permisos operativos del taller.',
        5
      )
    `);
    await queryRunner.query(`
      INSERT INTO public.permission_template_permissions(template_code, permission_code)
      SELECT 'accounting', code FROM public.permissions WHERE code IN (
        'orders.view', 'clients.view', 'clients.edit_fiscal',
        'invoices.view', 'invoices.create', 'invoices.edit',
        'invoices.simulate_issue', 'invoices.cancel_simulation'
      )
    `);
    await queryRunner.query(`
      INSERT INTO public.permission_template_permissions(template_code, permission_code)
      VALUES ('administration', 'clients.edit_fiscal')
    `);
    await queryRunner.query(`
      INSERT INTO public.user_permissions(user_id, permission_code, granted_by_user_id)
      SELECT profile.user_id, 'clients.edit_fiscal', profile.updated_by_user_id
      FROM public.user_permission_profiles profile
      WHERE profile.template_code='administration' AND profile.is_customized=false
      ON CONFLICT DO NOTHING
    `);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DELETE FROM public.permission_templates WHERE code='accounting'`);
    await queryRunner.query(`DELETE FROM public.permissions WHERE code='clients.edit_fiscal'`);
  }
}
