import { Orden } from "./orden.interface";
import { CotizacionConcepto } from "./cotizacion-concepto.interface";
import { Modelo } from "@catalogos/interfaces/modelo.interface";
import { Cliente } from "@catalogos/interfaces/cliente.interface";
import { Empresa } from "@catalogos/interfaces/empresa.interface";
import { Vehiculo } from "@catalogos/interfaces/vehiculo.interface";

export interface Cotizacion {
  id:                   string;
  descripcion:          string;
  cliente:              Cliente | null;
  empresa:              Empresa | null;
  vehiculo:             Vehiculo | null;
  modelo:               Modelo | null;
  anio:                 number | null;
  conceptos:            CotizacionConcepto[];
  orden:                Orden | null;
  createdAt:            string;
  updatedAt:            string;
}
