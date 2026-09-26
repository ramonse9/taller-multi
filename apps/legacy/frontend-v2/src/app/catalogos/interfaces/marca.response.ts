import { PaginationResponse } from "@shared/interfaces/pagination.response";
import { Marca } from "./marca.interface";

export interface MarcasResponse extends PaginationResponse{

  marcas: Marca[];
}
