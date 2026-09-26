import { PaginationResponse } from "@shared/interfaces/pagination.response";
import { Producto } from "./producto.interface";

export interface ProductosResponse extends PaginationResponse {
  productos: Producto[];
}
