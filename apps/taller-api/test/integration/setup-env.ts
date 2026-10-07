import { config } from 'dotenv';

config({ path: '.env', quiet: true });
config({ path: '.env.test.local', override: true, quiet: true });

const testDatabaseUrl = process.env.TEST_DATABASE_URL;
if (!testDatabaseUrl) {
  throw new Error('TEST_DATABASE_URL is required. Copy .env.test.example to .env.test.local.');
}

const databaseName = new URL(testDatabaseUrl).pathname.slice(1);
if (!databaseName.endsWith('_test')) {
  throw new Error('Integration tests only run against a database ending in _test.');
}

process.env.DATABASE_URL = testDatabaseUrl;
process.env.DATABASE_SSL = 'false';
process.env.NODE_ENV = 'test';
process.env.CORS_ORIGINS = 'http://127.0.0.1:4200';
process.env.JWT_ACCESS_SECRET = 'integration-access-secret-at-least-32-characters';
process.env.JWT_REFRESH_SECRET = 'integration-refresh-secret-at-least-32-characters';
process.env.JWT_ISSUER = 'taller-api-integration';
process.env.JWT_AUDIENCE = 'taller-integration-clients';
process.env.JWT_ACCESS_EXPIRES_IN = '15m';
process.env.JWT_REFRESH_EXPIRES_IN = '14d';
process.env.AUTH_REFRESH_COOKIE_NAME = 'taller_refresh_token';
process.env.AUTH_REFRESH_COOKIE_SECURE = 'false';
process.env.AUTH_REFRESH_COOKIE_SAME_SITE = 'lax';
process.env.AUTH_REFRESH_COOKIE_PATH = '/api/auth';
process.env.AUTH_REQUIRE_TRUSTED_ORIGIN = 'true';
process.env.RATE_LIMIT_TTL_MS = '60000';
process.env.RATE_LIMIT_MAX = '1000';
process.env.SENSITIVE_RATE_LIMIT_TTL_MS = '60000';
process.env.SENSITIVE_RATE_LIMIT_MAX = '1000';
process.env.TRUST_PROXY_HOPS = '0';
