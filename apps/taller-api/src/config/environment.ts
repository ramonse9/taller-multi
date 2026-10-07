import { plainToInstance, Transform } from 'class-transformer';
import {
  IsBoolean,
  IsEmail,
  IsEnum,
  IsInt,
  IsIn,
  IsOptional,
  IsString,
  IsUrl,
  Length,
  Matches,
  Max,
  Min,
  validateSync,
} from 'class-validator';

enum Environment {
  Development = 'development',
  Test = 'test',
  Production = 'production',
}

class EnvironmentVariables {
  @IsEnum(Environment)
  NODE_ENV: Environment = Environment.Development;

  @Transform(({ value }) => Number(value))
  @IsInt()
  @Min(1)
  @Max(65535)
  PORT = 3000;

  @IsUrl({ protocols: ['postgres', 'postgresql'], require_tld: false })
  DATABASE_URL!: string;

  @Transform(({ value }) => value === 'true')
  @IsBoolean()
  DATABASE_SSL = false;

  @IsString()
  CORS_ORIGINS!: string;

  @IsString()
  @Length(32, 512)
  JWT_ACCESS_SECRET!: string;

  @IsString()
  @Length(32, 512)
  JWT_REFRESH_SECRET!: string;

  @IsString()
  @Length(3, 100)
  JWT_ISSUER!: string;

  @IsString()
  @Length(3, 100)
  JWT_AUDIENCE!: string;

  @IsString()
  @Matches(/^\d+[smhd]$/)
  JWT_ACCESS_EXPIRES_IN = '15m';

  @IsString()
  @Matches(/^\d+[smhd]$/)
  JWT_REFRESH_EXPIRES_IN = '14d';

  @IsString()
  @Matches(/^[A-Za-z0-9_-]+$/)
  AUTH_REFRESH_COOKIE_NAME = 'taller_refresh_token';

  @Transform(({ value }) => value === 'true')
  @IsBoolean()
  AUTH_REFRESH_COOKIE_SECURE = false;

  @IsString()
  @IsIn(['strict', 'lax', 'none'])
  AUTH_REFRESH_COOKIE_SAME_SITE: 'strict' | 'lax' | 'none' = 'lax';

  @IsString()
  @Matches(/^\//)
  AUTH_REFRESH_COOKIE_PATH = '/api/auth';

  @IsOptional()
  @Transform(({ value }) => {
    const input: unknown = value;
    return input === '' ? undefined : input;
  })
  @IsString()
  AUTH_REFRESH_COOKIE_DOMAIN?: string;

  @Transform(({ value }) => value === 'true')
  @IsBoolean()
  AUTH_REQUIRE_TRUSTED_ORIGIN = false;

  @Transform(({ value }) => Number(value))
  @IsInt()
  @Min(1000)
  RATE_LIMIT_TTL_MS = 60000;

  @Transform(({ value }) => Number(value))
  @IsInt()
  @Min(1)
  RATE_LIMIT_MAX = 100;

  @Transform(({ value }) => Number(value))
  @IsInt()
  @Min(1000)
  SENSITIVE_RATE_LIMIT_TTL_MS = 60000;

  @Transform(({ value }) => Number(value))
  @IsInt()
  @Min(1)
  SENSITIVE_RATE_LIMIT_MAX = 3;

  @Transform(({ value }) => Number(value))
  @IsInt()
  @Min(0)
  @Max(10)
  TRUST_PROXY_HOPS = 0;

  @IsOptional()
  @Transform(({ value }) => {
    const input: unknown = value;
    return input === '' ? undefined : input;
  })
  @IsEmail()
  BOOTSTRAP_ADMIN_EMAIL?: string;

  @IsOptional()
  @Transform(({ value }) => {
    const input: unknown = value;
    return input === '' ? undefined : input;
  })
  @IsString()
  @Length(12, 128)
  BOOTSTRAP_ADMIN_PASSWORD?: string;
}

export function validateEnvironment(config: Record<string, unknown>): Record<string, unknown> {
  const validated = plainToInstance(EnvironmentVariables, config, {
    enableImplicitConversion: false,
    exposeDefaultValues: true,
  });
  const errors = validateSync(validated, { skipMissingProperties: false });
  if (errors.length > 0) {
    throw new Error(
      `Invalid environment configuration: ${errors.map((e) => Object.values(e.constraints ?? {}).join(', ')).join('; ')}`,
    );
  }

  if (validated.JWT_ACCESS_SECRET === validated.JWT_REFRESH_SECRET) {
    throw new Error('Invalid environment configuration: JWT access and refresh secrets must differ');
  }
  if (validated.NODE_ENV === Environment.Production && !validated.AUTH_REFRESH_COOKIE_SECURE) {
    throw new Error(
      'Invalid environment configuration: AUTH_REFRESH_COOKIE_SECURE must be true in production',
    );
  }
  if (validated.NODE_ENV === Environment.Production && !validated.AUTH_REQUIRE_TRUSTED_ORIGIN) {
    throw new Error(
      'Invalid environment configuration: AUTH_REQUIRE_TRUSTED_ORIGIN must be true in production',
    );
  }
  if (
    validated.AUTH_REFRESH_COOKIE_SAME_SITE === 'none' &&
    !validated.AUTH_REFRESH_COOKIE_SECURE
  ) {
    throw new Error(
      'Invalid environment configuration: SameSite=None requires a secure refresh cookie',
    );
  }
  if (
    validated.AUTH_REFRESH_COOKIE_NAME.startsWith('__Secure-') &&
    !validated.AUTH_REFRESH_COOKIE_SECURE
  ) {
    throw new Error(
      'Invalid environment configuration: __Secure- cookies require AUTH_REFRESH_COOKIE_SECURE=true',
    );
  }
  if (validated.AUTH_REFRESH_COOKIE_NAME.startsWith('__Host-')) {
    if (
      !validated.AUTH_REFRESH_COOKIE_SECURE ||
      validated.AUTH_REFRESH_COOKIE_DOMAIN ||
      validated.AUTH_REFRESH_COOKIE_PATH !== '/'
    ) {
      throw new Error(
        'Invalid environment configuration: __Host- cookies require Secure, Path=/ and no Domain',
      );
    }
  }
  return validated as unknown as Record<string, unknown>;
}
