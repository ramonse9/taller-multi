import { MigrationInterface, QueryRunner } from 'typeorm';

export class SensitiveActionPermissions1700000024000 implements MigrationInterface {
  name = 'SensitiveActionPermissions1700000024000';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      INSERT INTO public.permissions(code, module, action, name, description, sort_order) VALUES
        ('orders.cancel', 'orders', 'cancel', 'Cancelar órdenes', 'Cancelar órdenes de servicio.', 38),
        ('purchases.edit', 'purchases', 'edit', 'Editar compras', 'Modificar compras en borrador.', 39),
        ('expenses.edit', 'expenses', 'edit', 'Editar gastos', 'Modificar gastos en borrador.', 40)
    `);
    await queryRunner.query(`
      INSERT INTO public.permission_template_permissions(template_code, permission_code) VALUES
        ('administration', 'orders.cancel'),
        ('administration', 'purchases.edit'),
        ('administration', 'expenses.edit'),
        ('warehouse', 'purchases.edit')
    `);
    await queryRunner.query(`
      INSERT INTO public.user_permissions(user_id, permission_code)
      SELECT profile.user_id, permission.code
      FROM public.user_permission_profiles profile
      JOIN public.users user_account ON user_account.id = profile.user_id
      CROSS JOIN public.permissions permission
      WHERE permission.code IN ('orders.cancel', 'purchases.edit', 'expenses.edit')
        AND (
          (profile.template_code = 'administration' AND profile.is_customized = false)
          OR user_account.role = 'admin'
        )
      ON CONFLICT DO NOTHING
    `);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DELETE FROM public.permissions
      WHERE code IN ('orders.cancel', 'purchases.edit', 'expenses.edit')
    `);
  }
}
