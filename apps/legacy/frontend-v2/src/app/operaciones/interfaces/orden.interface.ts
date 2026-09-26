import { SatMetodoPago } from "@facturas/interfaces/sat-metodo-pago.interface";
import { OrdenConcepto } from "./orden-concepto.interface";
import { OrdenNota } from "./orden-nota.interface";
import { Factura } from "@facturas/interfaces/factura.interface";
import { Cliente } from "@catalogos/interfaces/cliente.interface";
import { Empresa } from "@catalogos/interfaces/empresa.interface";
import { Vehiculo } from "@catalogos/interfaces/vehiculo.interface";

export interface Orden {
  id:                   string;
  descripcion:          string;
  fechaIngreso:         string | null;
  //fechaEntregaEstimada: string | null;
  fechaEntregaReal:     string | null;
  fechaLiquidacion:     string | null;
  kilometros:           number | null;
  poliza:               string | null;
  siniestro:            string | null;
  folioNota:            string | null;
  estatus:              string;
  estatusFactura:       string;
  liquidacionFactura:   boolean;
  fechaPago:            string | null;
  pagada:               boolean;
  subtotalCosto:        number;
  subtotalVenta:        number;
  utilidad:             number;
  createdAt:            string;
  updatedAt:            string;
  cliente:              Cliente | null;
  empresa:              Empresa | null;
  vehiculo:             Vehiculo | null;
  notas:                OrdenNota[];
  conceptos:            OrdenConcepto[];
  satMetodoPago:        SatMetodoPago;
  facturas:             Factura[];
}
