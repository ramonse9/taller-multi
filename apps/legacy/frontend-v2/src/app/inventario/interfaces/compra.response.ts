import { PaginationResponse } from "@shared/interfaces/pagination.response";
import { Compra, CompraLite } from "./compra.interface";

export interface ComprasResponse extends PaginationResponse {
  compras: CompraLite[]
}
