import { ProductoServicio } from "@catalogos/interfaces/producto-servicio.interface";

export interface CotizacionConcepto{
  id:                 number;
  cantidad:           number;
  costoUnitario:      number;
  productoServicio:   ProductoServicio;
}
