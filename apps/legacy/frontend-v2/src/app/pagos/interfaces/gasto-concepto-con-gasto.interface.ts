import { GastoCategoria } from "./gasto-categoria.interface";
import { GastoMovimiento } from "./gasto-movimiento.interface";

export interface GastoConMovimiento {
  id:                   string;
  nombre:               string;
  recurrente:           boolean;
  activo:               boolean;
  gastoCategoria:       GastoCategoria;
  gastosMovimientos:    GastoMovimiento[];
  totalGastado:         string;
  createdAt:            string;
  updatedAt:            string;
}
