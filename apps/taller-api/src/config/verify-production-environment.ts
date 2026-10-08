import { config as loadEnvironmentFile } from 'dotenv';
import { validateEnvironment } from './environment';

const environmentFile = process.env.TALLER_ENV_FILE?.trim();
if (environmentFile) {
  loadEnvironmentFile({ path: environmentFile, override: true, quiet: true });
}

function verifyProductionEnvironment(): void {
  const requiredVariables = [
    'NODE_ENV',
    'PORT',
    'DATABASE_URL',
    'DATABASE_SSL',
    'CORS_ORIGINS',
    'JWT_ACCESS_SECRET',
    'JWT_REFRESH_SECRET',
    'JWT_ISSUER',
    'JWT_AUDIENCE',
    'JWT_ACCESS_EXPIRES_IN',
    'JWT_REFRESH_EXPIRES_IN',
    'AUTH_REFRESH_COOKIE_NAME',
    'AUTH_REFRESH_COOKIE_SECURE',
    'AUTH_REFRESH_COOKIE_SAME_SITE',
    'AUTH_REFRESH_COOKIE_PATH',
    'AUTH_REQUIRE_TRUSTED_ORIGIN',
    'RATE_LIMIT_TTL_MS',
    'RATE_LIMIT_MAX',
    'SENSITIVE_RATE_LIMIT_TTL_MS',
    'SENSITIVE_RATE_LIMIT_MAX',
    'TRUST_PROXY_HOPS',
    'BOOTSTRAP_ADMIN_EMAIL',
    'BOOTSTRAP_ADMIN_PASSWORD',
  ];
  const missing = requiredVariables.filter(
    (name) => typeof process.env[name] !== 'string' || process.env[name]?.trim() === '',
  );
  if (missing.length > 0) {
    throw new Error(`Missing production environment variables: ${missing.join(', ')}`);
  }

  const validated = validateEnvironment(process.env);
  if (validated.NODE_ENV !== 'production') {
    throw new Error('NODE_ENV must be production');
  }
  const deprecated = ['JWT_SECRET', 'JWT_EXPIRES_IN'].filter(
    (name) => typeof process.env[name] === 'string' && process.env[name] !== '',
  );
  process.stdout.write('Production environment validation passed.\n');
  if (deprecated.length > 0) {
    process.stdout.write(
      `Deprecated variables still present for transition: ${deprecated.join(', ')}.\n`,
    );
  }
}

try {
  verifyProductionEnvironment();
} catch (error: unknown) {
  process.stderr.write(
    `${error instanceof Error ? error.message : 'Production environment validation failed'}\n`,
  );
  process.exitCode = 1;
}
