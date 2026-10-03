import { MigrationInterface, QueryRunner } from 'typeorm';

export class UserPermissions1700000023000 implements MigrationInterface {
  name = 'UserPermissions1700000023000';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE public.permissions (
        code varchar(80) PRIMARY KEY,
        module varchar(40) NOT NULL,
        action varchar(40) NOT NULL,
        name varchar(120) NOT NULL,
        description varchar(300) NOT NULL,
        sort_order smallint NOT NULL UNIQUE CHECK (sort_order > 0),
        UNIQUE(module, action)
      )
    `);
    await queryRunner.query(`
      CREATE TABLE public.permission_templates (
        code varchar(40) PRIMARY KEY,
        name varchar(80) NOT NULL UNIQUE,
        description varchar(300) NOT NULL,
        sort_order smallint NOT NULL UNIQUE CHECK (sort_order > 0),
        is_active boolean NOT NULL DEFAULT true
      )
    `);
    await queryRunner.query(`
      CREATE TABLE public.permission_template_permissions (
        template_code varchar(40) NOT NULL
          REFERENCES public.permission_templates(code) ON DELETE CASCADE,
        permission_code varchar(80) NOT NULL
          REFERENCES public.permissions(code) ON DELETE CASCADE,
        PRIMARY KEY(template_code, permission_code)
      )
    `);
    await queryRunner.query(`
      CREATE TABLE public.user_permission_profiles (
        user_id uuid PRIMARY KEY REFERENCES public.users(id) ON DELETE CASCADE,
        template_code varchar(40) REFERENCES public.permission_templates(code) ON DELETE SET NULL,
        is_customized boolean NOT NULL DEFAULT false,
        updated_by_user_id uuid REFERENCES public.users(id) ON DELETE SET NULL,
        created_at timestamptz NOT NULL DEFAULT now(),
        updated_at timestamptz NOT NULL DEFAULT now()
      )
    `);
    await queryRunner.query(`
      CREATE TABLE public.user_permissions (
        user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
        permission_code varchar(80) NOT NULL
          REFERENCES public.permissions(code) ON DELETE CASCADE,
        granted_by_user_id uuid REFERENCES public.users(id) ON DELETE SET NULL,
        granted_at timestamptz NOT NULL DEFAULT now(),
        PRIMARY KEY(user_id, permission_code)
      )
    `);
    await queryRunner.query(
      'CREATE INDEX user_permissions_permission_idx ON public.user_permissions(permission_code, user_id)',
    );

    await queryRunner.query(`
      INSERT INTO public.permissions(code, module, action, name, description, sort_order) VALUES
        ('dashboard.view', 'dashboard', 'view', 'Consultar tablero', 'Consultar indicadores, actividad y alertas.', 1),
        ('clients.view', 'clients', 'view', 'Consultar clientes', 'Consultar clientes, empresas y su historial.', 2),
        ('clients.create', 'clients', 'create', 'Registrar clientes', 'Registrar clientes y empresas.', 3),
        ('clients.edit', 'clients', 'edit', 'Editar clientes', 'Actualizar clientes y empresas.', 4),
        ('clients.deactivate', 'clients', 'deactivate', 'Desactivar clientes', 'Desactivar clientes y empresas.', 5),
        ('vehicles.view', 'vehicles', 'view', 'Consultar vehículos', 'Consultar vehículos e historial.', 6),
        ('vehicles.create', 'vehicles', 'create', 'Registrar vehículos', 'Registrar vehículos para los clientes.', 7),
        ('vehicles.edit', 'vehicles', 'edit', 'Editar vehículos', 'Actualizar datos de vehículos.', 8),
        ('vehicles.deactivate', 'vehicles', 'deactivate', 'Desactivar vehículos', 'Desactivar vehículos.', 9),
        ('orders.view', 'orders', 'view', 'Consultar órdenes', 'Consultar órdenes, conceptos e historial.', 10),
        ('orders.create', 'orders', 'create', 'Crear órdenes', 'Registrar órdenes de servicio.', 11),
        ('orders.edit', 'orders', 'edit', 'Editar órdenes', 'Modificar órdenes editables.', 12),
        ('orders.change_status', 'orders', 'change_status', 'Cambiar estado de órdenes', 'Terminar, reabrir o cancelar órdenes.', 13),
        ('orders.manage_payment', 'orders', 'manage_payment', 'Administrar estado de cobro', 'Marcar órdenes como pagadas o pendientes.', 14),
        ('orders.add_notes', 'orders', 'add_notes', 'Agregar seguimiento', 'Agregar notas internas a las órdenes.', 15),
        ('catalog.view', 'catalog', 'view', 'Consultar productos y servicios', 'Consultar el catálogo interno.', 16),
        ('catalog.manage', 'catalog', 'manage', 'Administrar productos y servicios', 'Crear, editar y desactivar conceptos y unidades.', 17),
        ('catalog.view_costs', 'catalog', 'view_costs', 'Consultar costos', 'Consultar costos de productos y servicios.', 18),
        ('inventory.view', 'inventory', 'view', 'Consultar inventario', 'Consultar existencias, lotes y movimientos.', 19),
        ('inventory.move', 'inventory', 'move', 'Registrar movimientos', 'Registrar entradas y salidas de inventario.', 20),
        ('inventory.adjust', 'inventory', 'adjust', 'Ajustar inventario', 'Registrar ajustes positivos o negativos.', 21),
        ('suppliers.view', 'suppliers', 'view', 'Consultar proveedores', 'Consultar el catálogo de proveedores.', 22),
        ('suppliers.manage', 'suppliers', 'manage', 'Administrar proveedores', 'Crear, editar y desactivar proveedores.', 23),
        ('purchases.view', 'purchases', 'view', 'Consultar compras', 'Consultar compras y lotes generados.', 24),
        ('purchases.create', 'purchases', 'create', 'Registrar compras', 'Crear y editar compras en borrador.', 25),
        ('purchases.confirm', 'purchases', 'confirm', 'Confirmar compras', 'Confirmar compras y generar inventario.', 26),
        ('purchases.cancel', 'purchases', 'cancel', 'Cancelar compras', 'Cancelar o revertir compras.', 27),
        ('expenses.view', 'expenses', 'view', 'Consultar gastos', 'Consultar gastos y resúmenes.', 28),
        ('expenses.create', 'expenses', 'create', 'Registrar gastos', 'Crear y editar gastos en borrador.', 29),
        ('expenses.confirm', 'expenses', 'confirm', 'Confirmar gastos', 'Confirmar gastos operativos.', 30),
        ('expenses.cancel', 'expenses', 'cancel', 'Cancelar gastos', 'Cancelar gastos.', 31),
        ('profitability.view', 'profitability', 'view', 'Consultar utilidad', 'Consultar ingresos, costos, gastos y utilidad.', 32),
        ('vehicle_catalog.view', 'vehicle_catalog', 'view', 'Consultar marcas y modelos', 'Consultar marcas y modelos globales.', 33),
        ('vehicle_catalog.manage', 'vehicle_catalog', 'manage', 'Administrar marcas y modelos', 'Crear, editar y desactivar marcas y modelos globales.', 34),
        ('users.view', 'users', 'view', 'Consultar usuarios', 'Consultar usuarios de la compañía.', 35),
        ('users.manage', 'users', 'manage', 'Administrar usuarios', 'Crear, editar, activar y restablecer usuarios permitidos por la jerarquía.', 36),
        ('permissions.manage', 'permissions', 'manage', 'Administrar permisos', 'Aplicar plantillas y personalizar permisos de usuarios permitidos.', 37)
    `);
    await queryRunner.query(`
      INSERT INTO public.permission_templates(code, name, description, sort_order) VALUES
        ('reception', 'Recepción', 'Clientes, vehículos y recepción de órdenes.', 1),
        ('mechanic', 'Mecánico', 'Consulta de órdenes, seguimiento técnico y existencias.', 2),
        ('warehouse', 'Almacén', 'Catálogo, proveedores, compras e inventario.', 3),
        ('administration', 'Administración', 'Operación completa, pagos, gastos y utilidad.', 4)
    `);
    await queryRunner.query(`
      INSERT INTO public.permission_template_permissions(template_code, permission_code)
      SELECT 'reception', code FROM public.permissions WHERE code IN (
        'dashboard.view', 'clients.view', 'clients.create', 'clients.edit',
        'vehicles.view', 'vehicles.create', 'vehicles.edit', 'orders.view',
        'orders.create', 'orders.edit', 'orders.change_status', 'orders.add_notes',
        'vehicle_catalog.view'
      )
    `);
    await queryRunner.query(`
      INSERT INTO public.permission_template_permissions(template_code, permission_code)
      SELECT 'mechanic', code FROM public.permissions WHERE code IN (
        'dashboard.view', 'clients.view', 'vehicles.view', 'orders.view',
        'orders.change_status', 'orders.add_notes', 'catalog.view',
        'inventory.view', 'vehicle_catalog.view'
      )
    `);
    await queryRunner.query(`
      INSERT INTO public.permission_template_permissions(template_code, permission_code)
      SELECT 'warehouse', code FROM public.permissions WHERE code IN (
        'dashboard.view', 'catalog.view', 'catalog.manage', 'catalog.view_costs',
        'inventory.view', 'inventory.move', 'inventory.adjust', 'suppliers.view',
        'suppliers.manage', 'purchases.view', 'purchases.create',
        'purchases.confirm', 'purchases.cancel'
      )
    `);
    await queryRunner.query(`
      INSERT INTO public.permission_template_permissions(template_code, permission_code)
      SELECT 'administration', code FROM public.permissions
      WHERE module NOT IN ('users', 'permissions') AND code <> 'vehicle_catalog.manage'
    `);

    await queryRunner.query(`
      INSERT INTO public.user_permission_profiles(user_id, template_code, is_customized)
      SELECT id, 'administration', role = 'admin'
      FROM public.users WHERE role IN ('admin', 'user')
    `);
    await queryRunner.query(`
      INSERT INTO public.user_permissions(user_id, permission_code)
      SELECT profile.user_id, template_permission.permission_code
      FROM public.user_permission_profiles profile
      JOIN public.permission_template_permissions template_permission
        ON template_permission.template_code = profile.template_code
    `);
    await queryRunner.query(`
      INSERT INTO public.user_permissions(user_id, permission_code)
      SELECT id, permission.code
      FROM public.users
      CROSS JOIN public.permissions permission
      WHERE role = 'admin'
        AND permission.code IN ('users.view', 'users.manage', 'permissions.manage')
      ON CONFLICT DO NOTHING
    `);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP TABLE IF EXISTS public.user_permissions');
    await queryRunner.query('DROP TABLE IF EXISTS public.user_permission_profiles');
    await queryRunner.query('DROP TABLE IF EXISTS public.permission_template_permissions');
    await queryRunner.query('DROP TABLE IF EXISTS public.permission_templates');
    await queryRunner.query('DROP TABLE IF EXISTS public.permissions');
  }
}
