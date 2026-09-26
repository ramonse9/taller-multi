import { EnumRole } from "@shared/enums/general-estatus.enum";

export const ROLE_HIERARCHY: Record<EnumRole, number> = {
  [EnumRole.CAPTURISTA]: 1,
  [EnumRole.ADMIN]: 2,
  [EnumRole.SUPER]: 3
}
