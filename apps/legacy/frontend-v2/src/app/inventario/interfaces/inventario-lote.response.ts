import { Producto } from "./producto.interface";
import { CompraDetalle } from "./compra-detalle.interface";
import { PaginationResponse } from "@shared/interfaces/pagination.response";
import { InventarioLote } from "./inventario-lote.interface";

export interface InventarioLotesResponse extends PaginationResponse{
  inventarioLotes: InventarioLote[];
}
