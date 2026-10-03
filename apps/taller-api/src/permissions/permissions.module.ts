import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { PermissionsController } from './permissions.controller';

@Module({
  imports: [AuthModule],
  controllers: [PermissionsController],
})
export class PermissionsModule {}
