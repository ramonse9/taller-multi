import { SatRegimenFiscal } from "@facturas/interfaces/sat-regimen-fiscal.interface";

export interface Emisor {
  id:                   string;
  /*fechaEmision:       Date;
  formaPago:            string;
  condicionesPago:      string;
  metodoPago:           string;
  moneda:               string;
  lugarExpedicion:      string;
  observaciones:        string;
  tipoComprobante:      string;
  subtotal:             number;
  total:                number;
  exportacion:          string;
  */
  rfc:                  string;
  razonSocial:          string;
  satRegimenFiscal:     SatRegimenFiscal;
  codigoPostal:         string;
  validTo:              Date;
  //nombre:             string;
  //paterno:            string;
  //materno:            string;
  //telefono:           string;
  //email:              string;
  createdAt:            Date;
  updatedAt:            Date;
}
