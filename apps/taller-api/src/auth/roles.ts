import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  SetMetadata,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { AuthGuard } from '@nestjs/passport';
import { isObservable, lastValueFrom } from 'rxjs';
import { PlatformRole } from '../platform-users/entities/platform-user.entity';
import { AuthenticatedUser } from '../common/types/authenticated-user';

export const ROLES_KEY = 'roles';
export const ALLOW_PENDING_PASSWORD_CHANGE_KEY = 'allowPendingPasswordChange';
export const SESSION_TOKEN_HEADER = 'X-Session-Token';
export const Roles = (...roles: PlatformRole[]) => SetMetadata(ROLES_KEY, roles);
export const AllowPendingPasswordChange = () =>
  SetMetadata(ALLOW_PENDING_PASSWORD_CHANGE_KEY, true);

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor(
    private readonly reflector: Reflector,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
  ) {
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
    const refreshedToken = await this.jwt.signAsync(
      { sub: request.user.id, jti: request.user.sessionId },
      {
        secret: this.config.getOrThrow<string>('JWT_SECRET'),
        issuer: this.config.getOrThrow<string>('JWT_ISSUER'),
        audience: this.config.getOrThrow<string>('JWT_AUDIENCE'),
        expiresIn: this.config.getOrThrow<string>('JWT_EXPIRES_IN') as never,
      },
    );
    context
      .switchToHttp()
      .getResponse<{ setHeader(name: string, value: string): void }>()
      .setHeader(SESSION_TOKEN_HEADER, refreshedToken);
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
