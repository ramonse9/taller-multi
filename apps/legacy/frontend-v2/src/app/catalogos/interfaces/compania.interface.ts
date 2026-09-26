import { SatTipoPersona } from "@facturas/interfaces/sat-tipo-persona.interface";

export interface Compania{
  id: string;
  nombre: string
  moduloInventario: boolean;
  moduloFacturacion: boolean;
  moduloGastos: boolean;
  moduloNomina: boolean;
  tipoSatTipoPersona: SatTipoPersona
  companiaInfo?: CompaniaInfo;

}

export interface CompaniaInfo{
  id: string;
  telefono: string;
  calle: string;
  numeroLocal: string;
  colonia: string;
  ciudad: string;
  codigoPostal: string;
  correoElectronico: string;
  compania: Compania;
}
