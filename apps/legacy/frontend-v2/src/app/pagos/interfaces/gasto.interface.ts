import { GastoCategoria } from "./gasto-categoria.interface";

export interface Gasto {
  id:                   string;
  nombre:               string;
  recurrente:           boolean;
  activo:               boolean;
  gastoCategoria:       GastoCategoria;
  createdAt:            string;
  updatedAt:            string;
}
