import { Global, Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { createDatabaseOptions } from './database-options';
import { TenantMigrator } from './tenant/tenant-migrator';

@Global()
@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => createDatabaseOptions(config),
    }),
  ],
  providers: [TenantMigrator],
  exports: [TypeOrmModule, TenantMigrator],
})
export class DatabaseModule {}
