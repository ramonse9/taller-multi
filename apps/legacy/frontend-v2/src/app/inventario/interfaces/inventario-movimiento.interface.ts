import { SatProductoServicio } from "@facturas/interfaces/sat-producto-servicio.interface";
import { Producto } from "./producto.interface";
import { EnumInventarioMotivoMovimiento, EnumInventarioTipoMovimiento } from "@shared/enums/general-estatus.enum";

export interface InventarioMovimiento{
  id:                                   string;
  descripcion:                          string;
  stockAnterior:                        number;
  stockNuevo:                           number;
  cantidad:                             number;
  referenciaTabla:                      string;
  idReferencia:                         string;
  observaciones:                        string;
  cancelado:                            boolean;
  movimientoReversa?:                   InventarioMovimiento;
  tipoMovimiento:                       EnumInventarioTipoMovimiento;
  motivoMovimiento:                     EnumInventarioMotivoMovimiento;
  producto:                             Producto;
  createdAt:                            string;
}
