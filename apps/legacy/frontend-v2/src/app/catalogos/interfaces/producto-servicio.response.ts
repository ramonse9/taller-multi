import { PaginationResponse } from "@shared/interfaces/pagination.response";
import { ProductoServicio } from './producto-servicio.interface';

export interface ProductosServiciosResponse extends PaginationResponse {
  productosServicios: ProductoServicio[];
}
