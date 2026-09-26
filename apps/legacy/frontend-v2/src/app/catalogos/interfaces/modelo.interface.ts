import { Marca } from './marca.interface';

export interface Modelo {
  id:         string;
  nombre:     string;
  marca:      Marca;
  createdAt:  string;
}
