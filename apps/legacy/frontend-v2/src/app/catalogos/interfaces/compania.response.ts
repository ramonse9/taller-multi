import { PaginationResponse } from "@shared/interfaces/pagination.response";
import { Compania } from './compania.interface';

export interface CompaniasResponse extends PaginationResponse {
  companias: Compania[];
}
