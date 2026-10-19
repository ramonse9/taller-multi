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
import { PurchasesController } from './purchases/purchases.controller';
import { PurchasesService } from './purchases/purchases.service';
import { ExpensesController } from './expenses/expenses.controller';
import { ExpensesService } from './expenses/expenses.service';
import { ProfitabilityController } from './profitability/profitability.controller';
import { ProfitabilityService } from './profitability/profitability.service';
import { ProfitabilityWorkbookService } from './profitability/profitability-workbook.service';
import { DashboardController } from './dashboard/dashboard.controller';
import { DashboardService } from './dashboard/dashboard.service';
import {
  InvoiceSettingsController,
  PlatformInvoiceModeController,
} from './invoicing/invoice-settings.controller';
import { InvoiceSettingsService } from './invoicing/invoice-settings.service';
import { SimulatedInvoicesController } from './invoicing/simulated-invoices.controller';
import { SimulatedInvoicesService } from './invoicing/simulated-invoices.service';
import { BillingReconciliationService } from './invoicing/billing-reconciliation.service';

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
    PurchasesController,
    ExpensesController,
    ProfitabilityController,
    DashboardController,
    InvoiceSettingsController,
    PlatformInvoiceModeController,
    SimulatedInvoicesController,
  ],
  providers: [
    TenantSessionService,
    ClientsService,
    VehiclesService,
    OrdersService,
    ConceptCatalogService,
    InventoryService,
    SuppliersService,
    PurchasesService,
    ExpensesService,
    ProfitabilityService,
    ProfitabilityWorkbookService,
    DashboardService,
    InvoiceSettingsService,
    SimulatedInvoicesService,
    BillingReconciliationService,
  ],
  exports: [TenantSessionService, BillingReconciliationService],
})
export class TenantModule {}
