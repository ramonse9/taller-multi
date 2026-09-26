import { PaginationResponse } from "@shared/interfaces/pagination.response";
import { GastoMovimiento } from "./gasto-movimiento.interface";

export interface GastosMovimientosResponse extends PaginationResponse {
  gastosMovimientos: GastoMovimiento[];
}
