import { OrdenNotaImagen } from "./orden-nota-imagen.interface";

export interface OrdenNota {
  id:           number;
  id_orden:     string;
  nota:         string;
  estatus:      string;
  imagenes:     OrdenNotaImagen[];
  createdAt:    string;
}
