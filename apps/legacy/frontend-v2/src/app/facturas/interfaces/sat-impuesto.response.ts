import { PaginationResponse } from "@shared/interfaces/pagination.response";
import { SatImpuesto } from "./sat-impuesto.interface";

export interface SatImpuestosResponse extends PaginationResponse {
  satImpuestos: SatImpuesto[];
}
