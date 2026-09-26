import { PaginationResponse } from "@shared/interfaces/pagination.response";
import { Orden } from "./orden.interface";

export interface OrdenesResponse extends PaginationResponse {
  ordenes: Orden[]
}
