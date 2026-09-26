import { PaginationResponse } from "@shared/interfaces/pagination.response";
import { SatFormaPago } from "./sat-forma-pago.interface";

export interface SatFormasPagosResponse extends PaginationResponse{
  satFormasPagos: SatFormaPago[];
}
