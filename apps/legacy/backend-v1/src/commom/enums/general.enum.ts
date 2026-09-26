//ENTREGADO = 'entregado',
export enum EnumEstatusOrden{
  PROCESO = 'proceso',
  FINALIZADO = 'finalizado',
  PAUSADO = 'pausado',
  CANCELADO = 'cancelado'
}     

export enum EnumEstatusOrdenFactura{
  PENDIENTE = 'pendiente',
  TIMBRADA = 'timbrada'
}

export enum EnumEstatusCFDI {
  VIGENTE = 'vigente',
  EN_PROCESO_DE_CANCELACION = 'en_proceso_de_cancelacion',
  RECHAZADA_POR_EL_SAT = 'rechazada_por_el_sat',
  CANCELADA = 'cancelada'
}

//export const EnumEstatusFactura = EnumEstatusCFDI;
//export const EnumEstatusComplementoPago = EnumEstatusCFDI;

export enum EnumEstatusConcepto{
  VIGENTE = 'vigente',
  CANCELADA = 'cancelada'
}

export const EnumEstatusConceptoFactura = EnumEstatusConcepto;
export const EnumEstatusConceptoOrden = EnumEstatusConcepto;

export enum EnumSatCancelacionMotivo{
  COMPROBANTE_EMITIDO_CON_ERRORES_CON_RELACION = '01',
  COMPROBANTE_EMITIDO_CON_ERRORES_SIN_RELACION = '02',
  NO_SE_LLEVO_ACABO_LA_OPERACION = '03',
  OPERACION_NOMINATIVA_RELACIOANDA_EN_UNA_FACTURA_GLOBAL = '04',  
}

export enum EnumSatTipoTimbrado{
  FACTURA = 'factura',
  COMPLEMENTO = 'complemento'
}

export enum EnumSatTipoPersona{
  FISICA = 'fisica',
  MORAL = 'moral'
}

export enum EnumSatTipoComprobante{
  EGRESO = 'E',
  INGRESO = 'I',
  NOMINA = 'N',
  PAGO = 'P',
  TRASLADO = 'T'
}

export enum EnumSatTipoComprobanteDescripcion{
  EGRESO = 'EGRESO',
  INGRESO = 'INGRESO',
  NOMINA = 'NOMINA',
  PAGO = 'PAGO',
  TRASLADO = 'TRASLADO'
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

export enum EnumSatExportacion{
  NO_APLICA = '01',
  DEFINITIVA_CON_CLAVE_A1 = '02',
  TEMPORAL = '03',
  DEFINITIVA_SIN_CLAVE_A1 = '04'
}

export enum EnumSatImpuesto{
  IVA = '002',
  ISR = '001',
  IEPS = '003'
}

export enum EnumMoneda{
  MXN = 'MXN',
  USD = 'USD',
  EUR = 'EUR'
}

export enum EnumObjetoImpuesto{
  NO_OBJETO_DE_IMPUESTO = '01',
  SI_OBJETO_DE_IMPUESTO = '02',
  SI_OBJETO_DE_IMPUESTO_Y_NO_OBLIGADO_AL_DESGLOSE = '03',
  SI_OBJETO_DE_IMPUESTO_IVA_Y_NO_CAUSA_IMPUESTO_IVA = '04',
  SI_OBJETO_DEL_IMPUESTO_IVA_CREDITO_PODEBI = '05',
  SI_OBJETO_DEL_IVA_NO_TRASLADO_IVA = '06',
  NO_TRASLADO_DEL_IVA_SI_DESGLOSE_IEPS = '07',
  NO_TRASLADO_DEL_IVA_NO_DESGLOSE_IEPS = '08'
}

export enum EnumSatRegimenFiscal {
  ASALARIADO = '605', 
  ACTIVIDAD_EMPRESARIAL = '606',
  RESICO = '626',
  PERSONA_MORAL_GENERAL = '601',
}

export enum EnumImpuestosPorcentajes{
  IVA_RATE = 'iva_rate',
  ISR_RETENTION_PF_ACTIVIDAD_EMPRESARIAL = 'isr_retention_pf_actividad_empresarial',
  ISR_RETENTION_PF_RESICO = 'isr_retention_pf_resico',
  IVA_RETENTION_RATE = 'iva_retention_rate'
}

export enum EnumPrefijoEntity{
  USUARIOS = 'usu',
  CLIENTES = 'cli',
  COMPANIAS = 'com',
  EMISORES = 'emi',
  EMPRESAS = 'emp',
  ORDENES = 'ord',
  SATPRODUCTOSSERVICIOS = 'sps',
  PRODUCTOSSERVICIOS = 'pro',
  VEHICULOS = 'veh',
  FACTURAS = 'fac',
  COMPLEMENTOSPAGOS = 'cpa',
  COTIZACIONES = 'cot',
  GASTOSMOVIMIENTOS = 'gam',
  GASTOS = 'gas',
  EMPLEADOS = 'emp',
  MOVIMIENTOS = 'mov',
  PRODUCTOS = 'prd',
  SERVICIOS = 'srv',
  PROVEEDORES = 'prv',
  COMPRAS = 'cmp',
  COMPRASDETALLE = 'cmd',
  INVENTARIOLOTES = 'lot',
  INVENTARIOMOVIMIENTOS = 'imv',

}

export enum EnumTipoMovimientoInventario {
  ENTRADA = 'entrada',
  SALIDA = 'salida',
  AJUSTE = 'ajuste',
}

export enum EnumMotivoMovimientoInventario {
  COMPRA = 'compra',
  ORDEN_SERVICIO = 'orden_servicio',
  CANCELACION = 'cancelacion',
  MERMA = 'merma',
  AJUSTE_MANUAL = 'ajuste_manual',
}

export enum EnumEstatusCompra {
  BORRADOR = 'borrador',
  CONFIRMADA = 'confirmada',
  CANCELADA = 'cancelada',
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

export enum EnumOrdenConceptoTipo{
  PRODUCTO = 'producto',
  SERVICIO = 'servicio'  
}