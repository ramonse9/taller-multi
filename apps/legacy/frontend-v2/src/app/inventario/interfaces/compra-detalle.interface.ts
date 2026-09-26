import { Producto } from "./producto.interface";

export interface CompraDetalle{
  id:                 string;
  cantidad:           number;
  costoUnitario:      number;
  subtotal:           number;
  producto:           Producto;
}
