import { EnumNominaMovimientoTipo } from "@shared/enums/general-estatus.enum";

export interface NominaMovimientoDetalle {
  id:         string;
  concepto:   string;
  monto:      string;
  tipo:       EnumNominaMovimientoTipo;
}