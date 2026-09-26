import { Modelo } from "@catalogos/interfaces/modelo.interface";

export interface Vehiculo {
  id:            string;
  anio:          number;
  color:         string;
  placa:         string;
  numeroSerie:   string;
  createdAt:     string;
  updatedAt:     string;
  modelo:        Modelo;
}
