import 'dotenv/config';
import { DataSource } from 'typeorm';
import { PUBLIC_ENTITIES } from './database-options';
import { PublicBaseline1700000000000 } from './migrations/public/1700000000000-public-baseline';
import { GeneratedSchemasAndTemporaryPasswords1700000001000 } from './migrations/public/1700000001000-generated-schemas-and-temporary-passwords';
import { TenantLoginIdentities1700000002000 } from './migrations/public/1700000002000-tenant-identities-and-sessions';
import { AuthSessions1700000003000 } from './migrations/public/1700000003000-auth-sessions';

export default new DataSource({
  type: 'postgres',
  url: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_SSL === 'true' ? { rejectUnauthorized: true } : false,
  entities: PUBLIC_ENTITIES,
  migrations: [
    PublicBaseline1700000000000,
    GeneratedSchemasAndTemporaryPasswords1700000001000,
    TenantLoginIdentities1700000002000,
    AuthSessions1700000003000,
  ],
  migrationsTableName: 'public_schema_migrations',
  synchronize: false,
});
