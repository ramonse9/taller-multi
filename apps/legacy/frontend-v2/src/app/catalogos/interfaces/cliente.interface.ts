import { SatRegimenFiscal } from '../../facturas/interfaces/sat-regimen-fiscal.interface';
import { SatUsoCFDI } from '../../facturas/interfaces/sat-uso-cfdi.interface';

export interface Cliente {
  id:                   string;
  nombre:               string;
  telefono:             string;
  email:                string;
  rfc:                  string;
  razonSocial:          string;
  codigoPostal:         string;
  satRegimenFiscal:     SatRegimenFiscal | null;
  satUsoCFDI:           SatUsoCFDI | null
  createdAt:            string;
  updatedAt:            string;
}
