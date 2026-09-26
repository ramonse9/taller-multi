import { PaginationResponse } from "@shared/interfaces/pagination.response";
import { Proveedor } from "./proveedor.interface";

export interface ProveedoresResponse extends PaginationResponse{

  proveedores: Proveedor[];
}
