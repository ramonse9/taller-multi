import { PaginationResponse } from "@shared/interfaces/pagination.response";
import { SatCancelacionMotivo } from "./sat-cancelacion-motivo.interface";

export interface SatCancelacionesMotivosResponse extends PaginationResponse {
  satCancelacionesMotivos: SatCancelacionMotivo[];
}
