import { PaginationResponse } from "@shared/interfaces/pagination.response";
import { SatUsoCFDI } from "./sat-uso-cfdi.interface";

export interface SatUsosCFDIsResponse extends PaginationResponse{
  satUsosCFDIs: SatUsoCFDI[];
}
