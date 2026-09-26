import { PaginationResponse } from "@shared/interfaces/pagination.response";
import { GastoConMovimientos } from "./gasto-concepto-con-gasto.interface";

export interface GastoConceptoConMovimientosResponse extends PaginationResponse {
  gastosConceptosConGastos: GastoConMovimientos[];
}
