import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';

import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { User } from './entities/user.entity';
import { JwtStrategy } from './strategies/jwt.strategy';
import { TenantModule } from '../tenant/tenant.module';

@Module({
  imports: [
    ConfigModule,
    TypeOrmModule.forFeature([ User ]),
    PassportModule.register({ }),
    JwtModule.register({
      signOptions: {
        issuer: 'multiservicios247-api',
        audience: 'multiservicios247-web',
      },
    }),
    TenantModule
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy],
  exports: [ TypeOrmModule, JwtStrategy, PassportModule, JwtModule]
})
export class AuthModule {}
