import { PaginationResponse } from "@shared/interfaces/pagination.response";
import { SatRegimenFiscal } from "./sat-regimen-fiscal.interface";

export interface SatRegimenesFiscalesResponse extends PaginationResponse{
  satRegimenesFiscales: SatRegimenFiscal[]
}
