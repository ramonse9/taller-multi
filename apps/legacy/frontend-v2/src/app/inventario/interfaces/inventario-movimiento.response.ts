import { PaginationResponse } from "@shared/interfaces/pagination.response";
import { InventarioMovimiento } from "./inventario-movimiento.interface";

export interface InventarioMovimientosResponse extends PaginationResponse {
  inventarioMovimientos: InventarioMovimiento[];
}
