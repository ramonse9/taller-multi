import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AllowedOriginGuard } from './allowed-origin.guard';

function contextWithHeaders(headers: { origin?: string; referer?: string } = {}): ExecutionContext {
  return {
    switchToHttp: () => ({
      getRequest: () => ({ headers }),
    }),
  } as unknown as ExecutionContext;
}

describe('AllowedOriginGuard', () => {
  const permissiveGuard = new AllowedOriginGuard(
    new ConfigService({
      CORS_ORIGINS: 'https://app.multiservicios247.com,http://localhost:4200',
      AUTH_REQUIRE_TRUSTED_ORIGIN: false,
    }),
  );
  const productionGuard = new AllowedOriginGuard(
    new ConfigService({
      CORS_ORIGINS: 'https://app.multiservicios247.com',
      AUTH_REQUIRE_TRUSTED_ORIGIN: true,
    }),
  );

  it('acepta los orígenes configurados y permite clientes sin Origin sólo cuando se configura', () => {
    expect(
      permissiveGuard.canActivate(
        contextWithHeaders({ origin: 'https://app.multiservicios247.com' }),
      ),
    ).toBe(true);
    expect(permissiveGuard.canActivate(contextWithHeaders())).toBe(true);
  });

  it('rechaza un origen diferente aunque comparta un nombre parecido', () => {
    expect(() =>
      productionGuard.canActivate(
        contextWithHeaders({ origin: 'https://app.multiservicios247.com.example' }),
      ),
    ).toThrow(ForbiddenException);
  });

  it('protege peticiones con cookie sin Origin y acepta un Referer confiable', () => {
    expect(() => productionGuard.canActivate(contextWithHeaders())).toThrow(ForbiddenException);
    expect(
      productionGuard.canActivate(
        contextWithHeaders({ referer: 'https://app.multiservicios247.com/login?expired=true' }),
      ),
    ).toBe(true);
  });
});
