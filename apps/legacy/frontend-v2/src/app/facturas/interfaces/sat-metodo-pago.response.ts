import { PaginationResponse } from "@shared/interfaces/pagination.response";
import { SatMetodoPago } from "./sat-metodo-pago.interface";

export interface SatMetodosPagosResponse extends PaginationResponse{
  satMetodosPagos: SatMetodoPago[];
}
