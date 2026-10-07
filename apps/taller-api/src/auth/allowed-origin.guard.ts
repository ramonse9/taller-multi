import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AllowedOriginGuard implements CanActivate {
  private readonly allowedOrigins: Set<string>;

  constructor(config: ConfigService) {
    this.allowedOrigins = new Set(
      config
        .getOrThrow<string>('CORS_ORIGINS')
        .split(',')
        .map((origin) => origin.trim())
        .filter(Boolean),
    );
  }

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<{ headers: { origin?: string } }>();
    const origin = request.headers.origin;
    if (!origin) return true;
    if (!this.allowedOrigins.has(origin)) throw new ForbiddenException('Origen no permitido');
    return true;
  }
}
