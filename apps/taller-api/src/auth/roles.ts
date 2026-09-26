import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  SetMetadata,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthGuard } from '@nestjs/passport';
import { isObservable, lastValueFrom } from 'rxjs';
import { PlatformRole } from '../platform-users/entities/platform-user.entity';
import { AuthenticatedUser } from '../common/types/authenticated-user';

export const ROLES_KEY = 'roles';
export const ALLOW_PENDING_PASSWORD_CHANGE_KEY = 'allowPendingPasswordChange';
export const Roles = (...roles: PlatformRole[]) => SetMetadata(ROLES_KEY, roles);
export const AllowPendingPasswordChange = () =>
  SetMetadata(ALLOW_PENDING_PASSWORD_CHANGE_KEY, true);

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor(private readonly reflector: Reflector) {
    super();
  }

  override async canActivate(context: ExecutionContext): Promise<boolean> {
    const result = super.canActivate(context);
    const authenticated = isObservable(result) ? await lastValueFrom(result) : await result;
    if (!authenticated) return false;
    const allowPending = this.reflector.getAllAndOverride<boolean>(
      ALLOW_PENDING_PASSWORD_CHANGE_KEY,
      [context.getHandler(), context.getClass()],
    );
    const request = context.switchToHttp().getRequest<{ user: AuthenticatedUser }>();
    if (request.user.mustChangePassword && !allowPending) {
      throw new ForbiddenException('Debes cambiar tu contraseña temporal antes de continuar');
    }
    return true;
  }
}

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}
  canActivate(context: ExecutionContext): boolean {
    const allowed = this.reflector.getAllAndOverride<PlatformRole[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!allowed?.length) return true;
    const request = context.switchToHttp().getRequest<{ user: AuthenticatedUser }>();
    if (!allowed.includes(request.user.role))
      throw new ForbiddenException('Permisos insuficientes');
    return true;
  }
}
