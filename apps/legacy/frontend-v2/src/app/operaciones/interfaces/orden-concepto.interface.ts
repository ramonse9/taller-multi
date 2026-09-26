import { ProductoServicio } from "@catalogos/interfaces/producto-servicio.interface";
import { Servicio } from "@catalogos/interfaces/servicio.interface";
import { Producto } from "@inventario/interfaces/producto.interface";
import { EnumOrdenConceptoTipo } from "@shared/enums/general-estatus.enum";

export interface OrdenConcepto{
  id:                           number;
  cantidad:                     number;
  tipo:                         EnumOrdenConceptoTipo; 
  precioVentaSnapshot:          number;
  subtotalPrecioVentaSnapshot:  number;
  costoUnitario:                number;
  productoServicio:             ProductoServicio;
  producto:                     Producto;
  servicio:                     Servicio;
}
