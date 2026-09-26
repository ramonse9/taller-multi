import { SatProductoServicio } from "@facturas/interfaces/sat-producto-servicio.interface";

export interface Servicio{
  id:                                   string;
  descripcion:                          string;
  precioVenta:                          number;
  satProductoServicio:                  SatProductoServicio;
  activo:                               boolean;
  createdAt:                            string;
}
