import { EnumRole } from "@shared/enums/general-estatus.enum";
import { EnumColor } from '../enums/general-estatus.enum';

export interface AccesoRapidoItem{
  label: string;
  icon: string;
  color: EnumColor;
  path: string;
  minRole: EnumRole;
}
