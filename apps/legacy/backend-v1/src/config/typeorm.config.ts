import type { TypeOrmModuleOptions } from '@nestjs/typeorm'
import { ConfigService } from '@nestjs/config';
import { join } from 'path';

export const typeOrmConfig = ( configService: ConfigService ) : TypeOrmModuleOptions => {
    
    const useSSL = configService.get<string>('DB_SSL') === 'true';

    return { 
        type: 'postgres',
        host: configService.get('DATABASE_HOST'),
        port: configService.get('DATABASE_PORT'),
        username: configService.get('DATABASE_USER'),
        password: configService.get('DATABASE_PASS'),
        database: configService.get('DATABASE_NAME'),
        ssl: useSSL,
        extra: {
            ssl: useSSL ? { rejectUnauthorized: false } : null,
        },
        logging: false,
        entities: [join(__dirname + '../../**/*.entity.{js,ts}')],
        synchronize: false
    }

}


