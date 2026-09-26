import { PaginationResponse } from "@shared/interfaces/pagination.response";
import { Factura } from "./factura.interface";

export interface FacturasResponse extends PaginationResponse{
  facturas: Factura[]
}
