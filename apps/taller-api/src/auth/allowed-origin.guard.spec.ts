import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AllowedOriginGuard } from './allowed-origin.guard';

function contextWithOrigin(origin?: string): ExecutionContext {
  return {
    switchToHttp: () => ({
      getRequest: () => ({ headers: { ...(origin ? { origin } : {}) } }),
    }),
  } as unknown as ExecutionContext;
}

describe('AllowedOriginGuard', () => {
  const guard = new AllowedOriginGuard(
    new ConfigService({
      CORS_ORIGINS: 'https://app.multiservicios247.com,http://localhost:4200',
    }),
  );

  it('acepta los orígenes configurados y clientes sin Origin', () => {
    expect(guard.canActivate(contextWithOrigin('https://app.multiservicios247.com'))).toBe(true);
    expect(guard.canActivate(contextWithOrigin())).toBe(true);
  });

  it('rechaza un origen diferente aunque comparta un nombre parecido', () => {
    expect(() =>
      guard.canActivate(contextWithOrigin('https://app.multiservicios247.com.example')),
    ).toThrow(ForbiddenException);
  });
});
