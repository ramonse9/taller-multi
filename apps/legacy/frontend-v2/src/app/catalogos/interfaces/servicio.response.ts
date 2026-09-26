import { PaginationResponse } from "@shared/interfaces/pagination.response";
import { Servicio } from "./servicio.interface";

export interface ServiciosResponse extends PaginationResponse {
  servicios: Servicio[];
}
