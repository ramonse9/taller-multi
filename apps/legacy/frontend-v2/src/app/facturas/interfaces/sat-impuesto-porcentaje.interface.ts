import { SatImpuesto } from "./sat-impuesto.interface";

export interface SatImpuestoPorcentaje{
  clave:                                      string;
  descripcion:                                string;
  tasa:                                       number;
  tipo:                                       string;
  operacion:                                  string;
  satImpuesto:                                SatImpuesto;
}
