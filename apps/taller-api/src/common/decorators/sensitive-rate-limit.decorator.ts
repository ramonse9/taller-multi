import { applyDecorators, ExecutionContext, SetMetadata } from '@nestjs/common';
import { ApiTooManyRequestsResponse } from '@nestjs/swagger';

export const SENSITIVE_RATE_LIMIT_KEY = 'taller:sensitive-rate-limit';

export function SensitiveRateLimit(): MethodDecorator {
  return applyDecorators(
    SetMetadata(SENSITIVE_RATE_LIMIT_KEY, true),
    ApiTooManyRequestsResponse({
      description: 'Se excedió el número de intentos permitidos. Intenta de nuevo más tarde.',
    }),
  );
}

export function shouldSkipSensitiveRateLimit(context: ExecutionContext): boolean {
  return Reflect.getMetadata(SENSITIVE_RATE_LIMIT_KEY, context.getHandler()) !== true;
}
