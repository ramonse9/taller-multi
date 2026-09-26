import { PaginationResponse } from "@shared/interfaces/pagination.response";
import { Modelo } from "./modelo.interface";

export interface ModelosResponse extends PaginationResponse {

  modelos: Modelo[];

}
