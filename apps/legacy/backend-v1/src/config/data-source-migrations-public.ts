import * as dotenv from 'dotenv';
dotenv.config({ path: `.env.${process.env.NODE_ENV || 'development'}` });

import { DataSource } from 'typeorm';
import { join } from 'path';
import { User } from '../auth/entities/user.entity';
import { ZonaHoraria } from '../auth/entities/zona-horaria.entity';
import { Compania } from '../companias/entities/compania.entity';
import { CompaniaInfo } from '../companias/entities/compania-info.entity';
import { CompaniaTipoGiro } from '../companias/entities/compania-tipo-giro.entity';
import { Marca } from '../marcas/entities/marca.entity';
import { Modelo } from '../modelos/entities/modelo.entity';
import { SatCancelacionMotivo } from '../sat/entities/sat-cancelacion-motivo.entity';
import { SatClaveUnidad } from '../sat/entities/sat-clave-unidad.entity';
import { SatEstado } from '../sat/entities/sat-estado.entity';
import { SatExportacion } from '../sat/entities/sat-exportacion.entity';
import { SatFormaPago } from '../sat/entities/sat-forma-pago.entity';
import { SatImpuestoPorcentaje } from '../sat/entities/sat-impuesto-porcentaje.entity';
import { SatImpuesto } from '../sat/entities/sat-impuesto.entity';
import { SatMetodoPago } from '../sat/entities/sat-metodo-pago.entity';
import { SatMoneda } from '../sat/entities/sat-moneda.entity';
import { SatObjetoImpuesto } from '../sat/entities/sat-objeto-impuesto.entity';
import { SatPais } from '../sat/entities/sat-pais.entity';
import { SatProductoServicio } from '../sat/entities/sat-producto-servicio.entity';
import { SatRegimenFiscal } from '../sat/entities/sat-regimen-fiscal.entity';
import { SatRetencionISR } from '../sat/entities/sat-retencion-isr.entity';
import { SatRetencionIVA } from '../sat/entities/sat-retencion-iva.entity';
import { SatTipoComprobante } from '../sat/entities/sat-tipo-comprobante.entity';
import { SatTipoPersona } from '../sat/entities/sat-tipo-persona.entity';
import { SatTipoProductoServicio } from '../sat/entities/sat-tipo-producto-servicio.entity';
import { SatTipoRelacion } from '../sat/entities/sat-tipo-relacion.entity';
import { SatUsoCFDIRegimenFiscal } from '../sat/entities/sat-uso-cfdi-regimen-fiscal.entity';
import { SatUsoCFDI } from '../sat/entities/sat-uso-cfdi.entity';

export const PUBLIC_ENTITIES = [
  User, ZonaHoraria, Compania, CompaniaInfo, CompaniaTipoGiro, Marca, Modelo,
  SatCancelacionMotivo, SatClaveUnidad, SatEstado, SatExportacion, SatFormaPago,
  SatImpuestoPorcentaje, SatImpuesto, SatMetodoPago, SatMoneda, SatObjetoImpuesto,
  SatPais, SatProductoServicio, SatRegimenFiscal, SatRetencionISR, SatRetencionIVA,
  SatTipoComprobante, SatTipoPersona, SatTipoProductoServicio, SatTipoRelacion,
  SatUsoCFDIRegimenFiscal, SatUsoCFDI,
];

export default new DataSource({
  type: 'postgres',
  host: process.env.DATABASE_HOST,
  port: parseInt(process.env.DATABASE_PORT || '5432', 10),
  username: process.env.DATABASE_USER,
  password: process.env.DATABASE_PASS,
  database: process.env.DATABASE_NAME,
  schema: 'public',
  ssl: process.env.DB_SSL === 'true',
  extra: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : undefined,
  entities: PUBLIC_ENTITIES,
  migrations: [join(__dirname, '..', 'migrations/public', '*.{ts,js}')],
  synchronize: false,
  logging: false,
});
