import { EnumMenuOption, EnumRole } from "@shared/enums/general-estatus.enum";

export interface MenuItem {
  label: string;
  icon?: string;
  menuOption?: EnumMenuOption;
  path?: string;
  minRole: EnumRole;
  moduleKey?: string;
  children?: MenuItem[];
}
