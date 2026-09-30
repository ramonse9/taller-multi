import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { AuthModule } from './auth/auth.module';
import { CatalogsModule } from './catalogs/catalogs.module';
import { CommonModule } from './common/common.module';
import { CompaniesModule } from './companies/companies.module';
import { ConfigModule } from './config/config.module';
import { DatabaseModule } from './database/database.module';
import { HealthModule } from './health/health.module';
import { PlatformUsersModule } from './platform-users/platform-users.module';
import { TenantModule } from './tenant/tenant.module';
import { VehicleCatalogModule } from './vehicle-catalog/vehicle-catalog.module';
import { SubscriptionsModule } from './subscriptions/subscriptions.module';

@Module({
  imports: [
    ConfigModule,
    ThrottlerModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => [
        {
          ttl: config.getOrThrow<number>('RATE_LIMIT_TTL_MS'),
          limit: config.getOrThrow<number>('RATE_LIMIT_MAX'),
        },
      ],
    }),
    DatabaseModule,
    CommonModule,
    PlatformUsersModule,
    AuthModule,
    CompaniesModule,
    TenantModule,
    CatalogsModule,
    VehicleCatalogModule,
    SubscriptionsModule,
    HealthModule,
  ],
  providers: [{ provide: APP_GUARD, useClass: ThrottlerGuard }],
})
export class AppModule {}
