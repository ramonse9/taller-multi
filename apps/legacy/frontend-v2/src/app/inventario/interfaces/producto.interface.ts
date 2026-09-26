import { SatProductoServicio } from "@facturas/interfaces/sat-producto-servicio.interface";

export interface Producto{
  id:                                   string;
  descripcion:                          string;
  precioVenta:                          number;
  sku:                                  string;
  codigoBarras:                         string;
  stockActual:                          number;
  stockMinimo:                          number;
  manejaInventario:                     boolean;
  permiteVentaSinStock:                 boolean;
  satProductoServicio:                  SatProductoServicio;
  createdAt:                            string;
}
