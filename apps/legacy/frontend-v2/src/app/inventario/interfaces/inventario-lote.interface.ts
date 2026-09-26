import { Producto } from "./producto.interface";
import { CompraDetalle } from "./compra-detalle.interface";

export interface InventarioLote{
  id:                                   string;
  cantidadInicial:                      number;
  cantidadDisponible:                   number;
  costoUnitario:                        number;
  fechaEntrada:                         Date;
  activo:                               boolean;
  producto:                             Producto;
  compraDetalle:                        CompraDetalle;
  createdAt:                            string;
}
