import { ProductoServicio } from "@catalogos/interfaces/producto-servicio.interface";
import { FacturaConceptoImpuesto } from "./factura-concepto-impuesto.interface";

export interface FacturaConcepto {

  id: number;
  cantidad: number
  productoServicio: ProductoServicio
  subtotal: number;
  descuento: number;
  impuestos: FacturaConceptoImpuesto[]
  costoUnitario: number;
}
