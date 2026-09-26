import { Complemento } from "./complemento.interface";
import { Factura } from "./factura.interface";
import { SatFormaPago } from "./sat-forma-pago.interface";

export interface Pago {

  id: string;
  numeroParcialidad: number;
  saldoAnterior: number;
  monto: number;
  saldoInsoluto: number;

  fechaEmision: Date;
  factura: Factura;
  formaPagoClave: SatFormaPago;

  complemento: Complemento;



}
