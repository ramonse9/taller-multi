import { EnumMenuOption, EnumRole } from "@shared/enums/general-estatus.enum";
import { MenuItem } from "@shared/interfaces/menu-item.interface";

export const menuLateral: MenuItem[] = [
   {
    label: 'Inicio',
    icon: 'tablerHome',
    menuOption: EnumMenuOption.INICIO,
    minRole: EnumRole.CAPTURISTA,
    children: [
      { label: 'Accesos Rápidos', path: '/inicio/accesos', minRole: EnumRole.CAPTURISTA}
    ]
  },
  {
    label: 'Dashboard',
    icon: 'tablerChartBarPopular',
    menuOption: EnumMenuOption.DASHBOARD,
    minRole: EnumRole.ADMIN,
    children: [
      { label: 'General', path: '/dashboard/general', minRole: EnumRole.ADMIN }
    ]
  },
  {
    label: 'Operaciones',
    icon: 'tablerCategoryPlus',
    menuOption: EnumMenuOption.OPERACIONES,
    minRole: EnumRole.CAPTURISTA,
    children: [
      { label: 'Cotizaciones',   path: '/operaciones/cotizaciones',  minRole: EnumRole.ADMIN },
      { label: 'Órdenes',        path: '/operaciones/ordenes',       minRole: EnumRole.ADMIN },
      { label: 'Órdenes New',    path: '/operaciones/ordenesnew',    minRole: EnumRole.ADMIN },
    ]
  },
  {
    label: 'Inventario',
    icon: 'tablerCalendarDollar',
    menuOption: EnumMenuOption.INVENTARIO,
    minRole: EnumRole.ADMIN,
    moduleKey: 'moduloInventario',
    children: [
      { label: 'Compras',       path: '/inventario/compras',      minRole: EnumRole.ADMIN },
      { label: 'Productos',     path: '/inventario/productos',    minRole: EnumRole.ADMIN },
      { label: 'Movimientos',   path: '/inventario/movimientos',  minRole: EnumRole.ADMIN },
      { label: 'Lotes',         path: '/inventario/lotes',        minRole: EnumRole.ADMIN },
      { label: 'Proveedores',   path: '/inventario/proveedores',  minRole: EnumRole.CAPTURISTA },
    ]
  },
  {
    label: 'Pagos',
    icon: 'tablerCalendarDollar',
    menuOption: EnumMenuOption.PAGOS,
    minRole: EnumRole.ADMIN,
    children: [
      { label: 'Gastos por Mes', path: '/pagos/gastospormes',  minRole: EnumRole.ADMIN, moduleKey: 'moduloGastos', },
      { label: 'Nómina',         path: '/pagos/nomina',        minRole: EnumRole.ADMIN, moduleKey: 'moduloNomina', },
    ]
  },
  {
    label: 'Facturas',
    icon: 'tablerChecklist',
    menuOption: EnumMenuOption.FACTURAS,
    minRole: EnumRole.ADMIN,
    moduleKey: 'moduloFacturacion',
    children: [
      { label: 'Facturas',            path: '/facturas/facturas',  minRole: EnumRole.ADMIN },
      { label: 'Mis Datos Fiscales',  path: '/facturas/misdatos',  minRole: EnumRole.ADMIN },
    ]
  },
  {
    label: 'Catálogos',
    icon: 'tablerLibrary',
    menuOption: EnumMenuOption.CATALOGOS ,
    minRole: EnumRole.CAPTURISTA,
    children: [
      { label: 'Productos y Servicios', path: '/catalogos/productosservicios',  minRole: EnumRole.ADMIN },
      { label: 'Servicios',             path: '/catalogos/servicios',           minRole: EnumRole.ADMIN },
      { label: 'Clientes',              path: '/catalogos/clientes',            minRole: EnumRole.CAPTURISTA  },
      { label: 'Vehículos',             path: '/catalogos/vehiculos',           minRole: EnumRole.CAPTURISTA },
      { label: 'Empresas',              path: '/catalogos/empresas',            minRole: EnumRole.ADMIN },
      //{ label: 'Conceptos de Gastos',   path: '/catalogos/gastosconceptos',     minRole: EnumRole.ADMIN },
      { label: 'Gastos',                path: '/catalogos/gastos',              minRole: EnumRole.ADMIN,        moduleKey: 'moduloGastos' },
      { label: 'Empleados',             path: '/catalogos/empleados',           minRole: EnumRole.ADMIN,        moduleKey: 'moduloNomina' },
      { label: 'Marcas de Autos',       path: '/catalogos/marcas',              minRole: EnumRole.CAPTURISTA },
      { label: 'Modelos de Autos',      path: '/catalogos/modelos',             minRole: EnumRole.CAPTURISTA },
    ]
  }
];
