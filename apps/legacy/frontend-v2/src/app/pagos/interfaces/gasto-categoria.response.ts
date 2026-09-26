import { PaginationResponse } from "@shared/interfaces/pagination.response";
import { GastoCategoria } from "./gasto-categoria.interface";

export interface GastoCategoriaResponse extends PaginationResponse {
  gastosCategorias: GastoCategoria[];
}
