import { ROLE_HIERARCHY } from "@shared/constants/role-hierarchy";
import { EnumRole } from "@shared/enums/general-estatus.enum";

export function hasRoleOrHigher(
  userRole: EnumRole,
  requiredRole: EnumRole
):boolean{

  return ROLE_HIERARCHY[userRole] >= ROLE_HIERARCHY[requiredRole]

}
