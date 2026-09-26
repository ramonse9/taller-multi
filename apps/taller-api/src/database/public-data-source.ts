import 'dotenv/config';
import { DataSource } from 'typeorm';
import { PUBLIC_ENTITIES } from './database-options';
import { PublicBaseline1700000000000 } from './migrations/public/1700000000000-public-baseline';
import { GeneratedSchemasAndTemporaryPasswords1700000001000 } from './migrations/public/1700000001000-generated-schemas-and-temporary-passwords';

export default new DataSource({
  type: 'postgres',
  url: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_SSL === 'true' ? { rejectUnauthorized: true } : false,
  entities: PUBLIC_ENTITIES,
  migrations: [PublicBaseline1700000000000, GeneratedSchemasAndTemporaryPasswords1700000001000],
  migrationsTableName: 'public_schema_migrations',
  synchronize: false,
});
