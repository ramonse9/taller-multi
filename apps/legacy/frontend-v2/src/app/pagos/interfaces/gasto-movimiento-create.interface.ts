import { EnumTipoPagoGasto } from "@shared/enums/general-estatus.enum";

export interface GastoMovimientoCreate {
  id:                   string;
  monto:                string;
  fecha:                string;
  tipoPago:             EnumTipoPagoGasto;
  referencia:           string;
  id_gasto:             string;
}
