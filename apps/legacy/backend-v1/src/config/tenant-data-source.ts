import { ConfigService } from '@nestjs/config';
import { DataSource, DataSourceOptions } from 'typeorm';
import { join } from 'path';

export const createTenantDataSource = async (
  configService: ConfigService,
  schema: string
): Promise<DataSource> => {

  const useSSL = configService.get<string>('DB_SSL') === 'true'

  const options: DataSourceOptions = {
    type: 'postgres',
    host: configService.get('DATABASE_HOST'),
    port: configService.get<number>('DATABASE_PORT'),
    username: configService.get('DATABASE_USER'),
    password: configService.get('DATABASE_PASS'),
    database: configService.get('DATABASE_NAME'),
    schema: schema,
    ssl: useSSL,
    extra: {
      ssl: useSSL ? { rejectUnauthorized: false } : null,
    },
    logging: false,
    //synchronize: true, // Solo en desarrollo
    entities: [join(__dirname, '../../**/*.entity.{ts,js}')],
  };

  const dataSource = new DataSource(options);
  return dataSource.initialize();
};
