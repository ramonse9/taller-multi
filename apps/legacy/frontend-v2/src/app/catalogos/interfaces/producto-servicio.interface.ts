import { SatProductoServicio } from "@facturas/interfaces/sat-producto-servicio.interface";

export interface ProductoServicio{
  id:                                   string;
  descripcion:                          string;
  costoUnitario:                        number;
  satProductoServicio:                  SatProductoServicio;
}
