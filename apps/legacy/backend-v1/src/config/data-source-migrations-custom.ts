import * as dotenv from 'dotenv';
dotenv.config({
  path: `.env.${process.env.NODE_ENV || 'development'}`
});
import { CotizacionConcepto } from './../cotizaciones/entities/cotizacion_concepto.entity';
import { Cotizacion } from './../cotizaciones/entities/cotizacion.entity';
import { SatCancelacionMotivo } from './../sat/entities/sat-cancelacion-motivo.entity';
import { ZonaHoraria } from './../auth/entities/zona-horaria.entity';
import { Complemento } from '../facturas/entities/complemento.entity';
import { FacturaConceptoImpuesto } from './../facturas/entities/factura-concepto-impuesto.entity';
import { FacturaConcepto } from './../facturas/entities/factura-concepto.entity';
import { Factura } from '../facturas/entities/factura.entity';
import { Pago } from './../facturas/entities/pago.entity';
import { Emisor } from '../emisor/entities/emisor.entity';
import { ProductoServicio } from '../productos-servicios/entities/producto-servicio.entity';
import { Vehiculo } from '../vehiculos/entities/vehiculo.entity';
import { Empresa } from '../empresas/entities/empresa.entity';
import { Cliente } from '../clientes/entities/cliente.entity';
import { OrdenConcepto } from '../ordenes/entities/orden_concepto.entity';
import { OrdenNota } from '../ordenes/entities/orden_nota.entity';
import { OrdenNotaImagen } from '../ordenes/entities/orden_nota_imagen.entity';
import { Orden } from '../ordenes/entities/orden.entity';
import 'dotenv/config';
import { DataSource } from 'typeorm';
import { join } from 'path';
import { SatMoneda } from '../sat/entities/sat-moneda.entity';
import { SatImpuesto } from './../sat/entities/sat-impuesto.entity';
import { SatObjetoImpuesto } from './../sat/entities/sat-objeto-impuesto.entity';
import { SatUsoCFDI } from '../sat/entities/sat-uso-cfdi.entity';
import { SatUsoCFDIRegimenFiscal } from '../sat/entities/sat-uso-cfdi-regimen-fiscal.entity';
import { SatTipoProductoServicio } from '../sat/entities/sat-tipo-producto-servicio.entity';
import { SatTipoPersona } from '../sat/entities/sat-tipo-persona.entity';
import { SatTipoComprobante } from '../sat/entities/sat-tipo-comprobante.entity';
import { SatRetencionIVA } from '../sat/entities/sat-retencion-iva.entity';
import { SatRetencionISR } from '../sat/entities/sat-retencion-isr.entity';
import { SatRegimenFiscal } from '../sat/entities/sat-regimen-fiscal.entity';
import { SatProductoServicio } from '../sat/entities/sat-producto-servicio.entity';
import { SatPais } from '../sat/entities/sat-pais.entity';
import { SatMetodoPago } from '../sat/entities/sat-metodo-pago.entity';
import { SatFormaPago } from '../sat/entities/sat-forma-pago.entity';
import { SatEstado } from '../sat/entities/sat-estado.entity';
import { SatClaveUnidad } from '../sat/entities/sat-clave-unidad.entity';
import { SatExportacion } from './../sat/entities/sat-exportacion.entity';
import { CompaniaTipoGiro } from '../companias/entities/compania-tipo-giro.entity';
import { Compania } from '../companias/entities/compania.entity';
import { Modelo } from '../modelos/entities/modelo.entity';
import { User } from '../auth/entities/user.entity';
import { Marca } from '../marcas/entities/marca.entity';
import { Gasto } from '../gastos/entities/gasto.entity';
import { GastoMovimiento } from '../gastos/entities/gasto_movimiento.entity';
import { CompaniaInfo } from    './../companias/entities/compania-info.entity';
import { GastoCategoria } from  './../gastos/entities/gasto_categoria.entity';
import { NominaPeriodo } from   '../nomina/entities/nomina-periodo.entity';
import { NominaMovimiento } from '../nomina/entities/nomina-movimiento.entity';
import { NominaMovimientoDetalle } from '../nomina/entities/nomina-movimiento-detalle.entity';
import { Producto } from '../productos/entities/producto.entity';
import { Servicio } from '../servicios/entities/servicio.entity';
import { InventarioLote } from '../inventario/entities/inventario-lote.entity';
import { InventarioMovimiento } from '../inventario/entities/inventario-movimiento.entity';
import { OrdenConceptoInventario } from '../inventario/entities/orden-concepto-inventario.entity';
import { Proveedor } from '../proveedores/entities/proveedor.entity';
import { CompraDetalle } from '../compras/entities/compra-detalle.entity';
import { Compra } from '../compras/entities/compra.entity';
import { Empleado } from '../empleados/entities/empleado.entity';

const tenantSchema = process.env.TENANT_SCHEMA?.trim().toLowerCase();
if (!tenantSchema || !/^[a-z][a-z0-9_]{2,49}$/.test(tenantSchema) || tenantSchema === 'public' || tenantSchema.startsWith('pg_')) {
  throw new Error('TENANT_SCHEMA debe contener un nombre de schema tenant válido');
}

console.log( `
  ==========================
  CONFIGURACIÓN DE TYPEORM PARA MIGRACIONES EN SCHEMA -CUSTOM-
  ENV: ${process.env.NODE_ENV}
  DB: ${process.env.DATABASE_NAME}
  SCHEMA: ${tenantSchema}
  ==========================
`)

export default new DataSource({
  type: 'postgres',
  host: process.env.DATABASE_HOST,
  port: parseInt(process.env.DATABASE_PORT || '5432', 10),
  username: process.env.DATABASE_USER,
  password: process.env.DATABASE_PASS,
  database: process.env.DATABASE_NAME,
  schema: tenantSchema,
  ssl: process.env.DB_SSL === 'true',
  extra: process.env.DB_SSL === 'true'
    ? { rejectUnauthorized: false }
    : undefined,
  entities: [User, Marca, Modelo, Compania, CompaniaTipoGiro, CompaniaInfo,
    SatClaveUnidad, SatEstado, SatFormaPago, SatMetodoPago, SatPais, SatProductoServicio, SatRegimenFiscal, SatMoneda,
    SatRetencionISR, SatRetencionIVA, SatTipoComprobante, SatTipoPersona, SatTipoProductoServicio, SatUsoCFDIRegimenFiscal, SatUsoCFDI, SatObjetoImpuesto,
    SatImpuesto, SatExportacion, SatCancelacionMotivo,
    ZonaHoraria,
    Orden, OrdenNotaImagen, OrdenNota, OrdenConcepto, Cliente, Empresa, Vehiculo, ProductoServicio, Emisor, Factura, FacturaConcepto, FacturaConceptoImpuesto, Complemento, Pago, //FacturaTimbreFiscal //, FacturaPacResultado,
    Cotizacion, CotizacionConcepto, Gasto, GastoMovimiento, GastoCategoria,
    NominaPeriodo, Empleado, NominaMovimiento, NominaMovimientoDetalle,
    Producto, Servicio, InventarioLote, InventarioMovimiento, OrdenConceptoInventario, Proveedor, CompraDetalle, Compra,
   ],
  migrations: [join(__dirname, '..', 'migrations/custom', '*.{ts,js}')],
  synchronize: false,
  logging: false,
});
