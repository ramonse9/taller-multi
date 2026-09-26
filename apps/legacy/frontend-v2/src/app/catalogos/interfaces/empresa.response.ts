import { PaginationResponse } from "@shared/interfaces/pagination.response";
import { Empresa } from "./empresa.interface";

export interface EmpresasResponse extends PaginationResponse{
  empresas: Empresa[];
}
