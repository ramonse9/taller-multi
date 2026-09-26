import { ConfigService } from '@nestjs/config';
import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { Company } from '../companies/entities/company.entity';
import { PlatformUser } from '../platform-users/entities/platform-user.entity';

export const PUBLIC_ENTITIES = [Company, PlatformUser];

export function createDatabaseOptions(config: ConfigService): TypeOrmModuleOptions {
  return {
    type: 'postgres',
    url: config.getOrThrow<string>('DATABASE_URL'),
    ssl: config.get<boolean>('DATABASE_SSL') ? { rejectUnauthorized: true } : false,
    entities: PUBLIC_ENTITIES,
    synchronize: false,
    migrationsRun: false,
    logging: config.get<string>('NODE_ENV') === 'development' ? ['error', 'warn'] : ['error'],
    extra: { max: 20, application_name: 'taller-api' },
  };
}
