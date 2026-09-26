import { EnumColor, EnumRole } from "@shared/enums/general-estatus.enum";
import { AccesoRapidoItem } from "@shared/interfaces/acceso-rapido-item.interface";

  export const accesosRapidos: AccesoRapidoItem[] =  [
    { label: 'Dashboard',               icon: 'tablerChartBarPopular',  color: EnumColor.BLUESKY,   minRole: EnumRole.ADMIN,        path: '/dashboard/general',  },
    { label: 'Ordenes',                 icon: 'tablerTool',             color: EnumColor.GREENSOFT, minRole: EnumRole.ADMIN,        path: '/operaciones/ordenes',  },
    { label: 'Nómina',                  icon: 'tablerReportMoney',      color: EnumColor.GREEN,     minRole: EnumRole.ADMIN,        path: '/pagos/mes',  },
    { label: 'Gastos',                  icon: 'tablerCalendarDollar',   color: EnumColor.RED,       minRole: EnumRole.ADMIN,        path: '/pagos/gastos',  },
    { label: 'Empresas',                icon: 'tablerBuilding',         color: EnumColor.GRAY,      minRole: EnumRole.ADMIN,        path: '/catalogos/empresas',  },
    { label: 'Productos y Servicios',   icon: 'tablerLibrary',          color: EnumColor.YELLOW,    minRole: EnumRole.ADMIN,        path: '/catalogos/productosservicios',  },
    { label: 'Clientes',                icon: 'tablerUsersGroup',       color: EnumColor.PURPLE,    minRole: EnumRole.CAPTURISTA,   path: '/catalogos/clientes',  },
    { label: 'Vehículos',               icon: 'tablerCar',              color: EnumColor.BLUE,      minRole: EnumRole.CAPTURISTA,   path: '/catalogos/vehiculos',  },
  ];
