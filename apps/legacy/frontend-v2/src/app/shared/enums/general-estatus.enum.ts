export enum EnumPaginasTitulo {

  ORDEN_NEW = 'Nueva Orden',
  ORDEN_UPDATE = 'Actualizar Orden',

  MARCA_NEW = 'Nueva Marca',
  MARCA_UPDATE = 'Actualizar Marca',

  MODELO_NEW = 'Nuevo Modelo',
  MODELO_UPDATE = 'Actualizar Modelo',

  CLIENTE_NEW = 'Nuevo Cliente',
  CLIENTE_UPDATE = 'Actualizar Cliente',

  EMPRESA_NEW = 'Nueva Empresa',
  EMPRESA_UPDATE = 'Actualizar Empresa',

  VEHICULO_NEW = 'Nuevo Vehículo',
  VEHICULO_UPDATE = 'Actualizar Vehículo',

  MIS_DATOS = 'Mis Datos para facturación',
  FACTURA_NEW = 'Emitir Factura',
  FACTURA_UPDATE = 'Emitir Factura',
  COMPLEMENTO = 'Complemento de Pago',

  PRODUCTO_SERVICIO_NEW = 'Nuevo Producto ó Servicio',
  PRODUCTO_SERVICIO_UPDATE = 'Actualizar Producto ó Servicio',

  SERVICIO_NEW = 'Nuevo Servicio',
  SERVICIO_UPDATE = 'Actualizar Servicio',

  PRODUCTO_NEW = 'Nuevo Producto',
  PRODUCTO_UPDATE = 'Actualizar Producto',

  CANCELAR_FACTURA='Cancelar Factura',
  CANCELAR_COMPLEMENTO='Cancelar Complemento de Pago',

  COTIZACION_NEW = 'Nueva Cotizacion',
  COTIZACION_UPDATE = 'Actualizar Cotizacion',

  GASTO_NEW = 'Nuevo Gasto',
  GASTO_UPDATE = 'Actualizar Gasto',

  GASTO_CONCEPTO_NEW = 'Nuevo Concepto de Gasto',
  GASTO_CONCEPTO_UPDATE = 'Actualizar Concepto de Gasto',

  EMPLEADO_NEW = 'Nuevo Empleado',
  EMPLEADO_UPDATE = 'Actualizar Empleado',

  PROVEEDOR_NEW = 'Nuevo Proveedor',
  PROVEEDOR_UPDATE = 'Actualizar Proveedor',

  COMPRA_NEW = 'Nueva Compra',
  COMPRA_UPDATE = 'Actualizar Compra',

}

export enum EnumCeroRegistros {
  COTIZACIONES = 'No hay cotizaciones registradas',
  ORDENES = 'No hay ordenes registradas',
  EMPRESAS = 'No hay empresas registradas',
  CLIENTES = 'No hay clientes registrados',
  VEHICULOS = 'No hay vehiculos registrados',
  PRODUCTOSSERVICIOS = 'No hay productos y/o servicios registrados',
  PRODUCTOS = 'No hay productos registrados',
  SERVICIOS = 'No hay servicios registrados',
  FACTURAS = 'No hay facturas registradas',
  MODELOS = 'No hay modelos registrados',
  MARCAS = 'No hay marcas registradas',
  GASTOS = 'No hay gastos registrados',
  MOVIMIENTOS = 'No hay movimientos registrados',
  EMPLEADOS = 'No hay empleados registrados',
  PROVEEDORES = 'No hay proveedores registrados',
  COMPRAS = 'No hay compras registradas',
  INVENTARIO_MOVIMIENTOS = 'No hay movimientos registrados',
  INVENTARIO_LOTES = 'No hay lotes registrados',
}

export enum EnumEstatusToast{
  SUCCESS = 'Success',
  WARNING = 'Warning',
  DANGER = 'Danger'
}

export enum EnumEstatusOrden{
  PROCESO = 'proceso',
  FINALIZADO = 'finalizado',
  PAUSADO = 'pausado',
  CANCELADO = 'cancelado'
}

export enum EnumSatTipoPersona{
  FISICA = 'fisica',
  MORAL = 'moral'
}

export enum EnumEstatusOrdenFactura{
  PENDIENTE = 'pendiente',
  TIMBRADA = 'timbrada'
}


export enum EnumCategoria {
  SERVICIOS = 'servicios',
  ORDENES = 'ordenes',
  FACTURAS = 'facturas',
  ORDENESFACTURAS = 'ordenesfacturas',
  COMPRAS = 'compras',
}


export enum EnumEstatusCFDI{
  VIGENTE = 'vigente',
  EN_PROCESO_DE_CANCELACION = 'en_proceso_de_cancelacion',
  RECHAZADA_POR_EL_SAT = 'rechazada_por_el_sat',
  CANCELADA = 'cancelada'
}

export enum EnumSatMetodoPago{
  PUE_PAGO_EN_UNA_SOLA_EXHIBICION = 'PUE',
  PPD_PAGO_EN_PARCIALIDADES_O_DIFERIDO = 'PPD'
}

export enum EnumSatFormaPago{
  EFECTIVO = '01',
  CHEQUE_NOMINATIVO = '02',
  TRANSFERENCIA_ELECTRONICA_DE_FONDOS = '03',
  TARJETA_DE_CREDITO = '04',
  MONEDERO_ELECTRONICO = '05',
  DINERO_ELECTRONICO = '06',
  VALES_DE_DESPENSA = '08',
  DACION_DE_PAGO = '12',
  PAGO_POR_SUBROGACION = '13',
  PAGO_POR_CONSIGNACION = '14',
  CONDONACION = '15',
  COMPENSANCION = '17',
  NOVACION = '23',
  CONFUSION = '24',
  REMISION_DE_DEUDA = '25',
  PRESCRIPCION_O_CADUCIDAD = '26',
  A_SATISFACCION_DEL_ACREEDOR = '27',
  TARJETA_DE_DEBITO= '28',
  TARJETA_DE_SERVICIOS = '29',
  APLICACION_DE_ANTICIPOS = '30',
  INTERMEDIARIO_PAGOS = '31',
  POR_DEFINIR = '99'
}

