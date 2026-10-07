import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AllowedOriginGuard implements CanActivate {
  private readonly allowedOrigins: Set<string>;
  private readonly requireTrustedOrigin: boolean;

  constructor(config: ConfigService) {
    this.allowedOrigins = new Set(
      config
        .getOrThrow<string>('CORS_ORIGINS')
        .split(',')
        .map((origin) => origin.trim())
        .filter(Boolean),
    );
    this.requireTrustedOrigin = config.get<boolean>('AUTH_REQUIRE_TRUSTED_ORIGIN', false);
  }

  canActivate(context: ExecutionContext): boolean {
    const request = context
      .switchToHttp()
      .getRequest<{ headers: { origin?: string; referer?: string } }>();
    const origin = request.headers.origin ?? this.originFromReferer(request.headers.referer);
    if (!origin) {
      if (this.requireTrustedOrigin) {
        throw new ForbiddenException('Se requiere un origen permitido');
      }
      return true;
    }
    if (!this.allowedOrigins.has(origin)) throw new ForbiddenException('Origen no permitido');
    return true;
  }

  private originFromReferer(referer?: string): string | undefined {
    if (!referer) return undefined;
    try {
      return new URL(referer).origin;
    } catch {
      throw new ForbiddenException('Origen no permitido');
    }
  }
}
