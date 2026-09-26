import { PaginationResponse } from "@shared/interfaces/pagination.response";
import { SatImpuestoPorcentaje } from "./sat-impuesto-porcentaje.interface";

export interface SatImpuestosPorcentajesResponse extends PaginationResponse {
  satImpuestosPorcentajes: SatImpuestoPorcentaje[];
}
