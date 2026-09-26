import { EnumTipoPagoGasto } from "@shared/enums/general-estatus.enum";
import { Gasto } from "./gasto.interface";

export interface GastoMovimiento {
  id:                   string;
  monto:                string;
  fecha:                string;
  tipoPago:             EnumTipoPagoGasto;
  referencia:           string;
  gasto:                Gasto;
  createdAt:            string;
  updatedAt:            string;
}