export enum EnumZonaHoraria{
  America_Mazatlan = 'America/Mazatlan',
  America_Mexico_City = 'America/Mexico_City',
  America_Monterrey = 'America/Monterrey',
  America_Tijuana = 'America/Tijuana'
}

export enum EnumSeccion {
  NINGUNA = 0,
  CONCEPTOS = 1,
  DETALLES = 2,
  PREVISUALIZACION = 3
}

export enum EnumSatCancelacionMotivo{
  COMPROBANTE_EMITIDO_CON_ERRORES_CON_RELACION = '01',
  COMPROBANTE_EMITIDO_CON_ERRORES_SIN_RELACION = '02',
  NO_SE_LLEVO_ACABO_LA_OPERACION = '03',
  OPERACION_NOMINATIVA_RELACIOANDA_EN_UNA_FACTURA_GLOBAL = '04',
}

export enum EnumBadgeSimpleColor{
  YELLOW = 'bg-lightyellow-500 dark:bg-darkyellow-500 text-white dark:text-white',
  GREEN = 'bg-lightgreen-500 dark:bg-darkgreen-500 text-white dark:text-white',
  RED = 'bg-lightred-600 dark:bg-darkred-600 text-white dark:text-white',
}

export enum EnumSatTipoComprobante{
  INGRESO = 'I',
  EGRESO = 'E',
  TRASLADO = 'T',
  NOMINA = 'N',
  PAGO = 'P',
}

export enum EnumTipoPagoGasto{
  CONTADO = 'contado',
  CREDITO = 'credito'
}

export enum EnumNominaPeriodicidad{
  SEMANAL = "semanal",
  CATORCENAL_1 = "catorcenal_1",
  CATORCENAL_2 = "catorcenal_2",
  QUINCENAL = "quincenal"
}

export enum EnumNominaMovimientoTipo{
  PERCEPCION = 'percepcion',
  DEDUCCION = 'deduccion'
}

export enum EnumNominaMovimientoEstatus{
  ACTIVO = 'activo',
  CANCELADO = 'cancelado'
}

export enum EnumColor{
  RED = 'red',
  BLUE = 'blue',
  YELLOW = 'yellow',
  ORANGE = 'orange',
  GREEN = 'green',
  GREENSOFT = 'greensoft',
  GRAY = 'gray',
  PURPLE = 'purple',
  BLUESKY = 'bluesky',
  BLUEREY = 'bluerey',
  PINK = 'pink'
}

export enum EnumMenuOption{
  INICIO = 'inicio',
  DASHBOARD = 'dashboard',
  OPERACIONES = 'operaciones',
  PAGOS = 'pagos',
  CATALOGOS = 'catalogos',
  FACTURAS = 'facturas',
  INVENTARIO = 'inventario',
}

export enum EnumRole {
    CAPTURISTA = 'capturista',
    ADMIN = 'admin',
    SUPER = 'super'
}

export enum EnumEntidadesVoice{
  VEHICULO = 'vehiculo',
  CLIENTE = 'cliente',
  ORDEN = 'orden',
  EMPRESA= 'empresa',
}

export enum EnumLinks{
  CLIENTES_ID =               '/catalogos/clientes',
  EMPRESAS_ID =               '/catalogos/empresas',
  VEHICULOS_ID =              '/catalogos/vehiculos',
  ORDENES_ID_DETALLES =       '/operaciones/ordenes',
  COTIZACIONES_ID_DETALLES =  '/operaciones/cotizaciones',
  COMPRAS_ID_DETALLES =       '/inventario/compras',
}

export enum EnumEntidad{
  CLIENTE     = 'Cliente',
  VEHICULO    = 'Vehiculo',
  COMPRA      = 'Compra',
  COTIZACION  = 'Cotización',
  ORDEN       = 'Orden',
  EMPRESA     = 'Empresa',
  PRODUCTO    = 'Producto',
  SERVICIO    = 'Servicio',
  FACTURA     = 'Factura',
  MODELO      = 'Modelo',
  MARCA       = 'Marca',
  GASTO       = 'Gasto',
  MOVIMIENTO  = 'Movimiento',
  EMPLEADO    = 'Empleado',
  PROVEEDOR   = 'Proveedor',
}

export enum EnumBorderColor{
  VALID = 'border-green-500 dark:border-green-400',
  INVALID = 'border-red-200 dark:border-red-700',
}

export enum EnumEstatusCompra{
  BORRADOR = 'borrador',
  CONFIRMADA = 'confirmada',
  CANCELADA = 'cancelada',
}

export enum EnumInventarioTipoMovimiento{
  ENTRADA = 'entrada',
  SALIDA = 'salida',
  //AJUSTE = 'ajuste',
}

export enum EnumInventarioMotivoMovimiento{
  COMPRA = 'compra',
  ORDEN_SERVICIO = 'orden_servicio',
  CANCELACION = 'cancelacion',
  MERMA = 'merma',
  AJUSTE_MANUAL = 'ajuste_manual',
}

export enum EnumDrawerDirection{
  RIGHT = 'right',
  BOTTOM = 'bottom'
}

export enum EnumOrdenConceptoTipo{
  PRODUCTO='producto',
  SERVICIO='servicio'
}
