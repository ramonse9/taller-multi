import { PaginationResponse } from "@shared/interfaces/pagination.response";
import { Cliente } from "./cliente.interface";

export interface ClientesResponse extends PaginationResponse {
  clientes: Cliente[];
}
