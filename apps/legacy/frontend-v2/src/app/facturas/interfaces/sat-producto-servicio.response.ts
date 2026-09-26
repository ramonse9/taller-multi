import { PaginationResponse } from "@shared/interfaces/pagination.response";
import { SatProductoServicio } from "./sat-producto-servicio.interface";

export interface SatProductosServiciosResponse extends PaginationResponse {
  satProductosServicios: SatProductoServicio[];
}
