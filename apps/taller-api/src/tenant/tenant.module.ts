import { Global, Module } from '@nestjs/common';
import { TenantSessionService } from './tenant-session.service';
import { AuthModule } from '../auth/auth.module';
import { ClientsController } from './clients/clients.controller';
import { ClientsService } from './clients/clients.service';
import { VehicleHistoryController, VehiclesController } from './vehicles/vehicles.controller';
import { VehiclesService } from './vehicles/vehicles.service';

@Global()
@Module({
  imports: [AuthModule],
  controllers: [ClientsController, VehiclesController, VehicleHistoryController],
  providers: [TenantSessionService, ClientsService, VehiclesService],
  exports: [TenantSessionService],
})
export class TenantModule {}
