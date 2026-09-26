import { PaginationResponse } from "@shared/interfaces/pagination.response";
import { Gasto } from "./gasto.interface";

export interface GastoResponse extends PaginationResponse {
  gastos: Gasto[];
}
