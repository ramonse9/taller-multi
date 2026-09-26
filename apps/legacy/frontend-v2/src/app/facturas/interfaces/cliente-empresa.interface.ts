import { SatRegimenFiscal } from "@facturas/interfaces/sat-regimen-fiscal.interface";
import { SatUsoCFDI } from "@facturas/interfaces/sat-uso-cfdi.interface";

export interface ClienteEmpresa {
  id:                   string;
  rfc:                  string;
  email:                string;
  razonSocial:          string;
  codigoPostal:         string;
  satRegimenFiscal:     SatRegimenFiscal | null;
  satUsoCFDI:           SatUsoCFDI | null;
}
