import { applyDecorators, UseGuards } from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";
import { RoleProtected } from "./role-protected.decorator";
import { EnumRole } from './../../commom/enums/general.enum';
import { UserRoleGuard } from "../guards/user-role.guard";
import { ApiBearerAuth } from "@nestjs/swagger";

export function Auth(role: EnumRole){

    return applyDecorators(
        ApiBearerAuth('JWT-auth'),
        RoleProtected(role),
        UseGuards( AuthGuard('jwt'), UserRoleGuard )
    )

}