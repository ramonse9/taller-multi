import { Global, Module } from '@nestjs/common';
import { TenantSessionService } from './tenant-session.service';
import { AuthModule } from '../auth/auth.module';
import { ClientsController } from './clients/clients.controller';
import { ClientsService } from './clients/clients.service';

@Global()
@Module({
  imports: [AuthModule],
  controllers: [ClientsController],
  providers: [TenantSessionService, ClientsService],
  exports: [TenantSessionService],
})
export class TenantModule {}
