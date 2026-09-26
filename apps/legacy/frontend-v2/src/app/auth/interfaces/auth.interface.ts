import { EnumRole } from './../../shared/enums/general-estatus.enum';
import { Compania } from "@catalogos/interfaces/compania.interface";
import { ZonaHoraria } from "@shared/interfaces/zona-horaria.interface";

export interface User {
  id:               number;
  email:            string;
  fullName:         string;
  isActive:         boolean;
  compania:         Compania;
  roles:            string[];
  role:             EnumRole;
  zonaHoraria:      ZonaHoraria;
}


