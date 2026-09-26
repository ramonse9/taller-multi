import { Modelo } from "./modelo.interface";

export interface Marca {
  id:         string;
  nombre:     string;
  modelos?:   Modelo[]
  createdAt:  string;
}
