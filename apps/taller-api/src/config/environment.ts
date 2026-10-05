import { plainToInstance, Transform } from 'class-transformer';
import {
  IsBoolean,
  IsEmail,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  IsUrl,
  Length,
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
  JWT_SECRET!: string;

  @IsString()
  @Length(3, 100)
  JWT_ISSUER!: string;

  @IsString()
  @Length(3, 100)
  JWT_AUDIENCE!: string;

  @IsString()
  JWT_EXPIRES_IN = '14d';

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
  return validated as unknown as Record<string, unknown>;
}
