import { PaginationResponse } from "@shared/interfaces/pagination.response";
import { Cotizacion } from "./cotizacion.interface";

export interface CotizacionesResponse extends PaginationResponse {
  cotizaciones: Cotizacion[]
}
