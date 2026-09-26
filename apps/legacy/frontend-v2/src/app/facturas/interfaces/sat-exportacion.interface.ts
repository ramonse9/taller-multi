export interface SatExportacionResponse {
  count: number;
  pages: number;
  satExportacion: SatExportacion[];
 }

 export interface SatExportacion{
  clave:                                      string;
  descripcion:                                string;
 }

