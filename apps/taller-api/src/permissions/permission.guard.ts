import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  SetMetadata,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthenticatedUser } from '../common/types/authenticated-user';
import { PlatformRole } from '../platform-users/entities/platform-user.entity';
import { PermissionCode } from './permission.types';

export const REQUIRED_PERMISSIONS_KEY = 'required_permissions';
export const REQUIRED_ANY_PERMISSIONS_KEY = 'required_any_permissions';
export const RequiresPermissions = (...permissions: PermissionCode[]) =>
  SetMetadata(REQUIRED_PERMISSIONS_KEY, permissions);
export const RequiresAnyPermission = (...permissions: PermissionCode[]) =>
  SetMetadata(REQUIRED_ANY_PERMISSIONS_KEY, permissions);

@Injectable()
export class PermissionGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const targets = [context.getHandler(), context.getClass()];
    const required = this.reflector.getAllAndOverride<PermissionCode[]>(
      REQUIRED_PERMISSIONS_KEY,
      targets,
    );
    const requiredAny = this.reflector.getAllAndOverride<PermissionCode[]>(
      REQUIRED_ANY_PERMISSIONS_KEY,
      targets,
    );
    if (!required?.length && !requiredAny?.length) return true;
    const request = context.switchToHttp().getRequest<{ user?: AuthenticatedUser }>();
    const user = request.user;
    if (!user) throw new ForbiddenException('Sesión sin contexto de permisos');
    if (user.role === PlatformRole.PlatformAdmin || user.role === PlatformRole.CompanyAdmin) {
      return true;
    }
    const granted = new Set(user.permissions);
    const missing = (required ?? []).filter((permission) => !granted.has(permission));
    if (missing.length > 0) {
      throw new ForbiddenException(`Permiso requerido: ${missing.join(', ')}`);
    }
    if (requiredAny?.length && !requiredAny.some((permission) => granted.has(permission))) {
      throw new ForbiddenException(
        `Se requiere al menos uno de estos permisos: ${requiredAny.join(', ')}`,
      );
    }
    return true;
  }
}
