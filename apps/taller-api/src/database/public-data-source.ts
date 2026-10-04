import 'dotenv/config';
import { DataSource } from 'typeorm';
import { PUBLIC_ENTITIES } from './database-options';
import { PublicBaseline1700000000000 } from './migrations/public/1700000000000-public-baseline';
import { GeneratedSchemasAndTemporaryPasswords1700000001000 } from './migrations/public/1700000001000-generated-schemas-and-temporary-passwords';
import { TenantLoginIdentities1700000002000 } from './migrations/public/1700000002000-tenant-identities-and-sessions';
import { AuthSessions1700000003000 } from './migrations/public/1700000003000-auth-sessions';
import { MobilePasswordRecovery1700000004000 } from './migrations/public/1700000004000-mobile-password-recovery';
import { VehicleCatalogAudit1700000005000 } from './migrations/public/1700000005000-vehicle-catalog-audit';
import { TenantVehicleProfile1700000006000 } from './migrations/public/1700000006000-tenant-vehicle-profile';
import { UnifiedCustomers1700000007000 } from './migrations/public/1700000007000-unified-customers';
import { SubscriptionPlans1700000008000 } from './migrations/public/1700000008000-subscription-plans';
import { BasicServiceOrders1700000009000 } from './migrations/public/1700000009000-basic-service-orders';
import { SimplifiedOrderStatuses1700000010000 } from './migrations/public/1700000010000-simplified-order-statuses';
import { ConceptCatalog1700000011000 } from './migrations/public/1700000011000-concept-catalog';
import { Inventory1700000012000 } from './migrations/public/1700000012000-inventory';
import { OrderCatalogIntegration1700000013000 } from './migrations/public/1700000013000-order-catalog-integration';
import { RemoveHourUnit1700000014000 } from './migrations/public/1700000014000-remove-hour-unit';
import { InventoryCostLots1700000015000 } from './migrations/public/1700000015000-inventory-cost-lots';
import { InventoryMovementReversals1700000016000 } from './migrations/public/1700000016000-inventory-movement-reversals';
import { SupplierCatalog1700000017000 } from './migrations/public/1700000017000-supplier-catalog';
import { PurchaseModel1700000018000 } from './migrations/public/1700000018000-purchase-model';
import { PurchaseInventoryTraceability1700000019000 } from './migrations/public/1700000019000-purchase-inventory-traceability';
import { PurchaseStatusHistory1700000020000 } from './migrations/public/1700000020000-purchase-status-history';
import { ExpenseModel1700000021000 } from './migrations/public/1700000021000-expense-model';
import { TenantAdminRole1700000022000 } from './migrations/public/1700000022000-tenant-admin-role';
import { UserPermissions1700000023000 } from './migrations/public/1700000023000-user-permissions';
import { SensitiveActionPermissions1700000024000 } from './migrations/public/1700000024000-sensitive-action-permissions';
import { OrderItemKind1700000025000 } from './migrations/public/1700000025000-order-item-kind';
import { OptionalOrderItemCosts1700000026000 } from './migrations/public/1700000026000-optional-order-item-costs';

export default new DataSource({
  type: 'postgres',
  url: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_SSL === 'true' ? { rejectUnauthorized: true } : false,
  entities: PUBLIC_ENTITIES,
  migrations: [
    PublicBaseline1700000000000,
    GeneratedSchemasAndTemporaryPasswords1700000001000,
    TenantLoginIdentities1700000002000,
    AuthSessions1700000003000,
    MobilePasswordRecovery1700000004000,
    VehicleCatalogAudit1700000005000,
    TenantVehicleProfile1700000006000,
    UnifiedCustomers1700000007000,
    SubscriptionPlans1700000008000,
    BasicServiceOrders1700000009000,
    SimplifiedOrderStatuses1700000010000,
    ConceptCatalog1700000011000,
    Inventory1700000012000,
    OrderCatalogIntegration1700000013000,
    RemoveHourUnit1700000014000,
    InventoryCostLots1700000015000,
    InventoryMovementReversals1700000016000,
    SupplierCatalog1700000017000,
    PurchaseModel1700000018000,
    PurchaseInventoryTraceability1700000019000,
    PurchaseStatusHistory1700000020000,
    ExpenseModel1700000021000,
    TenantAdminRole1700000022000,
    UserPermissions1700000023000,
    SensitiveActionPermissions1700000024000,
    OrderItemKind1700000025000,
    OptionalOrderItemCosts1700000026000,
  ],
  migrationsTableName: 'public_schema_migrations',
  synchronize: false,
});
