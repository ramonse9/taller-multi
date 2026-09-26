import { EnumNominaPeriodicidad } from "@shared/enums/general-estatus.enum";

export interface NominaPeriodo {
  id:                   string;
  anio:                 string;
  periodicidad:         EnumNominaPeriodicidad;
  nombre:               string;
  fechaInicio:          string;
  fechaFin:             string;
}
