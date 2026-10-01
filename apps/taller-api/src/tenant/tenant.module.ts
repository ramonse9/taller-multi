import { Global, Module } from '@nestjs/common';
import { TenantSessionService } from './tenant-session.service';
import { AuthModule } from '../auth/auth.module';
import { ClientsController } from './clients/clients.controller';
import { ClientsService } from './clients/clients.service';
import { VehicleHistoryController, VehiclesController } from './vehicles/vehicles.controller';
import { VehiclesService } from './vehicles/vehicles.service';
import { OrdersController } from './orders/orders.controller';
import { OrdersService } from './orders/orders.service';
import { ConceptCatalogController } from './concept-catalog/concept-catalog.controller';
import { ConceptCatalogService } from './concept-catalog/concept-catalog.service';
import { InventoryController } from './inventory/inventory.controller';
import { InventoryService } from './inventory/inventory.service';
import { SuppliersController } from './suppliers/suppliers.controller';
import { SuppliersService } from './suppliers/suppliers.service';

@Global()
@Module({
  imports: [AuthModule],
  controllers: [
    ClientsController,
    VehiclesController,
    VehicleHistoryController,
    OrdersController,
    ConceptCatalogController,
    InventoryController,
    SuppliersController,
  ],
  providers: [
    TenantSessionService,
    ClientsService,
    VehiclesService,
    OrdersService,
    ConceptCatalogService,
    InventoryService,
    SuppliersService,
  ],
  exports: [TenantSessionService],
})
export class TenantModule {}
