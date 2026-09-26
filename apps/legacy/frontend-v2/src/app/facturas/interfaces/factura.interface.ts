
import { Emisor } from "./emisor.interface";
import { Cliente } from "@catalogos/interfaces/cliente.interface";
import { Empresa } from '@catalogos/interfaces/empresa.interface';
import { Orden } from "@operaciones/interfaces/orden.interface";
import { SatUsoCFDI } from '@facturas/interfaces/sat-uso-cfdi.interface';
import { SatFormaPago } from '@facturas/interfaces/sat-forma-pago.interface';
import { SatTipoComprobante } from "@facturas/interfaces/sat-tipo-comprobante.interface";
import { SatRegimenFiscal } from '@facturas/interfaces/sat-regimen-fiscal.interface';
import { SatMetodoPago } from '@facturas/interfaces/sat-metodo-pago.interface';
import { SatTipoPersona } from "@facturas/interfaces/sat-tipo-persona.interface";
import { FacturaConcepto } from './factura-concepto.interface';
import { SatExportacion } from '@facturas/interfaces/sat-exportacion.interface';
import { Pago } from './pago.interface';

export interface FacturasResponse {
  count:    number;
  pages:    number;
  facturas: Factura[];
}

export interface Factura {
  id:                       string;
  estatus:                  string;
  fechaEmision:             Date;
  serie:                    string;
  folio:                    number;
  //formaPago:              string;   //catalogo
  satFormaPago:             SatFormaPago;
  satTipoComprobante:       SatTipoComprobante;
  satMetodoPago:            SatMetodoPago;
  condicionesPago:          string;
  //metodoPago:             string;
  uuid:                     string;
  moneda:                   string;
  lugarExpedicion:          string;
  observaciones:            string;
  subtotal:                 number;
  total:                    number;
  satExportacion:           SatExportacion;

  orden:                    Orden;

  emisor:                   Emisor;
  emisorRFC:                string;
  emisorRazonSocial:        string;
  emisorSatRegimenFiscal:   SatRegimenFiscal;
  emisorSatUsoCFDI:         SatUsoCFDI;
  emisorCodigoPostal:       string;

  receptor:                 Cliente | Empresa;
  receptorSatTipoPersona:   SatTipoPersona
  receptorRFC:              string;
  receptorRazonSocial:      string;
  receptorEmail:            string;
  receptorSatRegimenFiscal: SatRegimenFiscal;
  receptorSatUsoCFDI:       SatUsoCFDI;
  receptorCodigoPostal:     string;

  pagos:                    Pago[];
  conceptos:                FacturaConcepto[];
}
