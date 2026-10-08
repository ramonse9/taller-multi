import { validateEnvironment } from './environment';

function validEnvironment(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    NODE_ENV: 'development',
    PORT: '3000',
    DATABASE_URL: 'postgresql://user:password@127.0.0.1:5432/taller_multi_test',
    DATABASE_SSL: 'false',
    CORS_ORIGINS: 'http://localhost:4200',
    JWT_ACCESS_SECRET: 'access-secret-with-at-least-32-characters',
    JWT_REFRESH_SECRET: 'refresh-secret-with-at-least-32-characters',
    JWT_ISSUER: 'taller-api',
    JWT_AUDIENCE: 'taller-web',
    JWT_ACCESS_EXPIRES_IN: '15m',
    JWT_REFRESH_EXPIRES_IN: '14d',
    AUTH_REFRESH_COOKIE_NAME: 'taller_refresh_token',
    AUTH_REFRESH_COOKIE_SECURE: 'false',
    AUTH_REFRESH_COOKIE_SAME_SITE: 'lax',
    AUTH_REFRESH_COOKIE_PATH: '/api/auth',
    AUTH_REQUIRE_TRUSTED_ORIGIN: 'false',
    RATE_LIMIT_TTL_MS: '60000',
    RATE_LIMIT_MAX: '100',
    SENSITIVE_RATE_LIMIT_TTL_MS: '60000',
    SENSITIVE_RATE_LIMIT_MAX: '3',
    TRUST_PROXY_HOPS: '0',
    ...overrides,
  };
}

describe('validateEnvironment', () => {
  it('accepts separate access and refresh configuration in development', () => {
    const result = validateEnvironment(validEnvironment());

    expect(result.JWT_ACCESS_EXPIRES_IN).toBe('15m');
    expect(result.JWT_REFRESH_EXPIRES_IN).toBe('14d');
    expect(result.AUTH_REFRESH_COOKIE_SECURE).toBe(false);
  });

  it('requires different access and refresh secrets', () => {
    expect(() =>
      validateEnvironment(
        validEnvironment({
          JWT_ACCESS_SECRET: 'same-secret-with-at-least-32-characters',
          JWT_REFRESH_SECRET: 'same-secret-with-at-least-32-characters',
        }),
      ),
    ).toThrow('JWT access and refresh secrets must differ');
  });

  it('requires secure refresh cookies in production', () => {
    expect(() =>
      validateEnvironment(validEnvironment({ NODE_ENV: 'production' })),
    ).toThrow('AUTH_REFRESH_COOKIE_SECURE must be true in production');
  });

  it('accepts a host-only secure production cookie', () => {
    const result = validateEnvironment(
      validEnvironment({
        NODE_ENV: 'production',
        AUTH_REFRESH_COOKIE_NAME: '__Host-taller_refresh_token',
        AUTH_REFRESH_COOKIE_SECURE: 'true',
        AUTH_REFRESH_COOKIE_PATH: '/',
        AUTH_REQUIRE_TRUSTED_ORIGIN: 'true',
        CORS_ORIGINS: 'https://app.multiservicios247.com',
        TRUST_PROXY_HOPS: '1',
      }),
    );

    expect(result.AUTH_REFRESH_COOKIE_NAME).toBe('__Host-taller_refresh_token');
    expect(result.AUTH_REFRESH_COOKIE_SECURE).toBe(true);
  });

  it('requires trusted browser origins in production', () => {
    expect(() =>
      validateEnvironment(
        validEnvironment({
          NODE_ENV: 'production',
          AUTH_REFRESH_COOKIE_SECURE: 'true',
          CORS_ORIGINS: 'https://app.multiservicios247.com',
          TRUST_PROXY_HOPS: '1',
        }),
      ),
    ).toThrow('AUTH_REQUIRE_TRUSTED_ORIGIN must be true in production');
  });

  it('rejects non-HTTPS or non-origin CORS values in production', () => {
    expect(() =>
      validateEnvironment(
        validEnvironment({
          NODE_ENV: 'production',
          AUTH_REFRESH_COOKIE_SECURE: 'true',
          AUTH_REQUIRE_TRUSTED_ORIGIN: 'true',
          AUTH_REFRESH_COOKIE_NAME: '__Host-taller_refresh_token',
          AUTH_REFRESH_COOKIE_PATH: '/',
          TRUST_PROXY_HOPS: '1',
          CORS_ORIGINS: 'http://app.multiservicios247.com/path',
        }),
      ),
    ).toThrow('production CORS origin must be an exact HTTPS origin');
  });

  it('requires trusted proxy and the agreed sensitive rate limit in production', () => {
    const production = {
      NODE_ENV: 'production',
      AUTH_REFRESH_COOKIE_SECURE: 'true',
      AUTH_REQUIRE_TRUSTED_ORIGIN: 'true',
      AUTH_REFRESH_COOKIE_NAME: '__Host-taller_refresh_token',
      AUTH_REFRESH_COOKIE_PATH: '/',
      CORS_ORIGINS: 'https://app.multiservicios247.com',
    };
    expect(() => validateEnvironment(validEnvironment(production))).toThrow(
      'TRUST_PROXY_HOPS must be at least 1 in production',
    );
    expect(() =>
      validateEnvironment(
        validEnvironment({
          ...production,
          TRUST_PROXY_HOPS: '1',
          SENSITIVE_RATE_LIMIT_MAX: '4',
        }),
      ),
    ).toThrow('sensitive rate limiting must be 3 attempts per 60000 ms in production');
  });
});
