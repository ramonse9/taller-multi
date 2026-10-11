import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../auth/auth.module';
import { PlatformUser } from './entities/platform-user.entity';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { PasswordResetService } from './password-reset.service';
import { PlatformCompanyUsersController } from './platform-company-users.controller';

@Module({
  imports: [TypeOrmModule.forFeature([PlatformUser]), AuthModule],
  controllers: [UsersController, PlatformCompanyUsersController],
  providers: [UsersService, PasswordResetService],
  exports: [TypeOrmModule, PasswordResetService],
})
export class PlatformUsersModule {}
