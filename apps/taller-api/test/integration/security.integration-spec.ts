import 'reflect-metadata';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import * as argon2 from 'argon2';
import { Workbook } from 'exceljs';
import { AddressInfo } from 'node:net';
import { DataSource } from 'typeorm';
import { AppModule } from '../../src/app.module';
import { HttpExceptionFilter } from '../../src/common/filters/http-exception.filter';
import { PUBLIC_ENTITIES } from '../../src/database/database-options';
import { PublicBaseline1700000000000 } from '../../src/database/migrations/public/1700000000000-public-baseline';
import { GeneratedSchemasAndTemporaryPasswords1700000001000 } from '../../src/database/migrations/public/1700000001000-generated-schemas-and-temporary-passwords';
import { TenantLoginIdentities1700000002000 } from '../../src/database/migrations/public/1700000002000-tenant-identities-and-sessions';
import { AuthSessions1700000003000 } from '../../src/database/migrations/public/1700000003000-auth-sessions';
import { MobilePasswordRecovery1700000004000 } from '../../src/database/migrations/public/1700000004000-mobile-password-recovery';
import { VehicleCatalogAudit1700000005000 } from '../../src/database/migrations/public/1700000005000-vehicle-catalog-audit';
import { TenantVehicleProfile1700000006000 } from '../../src/database/migrations/public/1700000006000-tenant-vehicle-profile';
import { UnifiedCustomers1700000007000 } from '../../src/database/migrations/public/1700000007000-unified-customers';
import { SubscriptionPlans1700000008000 } from '../../src/database/migrations/public/1700000008000-subscription-plans';
import { BasicServiceOrders1700000009000 } from '../../src/database/migrations/public/1700000009000-basic-service-orders';
import { SimplifiedOrderStatuses1700000010000 } from '../../src/database/migrations/public/1700000010000-simplified-order-statuses';
import { ConceptCatalog1700000011000 } from '../../src/database/migrations/public/1700000011000-concept-catalog';
import { Inventory1700000012000 } from '../../src/database/migrations/public/1700000012000-inventory';
import { OrderCatalogIntegration1700000013000 } from '../../src/database/migrations/public/1700000013000-order-catalog-integration';
import { RemoveHourUnit1700000014000 } from '../../src/database/migrations/public/1700000014000-remove-hour-unit';
import { InventoryCostLots1700000015000 } from '../../src/database/migrations/public/1700000015000-inventory-cost-lots';
import { InventoryMovementReversals1700000016000 } from '../../src/database/migrations/public/1700000016000-inventory-movement-reversals';
import { SupplierCatalog1700000017000 } from '../../src/database/migrations/public/1700000017000-supplier-catalog';
import { PurchaseModel1700000018000 } from '../../src/database/migrations/public/1700000018000-purchase-model';
import { PurchaseInventoryTraceability1700000019000 } from '../../src/database/migrations/public/1700000019000-purchase-inventory-traceability';
import { PurchaseStatusHistory1700000020000 } from '../../src/database/migrations/public/1700000020000-purchase-status-history';
import { ExpenseModel1700000021000 } from '../../src/database/migrations/public/1700000021000-expense-model';
import { TenantAdminRole1700000022000 } from '../../src/database/migrations/public/1700000022000-tenant-admin-role';
import { UserPermissions1700000023000 } from '../../src/database/migrations/public/1700000023000-user-permissions';
import { SensitiveActionPermissions1700000024000 } from '../../src/database/migrations/public/1700000024000-sensitive-action-permissions';
import { AdministrativePasswordResets1700000027000 } from '../../src/database/migrations/public/1700000027000-administrative-password-resets';
import { RetireMobilePasswordRecovery1700000028000 } from '../../src/database/migrations/public/1700000028000-retire-mobile-password-recovery';
import { OrderItemBillingBehavior1700000029000 } from '../../src/database/migrations/public/1700000029000-order-item-billing-behavior';
import { RefreshTokenSessions1700000034000 } from '../../src/database/migrations/public/1700000034000-refresh-token-sessions';
import { PlatformAdminSecurityEvents1700000035000 } from '../../src/database/migrations/public/1700000035000-platform-admin-security-events';
import { RemoveSubscriptionTrials1700000036000 } from '../../src/database/migrations/public/1700000036000-remove-subscription-trials';
import { PlatformCompanyUserEvents1700000037000 } from '../../src/database/migrations/public/1700000037000-platform-company-user-events';
import { CustomerFiscalProfile1700000038000 } from '../../src/database/migrations/public/1700000038000-customer-fiscal-profile';
import { CfdiUseCatalog1700000039000 } from '../../src/database/migrations/public/1700000039000-cfdi-use-catalog';
import { CustomerRfcValidation1700000040000 } from '../../src/database/migrations/public/1700000040000-customer-rfc-validation';
import { PlatformCompanyUserLifecycle1700000041000 } from '../../src/database/migrations/public/1700000041000-platform-company-user-lifecycle';
import { SimulatedInvoicingSettings1700000042000 } from '../../src/database/migrations/public/1700000042000-simulated-invoicing-settings';
import { RenameBasicPlanToEssential1700000043000 } from '../../src/database/migrations/public/1700000043000-rename-basic-plan-to-essential';
import { DefinitiveSubscriptionPlanMatrix1700000044000 } from '../../src/database/migrations/public/1700000044000-definitive-subscription-plan-matrix';
import { SimulatedInvoiceDocuments1700000045000 } from '../../src/database/migrations/public/1700000045000-simulated-invoice-documents';
import { SimulatedInvoiceTransitions1700000046000 } from '../../src/database/migrations/public/1700000046000-simulated-invoice-transitions';
import { AccountingPermissionTemplate1700000047000 } from '../../src/database/migrations/public/1700000047000-accounting-permission-template';
import { quoteIdentifier } from '../../src/database/schema-name';
import { seedPublicCatalogs } from '../../src/database/seeds/public-catalogs.seed';
import { changePlatformAdminPassword } from '../../src/platform-users/change-platform-admin-password';

const PLATFORM_EMAIL = 'platform.integration@test.local';
const PLATFORM_PASSWORD = 'PlatformIntegration-2026!';
const TENANT_PASSWORD = 'Temp26a';
const USER_PASSWORD = 'User26a';
const PERMANENT_PASSWORD = 'Clave27b';

interface LoginResponse {
  accessToken: string;
  user: {
    id: string;
    email: string | null;
    username: string | null;
    loginName: string;
    role: string;
    companyId: string | null;
    companyName: string | null;
    mustChangePassword: boolean;
    permissions: string[];
    subscription: {
      planCode: 'essential' | 'control' | 'invoicing';
      status: 'active' | 'past_due' | 'suspended' | 'canceled';
      usable: boolean;
      readOnlyFeatures: string[];
    } | null;
  };
}

interface ProvisionedTenant extends LoginResponse {
  company: CompanyResponse;
}

interface CompanyResponse {
  id: string;
  name: string;
  schemaName: string;
  loginCode: string;
  admin: { id: string; email: string | null; loginName: string };
}

interface UserResponse {
  id: string;
  email: string | null;
  username: string;
  loginName: string;
  role: string;
  phone: string | null;
  companyId: string;
  isActive: boolean;
  mustChangePassword: boolean;
}

interface PaginatedUsersResponse {
  totalItems: number;
  items: UserResponse[];
}

interface PermissionTemplateResponse {
  code: string;
  permissionCodes: string[];
}

interface UserPermissionProfileResponse {
  userId: string;
  role: string;
  templateCode: string | null;
  isCustomized: boolean;
  automatic: boolean;
  permissionCodes: string[];
}

interface ClientResponse {
  id: string;
  type: 'person' | 'company';
  displayName: string;
  legalName: string | null;
  contactName: string | null;
  taxId: string | null;
  fiscalName: string | null;
  fiscalPostalCode: string | null;
  fiscalRegimeCode: string | null;
  preferredCfdiUseCode: string | null;
  fiscalReadiness: {
    isFiscalProfileComplete: boolean;
    isReadyToInvoice: boolean;
    missingFields: Array<{ code: string; field: string; message: string }>;
    validationIssues: Array<{ code: string; field: string; message: string }>;
  };
  createdByUserId: string;
  updatedByUserId: string;
}

interface PaginatedClients {
  totalItems: number;
  items: ClientResponse[];
}

interface FiscalRegimeResponse {
  code: string;
  name: string;
  supportsPerson: boolean;
  supportsCompany: boolean;
}

interface CfdiUseResponse {
  code: string;
  description: string;
  supportsPerson: boolean;
  supportsCompany: boolean;
  validFrom: string;
  validTo: string | null;
  isActive: boolean;
}

interface HttpResult<T> {
  status: number;
  body: T;
  setCookie: string | null;
}

interface InvoiceSettingsResponse {
  mode: 'disabled' | 'simulation';
  issuerType: 'person' | 'company' | null;
  fiscalName: string | null;
  taxId: string | null;
  fiscalRegimeCode: string | null;
  fiscalPostalCode: string | null;
  defaultSeries: string;
  nextInternalFolio: number;
  pricesIncludeTax: boolean | null;
  currencyCode: 'MXN';
  isActive: boolean;
  readiness: {
    isIssuerProfileComplete: boolean;
    missingFields: Array<{ code: string; field: string; message: string }>;
    validationIssues: Array<{ code: string; field: string; message: string }>;
  };
}

interface PlatformInvoiceModeResponse {
  companyId: string;
  mode: 'disabled' | 'simulation';
  isActive: boolean;
  isIssuerProfileComplete: boolean;
}

interface SubscriptionSummaryResponse {
  companyId: string;
  planCode: 'essential' | 'control' | 'invoicing';
  planName: string;
  status: string;
  usable: boolean;
  features: string[];
  readOnlyFeatures: string[];
}

interface SimulatedInvoiceResponse {
  id: string;
  orderId: string;
  orderFolio: string;
  status: 'draft' | 'issued' | 'cancelled' | 'discarded';
  series: string | null;
  folio: number | null;
  documentLabel: string;
  collectionStatus: 'pending' | 'paid';
  orderPaidAt: string | null;
  cfdiUseCode: string;
  paymentFormCode: string;
  paymentMethodCode: string;
  subtotal: string;
  transferredTax: string;
  total: string;
  items: Array<{
    orderItemId: string | null;
    taxObjectCode: string;
    taxCode: string | null;
    factorTypeCode: string | null;
    taxRate: string | null;
    baseAmount: string;
    taxAmount: string;
    total: string;
  }>;
  events: Array<{ eventType: string }>;
}

interface BinaryHttpResult {
  status: number;
  body: Buffer;
  contentType: string | null;
  contentDisposition: string | null;
}

interface PoolStats {
  totalCount: number;
  idleCount: number;
  waitingCount: number;
}

interface VehicleBrandResponse {
  id: string;
  name: string;
  isActive: boolean;
  createdByUserId: string | null;
}

interface VehicleModelResponse extends VehicleBrandResponse {
  brandId: string;
  brandName: string;
}

interface PaginatedCatalog<T> {
  totalItems: number;
  items: T[];
}

interface MeasurementUnitResponse {
  id: string;
  name: string;
  symbol: string;
  satCode: string | null;
  allowsDecimals: boolean;
  isActive: boolean;
}

interface ConceptResponse {
  id: string;
  kind: 'product' | 'service';
  sku: string | null;
  name: string;
  description: string | null;
  unit: MeasurementUnitResponse;
  cost: string | null;
  lastCost: string | null;
  averageCost: string | null;
  price: string;
  tracksInventory: boolean;
  stock: string;
  minimumStock: string;
  isLowStock: boolean;
  satProductServiceCode: string | null;
  isActive: boolean;
}

interface InventoryMovementResponse {
  id: string;
  productId: string;
  productName: string;
  type: 'entry' | 'exit' | 'adjustment';
  quantity: string;
  previousStock: string;
  resultingStock: string;
  unitCost: string | null;
  reason: string;
  createdByUserId: string;
  createdByName: string;
  createdAt: string;
}

interface InventoryProductResponse {
  id: string;
  stock: string;
  minimumStock: string;
  lastCost: string | null;
  averageCost: string | null;
  isLowStock: boolean;
}

interface SupplierResponse {
  id: string;
  commercialName: string;
  legalName: string | null;
  taxId: string | null;
  phone: string | null;
  email: string | null;
  notes: string | null;
  isActive: boolean;
  isDefault: boolean;
}

interface PurchaseResponse {
  id: string;
  folio: string;
  status: 'draft' | 'confirmed' | 'cancelled';
  supplier: { id: string; commercialName: string; isDefault: boolean };
  reference: string | null;
  notes: string | null;
  total: string;
  itemCount: number;
  confirmedAt: string | null;
  cancelledAt: string | null;
  statusHistory: Array<{
    previousStatus: 'draft' | 'confirmed' | 'cancelled' | null;
    newStatus: 'draft' | 'confirmed' | 'cancelled';
    changedByUserId: string;
  }>;
  items: Array<{
    productId: string;
    inventoryMovementId: string | null;
    inventoryLotId: string | null;
    productName: string;
    quantity: string;
    unitCost: string;
    amount: string;
  }>;
}

interface ExpenseCategoryResponse {
  id: string;
  code: string;
  name: string;
  isActive: boolean;
  isSystem: boolean;
}

interface ExpenseResponse {
  id: string;
  category: ExpenseCategoryResponse;
  supplier: { id: string; commercialName: string; isDefault: boolean };
  status: 'draft' | 'confirmed' | 'cancelled';
  recurrenceType: 'one_time' | 'recurring';
  occurredOn: string;
  description: string;
  reference: string | null;
  amount: string;
  notes: string | null;
  receiptFileKey: string | null;
  confirmedAt: string | null;
  cancelledAt: string | null;
  statusHistory: Array<{
    previousStatus: 'draft' | 'confirmed' | 'cancelled' | null;
    newStatus: 'draft' | 'confirmed' | 'cancelled';
    changedByUserId: string;
  }>;
  changeHistory: Array<{
    changedFields: string[];
    previousValues: Record<string, string | null>;
    newValues: Record<string, string | null>;
    changedByUserId: string;
  }>;
}

interface ExpenseMonthlySummaryResponse {
  month: string;
  previousMonth: string;
  confirmedCount: number;
  confirmedAmount: string;
  previousConfirmedCount: number;
  previousConfirmedAmount: string;
  changeAmount: string;
  changePercent: string | null;
  direction: 'increase' | 'decrease' | 'same';
  draftCount: number;
  draftAmount: string;
  byCategory: Array<{ category: ExpenseCategoryResponse; count: number; amount: string }>;
  recentExpenses: ExpenseResponse[];
}

interface ProfitabilityReportResponse {
  occurredFrom: string;
  occurredTo: string;
  totals: {
    completedOrderCount: number;
    incompleteOrderCount: number;
    missingPriceOrderCount: number;
    missingCostOrderCount: number;
    paidCompletedOrderCount: number;
    unpaidCompletedOrderCount: number;
    receivableOrderCount: number;
    income: string;
    collectedIncome: string;
    outstandingIncome: string;
    receivableAmount: string;
    directCost: string;
    fifoProductCost: string;
    grossProfit: string;
    collectedGrossProfit: string;
    operatingExpenses: string;
    netProfit: string;
    collectedNetResult: string;
    grossMarginPercent: string | null;
    netMarginPercent: string | null;
    isComplete: boolean;
  };
  byDay: Array<{
    period: string;
    income: string;
    collectedIncome: string;
    outstandingIncome: string;
    operatingExpenses: string;
    netProfit: string;
    collectedNetResult: string;
  }>;
  byMonth: Array<{
    period: string;
    income: string;
    collectedIncome: string;
    outstandingIncome: string;
    operatingExpenses: string;
    netProfit: string;
    collectedNetResult: string;
  }>;
  byCustomer: Array<{
    customerId: string;
    customerName: string;
    completedOrderCount: number;
    income: string;
    collectedIncome: string;
    outstandingIncome: string;
    directCost: string;
    grossProfit: string;
  }>;
  byServiceType: Array<{
    type: 'service' | 'product';
    name: string;
    itemCount: number;
    income: string;
    directCost: string;
    grossProfit: string;
  }>;
  orders: Array<{
    id: string;
    folio: string;
    isPaid: boolean;
    fifoProductCost: string;
    grossProfit: string | null;
    hasMissingPrice: boolean;
    hasUnknownProductCost: boolean;
    isComplete: boolean;
  }>;
}

interface ProfitabilityAnalyticsResponse {
  months: 6 | 12;
  occurredFrom: string;
  occurredTo: string;
  summary: {
    period: string;
    generatedIncome: string;
    generatedDirectCost: string;
    generatedGrossProfit: string;
    operatingExpenses: string;
    generatedNetProfit: string;
    collectedIncome: string;
    collectedDirectCost: string;
    collectedGrossProfit: string;
    collectedNetResult: string;
    isComplete: boolean;
  };
  series: Array<{ period: string; generatedIncome: string; collectedIncome: string }>;
  collection: {
    paidOrderCount: number;
    paidAmount: string;
    pendingOrderCount: number;
    pendingAmount: string;
  };
  expensesByCategory: Array<{
    categoryCode: string;
    expenseCount: number;
    amount: string;
    percentage: string | null;
  }>;
}

interface MonthlyProfitabilityReportResponse {
  period: string;
  label: string;
  startsOn: string;
  endsOn: string;
  timezoneCode: string;
  summary: {
    completedOrderCount: number;
    paidOrderCount: number;
    pendingOrderCount: number;
    incompleteCostOrderCount: number;
    generatedIncome: string;
    collectedIncome: string;
    outstandingIncome: string;
    directCost: string;
    grossProfit: string;
    operatingExpenses: string;
    netProfit: string;
    isComplete: boolean;
  };
  orders: Array<{
    id: string;
    folio: string;
    externalFolio: string | null;
    completedOn: string;
    paidOn: string | null;
    customerId: string;
    customerName: string;
    vehicleId: string;
    vehicleBrand: string;
    vehicleModel: string;
    vehicleYear: number;
    vehicleColor: string;
    isPaid: boolean;
    income: string;
    directCost: string;
    grossProfit: string | null;
    hasUnknownProductCost: boolean;
    isCostComplete: boolean;
    concepts: Array<{
      description: string;
      type: 'product' | 'service';
      quantity: string;
      affectsOrderTotal: boolean;
    }>;
  }>;
}

interface DashboardSummaryResponse {
  period: { month: string; startsOn: string; endsOn: string };
  access: {
    planCode: 'essential' | 'control' | 'invoicing';
    planName: string;
    includesFinancials: boolean;
    includesLowStock: boolean;
  };
  orders: {
    inProgressCount: number;
    unpaidCount: number;
    completedUnpaidCount: number;
    completedPaidCount: number;
  };
  revenue: { generated: string; collected: string; outstanding: string; receivable: string };
  financials: null | {
    directCost: string;
    grossProfit: string;
    operatingExpenses: string;
    operatingProfit: string;
    incompleteOrderCount: number;
    missingPriceOrderCount: number;
    missingCostOrderCount: number;
    isComplete: boolean;
  };
  lowStock: null | {
    totalProducts: number;
    products: Array<{
      id: string;
      sku: string | null;
      name: string;
      unitSymbol: string;
      stock: string;
      minimumStock: string;
    }>;
  };
}

interface DashboardActivityResponse {
  recentOrders: Array<{
    id: string;
    folio: string;
    status: string;
    isPaid: boolean;
    total: string | null;
  }>;
  oldestInProgress: Array<{
    id: string;
    folio: string;
    openedAt: string;
    daysOpen: number;
  }>;
  pendingCollection: Array<{
    id: string;
    folio: string;
    status: 'in_progress' | 'completed';
    total: string | null;
    openedAt: string;
    completedAt: string | null;
  }>;
  recentPurchases: null | Array<{
    id: string;
    folio: string;
    status: string;
    total: string;
  }>;
  recentExpenses: null | Array<{
    id: string;
    description: string;
    status: string;
    amount: string;
  }>;
  recentInventoryMovements: null | Array<{
    id: string;
    productId: string;
    type: string;
    quantity: string;
    resultingStock: string;
  }>;
  lowStock: DashboardSummaryResponse['lowStock'];
}

interface InventoryLotResponse {
  id: string;
  productId: string;
  receivedQuantity: string;
  remainingQuantity: string;
  unitCost: string;
  sourceType: string;
  sourceReference: string | null;
}

interface VehicleResponse {
  id: string;
  customerId: string;
  brandId: string;
  brandName: string;
  modelId: string;
  modelName: string;
  year: number;
  color: string;
  numeroSerie: string | null;
  licensePlate: string | null;
}

interface VehicleHistoryResponse {
  numeroSerie: string;
  totalClients: number;
  totalVehicles: number;
  totalOrders: number;
  matches: Array<{
    id: string;
    customerId: string;
    customerName: string;
    orders: Array<{ id: string; folio: string; status: string }>;
  }>;
}

interface OrderResponse {
  id: string;
  folio: string;
  externalFolio: string | null;
  status: string;
  billingStatus: 'not_invoiced' | 'draft' | 'issued' | 'cancelled' | 'discarded';
  activeInvoiceId: string | null;
  invoiceSeries: string | null;
  invoiceFolio: number | null;
  invoiceIssuedAt: string | null;
  paymentMethodCode: 'PUE' | 'PPD' | null;
  isPaid: boolean;
  paidAt: string | null;
  customer: { id: string; type: string; displayName: string };
  vehicle: { id: string; brandName: string; modelName: string };
  subtotal: string | null;
  total: string | null;
  totalCost: string | null;
  grossProfit: string | null;
  inventoryAppliedAt: string | null;
  hasUnpricedItems: boolean;
  hasUnknownCosts: boolean;
  isFinanciallyComplete: boolean;
  items: Array<{
    id: string;
    productServiceId: string | null;
    kind: 'product' | 'service';
    affectsOrderTotal: boolean;
    position: number;
    description: string;
    quantity: string;
    unitPrice: string | null;
    amount: string | null;
    unitName: string;
    unitSymbol: string;
    unitCost: string | null;
    costAmount: string | null;
    tracksInventory: boolean;
    costLayers: Array<{
      lotId: string;
      quantity: string;
      unitCost: string;
      costAmount: string;
    }>;
  }>;
  notes: Array<{ body: string; createdByUserId: string }>;
  statusHistory: Array<{
    previousStatus: string | null;
    newStatus: string;
  }>;
}

describe('Integracion y seguridad multi-tenant con PostgreSQL real', () => {
  let app: INestApplication;
  let control: DataSource;
  let baseUrl: string;
  let platformToken: string;

  const testDatabaseUrl = process.env.TEST_DATABASE_URL!;

  beforeAll(async () => {
    control = new DataSource({
      type: 'postgres',
      url: testDatabaseUrl,
      applicationName: 'taller-integration-control',
    });
    await control.initialize();
    await resetPublicSchema(control);

    const migrations = new DataSource({
      type: 'postgres',
      url: testDatabaseUrl,
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
        AdministrativePasswordResets1700000027000,
        RetireMobilePasswordRecovery1700000028000,
        OrderItemBillingBehavior1700000029000,
        RefreshTokenSessions1700000034000,
        PlatformAdminSecurityEvents1700000035000,
        RemoveSubscriptionTrials1700000036000,
        PlatformCompanyUserEvents1700000037000,
        CustomerFiscalProfile1700000038000,
        CfdiUseCatalog1700000039000,
        CustomerRfcValidation1700000040000,
        PlatformCompanyUserLifecycle1700000041000,
        SimulatedInvoicingSettings1700000042000,
        RenameBasicPlanToEssential1700000043000,
        DefinitiveSubscriptionPlanMatrix1700000044000,
        SimulatedInvoiceDocuments1700000045000,
        SimulatedInvoiceTransitions1700000046000,
        AccountingPermissionTemplate1700000047000,
      ],
      migrationsTableName: 'public_schema_migrations',
      synchronize: false,
    });
    await migrations.initialize();
    try {
      await migrations.runMigrations();
      const runner = migrations.createQueryRunner();
      await runner.connect();
      try {
        await runner.startTransaction();
        await seedPublicCatalogs(runner);
        const passwordHash = await argon2.hash(PLATFORM_PASSWORD, { type: argon2.argon2id });
        await runner.query(
          `INSERT INTO public.users(email, password_hash, full_name, role, company_id)
           VALUES ($1, $2, $3, 'platform_admin', NULL)`,
          [PLATFORM_EMAIL, passwordHash, 'Administrador de integración'],
        );
        await runner.commitTransaction();
      } catch (error: unknown) {
        if (runner.isTransactionActive) await runner.rollbackTransaction();
        throw error;
      } finally {
        await runner.release();
      }
    } finally {
      await migrations.destroy();
    }

    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = moduleRef.createNestApplication({ logger: false });
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
        transformOptions: { enableImplicitConversion: false },
      }),
    );
    app.useGlobalFilters(new HttpExceptionFilter());
    app.setGlobalPrefix('api');
    await app.listen(0, '127.0.0.1');
    const server = app.getHttpServer() as { address(): AddressInfo | string | null };
    const address = server.address();
    if (!address || typeof address === 'string')
      throw new Error('No se pudo resolver el puerto HTTP');
    baseUrl = `http://127.0.0.1:${address.port}/api`;

    platformToken = (await login(PLATFORM_EMAIL, PLATFORM_PASSWORD)).body.accessToken;
  });

  afterAll(async () => {
    if (app) await app.close();
    if (control?.isInitialized) {
      await resetPublicSchema(control);
      await control.destroy();
    }
  });

  it('prepara sesiones con historial seguro de rotación de refresh tokens', async () => {
    const columns = await control.query<Array<{ column_name: string }>>(
      `SELECT column_name
       FROM information_schema.columns
       WHERE table_schema = 'public' AND table_name = 'auth_refresh_tokens'
       ORDER BY ordinal_position`,
    );
    expect(columns.map(({ column_name }) => column_name)).toEqual([
      'id',
      'session_id',
      'token_hash',
      'generation',
      'issued_at',
      'expires_at',
      'consumed_at',
      'revoked_at',
      'replaced_by_token_id',
    ]);

    const rawTokenColumn = await control.query<Array<{ column_name: string }>>(
      `SELECT column_name
       FROM information_schema.columns
       WHERE table_schema = 'public'
         AND table_name = 'auth_refresh_tokens'
         AND column_name IN ('token', 'token_value')`,
    );
    expect(rawTokenColumn).toHaveLength(0);
  });

  it('retira la recuperación OTP y su almacenamiento', async () => {
    const challengeTable = await control.query<Array<{ table_name: string | null }>>(
      "SELECT to_regclass('public.password_recovery_challenges')::text AS table_name",
    );
    expect(challengeTable[0]?.table_name).toBeNull();

    for (const path of [
      '/auth/password-recovery/request',
      '/auth/password-recovery/verify',
      '/auth/password-recovery/complete',
    ]) {
      expect((await request<unknown>('POST', path, { body: {} })).status).toBe(404);
    }

    const swagger = SwaggerModule.createDocument(app, new DocumentBuilder().build());
    expect(Object.keys(swagger.paths).some((path) => path.includes('password-recovery'))).toBe(
      false,
    );
  });

  it('documenta en Swagger el comportamiento cobrable de cada concepto', () => {
    const swagger = SwaggerModule.createDocument(app, new DocumentBuilder().build());
    const inputSchema = JSON.stringify(swagger.components?.schemas?.OrderItemInputDto);
    const responseSchema = JSON.stringify(swagger.components?.schemas?.OrderItemResponseDto);

    expect(inputSchema).toContain('affectsOrderTotal');
    expect(inputSchema).toContain('true para servicios y false para productos');
    expect(responseSchema).toContain('forma parte del total por cobrar');
    expect(responseSchema).toContain('null significa desconocido');

    const createOrderSchema = JSON.stringify(swagger.components?.schemas?.CreateOrderDto);
    const orderSchema = JSON.stringify(swagger.components?.schemas?.OrderResponseDto);
    expect(createOrderSchema).toContain('externalFolio');
    expect(createOrderSchema).toContain('maxLength');
    expect(orderSchema).toContain('sistema externo');
  });

  it('aísla la configuración simulada, exige plan Facturación y audita sus cambios', async () => {
    const invoicing = await provisionAndLogin(
      'Facturación Simulada Alpha',
      'invoice.alpha@test.local',
      'invoicing',
    );
    const essential = await provisionAndLogin(
      'Facturación Simulada Esencial',
      'invoice.essential@test.local',
      'essential',
    );

    expect(
      (await request<unknown>('GET', '/invoices/settings', { token: essential.accessToken }))
        .status,
    ).toBe(403);
    expect(
      (
        await request<unknown>('PATCH', `/companies/${essential.company.id}/invoicing-mode`, {
          token: platformToken,
          body: { mode: 'simulation' },
        })
      ).status,
    ).toBe(403);

    const initial = await request<InvoiceSettingsResponse>('GET', '/invoices/settings', {
      token: invoicing.accessToken,
    });
    expect(initial.status).toBe(200);
    expect(initial.body).toMatchObject({
      mode: 'disabled',
      issuerType: 'person',
      currencyCode: 'MXN',
      isActive: false,
      readiness: { isIssuerProfileComplete: false },
    });

    const enabled = await request<PlatformInvoiceModeResponse>(
      'PATCH',
      `/companies/${invoicing.company.id}/invoicing-mode`,
      { token: platformToken, body: { mode: 'simulation' } },
    );
    expect(enabled.status).toBe(200);
    expect(enabled.body).toMatchObject({
      companyId: invoicing.company.id,
      mode: 'simulation',
      isIssuerProfileComplete: false,
    });

    const updated = await request<InvoiceSettingsResponse>('PATCH', '/invoices/settings', {
      token: invoicing.accessToken,
      body: {
        fiscalName: 'Persona Física de Demostración',
        taxId: 'LOPA900101AB1',
        fiscalRegimeCode: '612',
        fiscalPostalCode: '80000',
        defaultSeries: 'SIM',
        nextInternalFolio: 100,
        pricesIncludeTax: true,
        isActive: true,
      },
    });
    expect(updated.status).toBe(200);
    expect(updated.body).toMatchObject({
      mode: 'simulation',
      fiscalName: 'PERSONA FÍSICA DE DEMOSTRACIÓN',
      taxId: 'LOPA900101AB1',
      fiscalRegimeCode: '612',
      fiscalPostalCode: '80000',
      defaultSeries: 'SIM',
      nextInternalFolio: 100,
      pricesIncludeTax: true,
      currencyCode: 'MXN',
      isActive: true,
      readiness: {
        isIssuerProfileComplete: true,
        missingFields: [],
        validationIssues: [],
      },
    });

    const readOnlyAdmin = await request<{ user: UserResponse }>(
      'POST',
      `/companies/${invoicing.company.id}/users`,
      {
        token: platformToken,
        body: {
          fullName: 'Administrador fiscal de consulta',
          username: 'admin_fiscal_consulta',
          phone: '+526671119901',
          password: USER_PASSWORD,
          timezoneCode: 'America/Mazatlan',
          role: 'admin',
          templateCode: null,
          permissionCodes: ['invoices.view'],
        },
      },
    );
    expect(readOnlyAdmin.status).toBe(201);
    const temporaryAdmin = await login(readOnlyAdmin.body.user.loginName, USER_PASSWORD);
    expect(temporaryAdmin.status).toBe(200);
    expect(
      (
        await request<unknown>('PATCH', '/users/me/password', {
          token: temporaryAdmin.body.accessToken,
          body: { currentPassword: USER_PASSWORD, newPassword: PERMANENT_PASSWORD },
        })
      ).status,
    ).toBe(204);
    const activeAdmin = await login(readOnlyAdmin.body.user.loginName, PERMANENT_PASSWORD);
    expect(
      (await request<unknown>('GET', '/invoices/settings', { token: activeAdmin.body.accessToken }))
        .status,
    ).toBe(403);
    expect(
      (
        await request<unknown>('PATCH', '/invoices/settings', {
          token: activeAdmin.body.accessToken,
          body: { defaultSeries: 'NO' },
        })
      ).status,
    ).toBe(403);

    const schemas = await control.query<Array<{ id: string; schema_name: string }>>(
      'SELECT id::text, schema_name FROM public.companies WHERE id = ANY($1::uuid[])',
      [[invoicing.company.id, essential.company.id]],
    );
    const byId = new Map(schemas.map((row) => [row.id, row.schema_name]));
    const invoicingSchema = quoteIdentifier(byId.get(invoicing.company.id)!);
    const essentialSchema = quoteIdentifier(byId.get(essential.company.id)!);
    const invoicingRows = await control.query<Array<{ tax_id: string | null }>>(
      `SELECT tax_id FROM ${invoicingSchema}.invoice_settings WHERE id = 1`,
    );
    const essentialRows = await control.query<Array<{ tax_id: string | null }>>(
      `SELECT tax_id FROM ${essentialSchema}.invoice_settings WHERE id = 1`,
    );
    const auditRows = await control.query<Array<{ event_type: string }>>(
      `SELECT event_type FROM ${invoicingSchema}.invoice_settings_events ORDER BY created_at, id`,
    );
    expect(invoicingRows[0]?.tax_id).toBe('LOPA900101AB1');
    expect(essentialRows[0]?.tax_id).toBeNull();
    expect(auditRows.map(({ event_type }) => event_type)).toEqual([
      'mode_changed',
      'profile_updated',
    ]);

    const swagger = SwaggerModule.createDocument(app, new DocumentBuilder().build());
    expect(swagger.paths['/api/invoices/settings']).toBeDefined();
    expect(swagger.paths['/api/companies/{companyId}/invoicing-mode']).toBeDefined();
    const settingsSchema = JSON.stringify(swagger.components?.schemas?.InvoiceSettingsResponseDto);
    const readinessSchema = JSON.stringify(swagger.components?.schemas?.IssuerReadinessResponseDto);
    expect(settingsSchema).toContain('IssuerReadinessResponseDto');
    expect(readinessSchema).toContain('isIssuerProfileComplete');
    expect(settingsSchema).not.toContain('certificate');
    expect(settingsSchema).not.toContain('privateKey');
  });

  it('crea, recalcula, emite y cancela una simulación desde una orden terminada', async () => {
    const tenant = await provisionAndLogin(
      'Documentos Simulados Integration',
      'invoice.documents@test.local',
      'invoicing',
    );
    const controlPlan = await provisionAndLogin(
      'Control Sin Facturación Integration',
      'invoice.control@test.local',
      'control',
    );

    expect(
      (await request<unknown>('GET', '/invoices/catalogs', { token: controlPlan.accessToken }))
        .status,
    ).toBe(403);

    const controlUpgrade = await request<{
      planCode: string;
      features: string[];
      readOnlyFeatures: string[];
    }>('PATCH', `/subscriptions/companies/${controlPlan.company.id}`, {
      token: platformToken,
      body: {
        planCode: 'invoicing',
        status: 'active',
        reason: 'Validar habilitación inmediata de Facturación',
      },
    });
    expect(controlUpgrade.status).toBe(200);
    expect(controlUpgrade.body).toMatchObject({
      planCode: 'invoicing',
      readOnlyFeatures: [],
    });
    expect(controlUpgrade.body.features).toContain('invoicing');
    const incompleteSettings = await request<InvoiceSettingsResponse>('GET', '/invoices/settings', {
      token: controlPlan.accessToken,
    });
    expect(incompleteSettings.status).toBe(200);
    expect(incompleteSettings.body).toMatchObject({
      mode: 'simulation',
      isActive: false,
      readiness: { isIssuerProfileComplete: false },
    });
    expect(
      (
        await request<unknown>('POST', '/invoices', {
          token: controlPlan.accessToken,
          body: {
            orderId: '00000000-0000-4000-8000-000000000001',
            cfdiUseCode: 'G03',
            paymentFormCode: '03',
            paymentMethodCode: 'PUE',
          },
        })
      ).status,
    ).toBe(422);

    expect(
      (
        await request<PlatformInvoiceModeResponse>(
          'PATCH',
          `/companies/${tenant.company.id}/invoicing-mode`,
          { token: platformToken, body: { mode: 'simulation' } },
        )
      ).status,
    ).toBe(200);
    expect(
      (
        await request<InvoiceSettingsResponse>('PATCH', '/invoices/settings', {
          token: tenant.accessToken,
          body: {
            fiscalName: 'Taller Emisor de Simulación',
            taxId: 'LOPA900101AB1',
            fiscalRegimeCode: '612',
            fiscalPostalCode: '80000',
            defaultSeries: 'SIM',
            nextInternalFolio: 25,
            pricesIncludeTax: true,
            isActive: true,
          },
        })
      ).status,
    ).toBe(200);

    const customer = await request<ClientResponse>('POST', '/clients', {
      token: tenant.accessToken,
      body: {
        type: 'person',
        displayName: 'Receptor de Simulación',
        taxId: 'GODE561231GR8',
        fiscalName: 'Receptor de Simulación',
        fiscalPostalCode: '80000',
        fiscalRegimeCode: '612',
        preferredCfdiUseCode: 'G03',
      },
    });
    expect(customer.status).toBe(201);
    expect(customer.body.fiscalReadiness.isReadyToInvoice).toBe(true);

    const brand = await request<VehicleBrandResponse>('POST', '/catalogs/vehicle-brands', {
      token: tenant.accessToken,
      body: { name: 'Marca Simulación Integration' },
    });
    const model = await request<VehicleModelResponse>('POST', '/catalogs/vehicle-models', {
      token: tenant.accessToken,
      body: { brandId: brand.body.id, name: 'Modelo Simulación Integration' },
    });
    const vehicle = await request<VehicleResponse>(
      'POST',
      `/clients/${customer.body.id}/vehicles`,
      {
        token: tenant.accessToken,
        body: {
          brandId: brand.body.id,
          modelId: model.body.id,
          year: 2026,
          color: 'Azul',
        },
      },
    );
    const order = await request<OrderResponse>('POST', '/orders', {
      token: tenant.accessToken,
      body: {
        customerId: customer.body.id,
        vehicleId: vehicle.body.id,
        items: [
          {
            kind: 'service',
            description: 'Servicio demostrativo con IVA incluido',
            quantity: 1,
            unitPrice: 1160,
          },
        ],
      },
    });
    expect(order.status).toBe(201);
    expect(order.body).toMatchObject({
      billingStatus: 'not_invoiced',
      activeInvoiceId: null,
      invoiceSeries: null,
      invoiceFolio: null,
      invoiceIssuedAt: null,
      paymentMethodCode: null,
      isPaid: false,
    });

    const inProgress = await request<unknown>('POST', '/invoices', {
      token: tenant.accessToken,
      body: {
        orderId: order.body.id,
        cfdiUseCode: 'G03',
        paymentFormCode: '03',
        paymentMethodCode: 'PUE',
      },
    });
    expect(inProgress.status).toBe(422);

    const cancelledOrder = await request<OrderResponse>('POST', '/orders', {
      token: tenant.accessToken,
      body: {
        customerId: customer.body.id,
        vehicleId: vehicle.body.id,
        items: [
          {
            kind: 'service',
            description: 'Orden cancelada no facturable',
            quantity: 1,
            unitPrice: 100,
          },
        ],
      },
    });
    expect(
      (
        await request<OrderResponse>('POST', `/orders/${cancelledOrder.body.id}/status`, {
          token: tenant.accessToken,
          body: { status: 'cancelled' },
        })
      ).status,
    ).toBe(200);
    expect(
      (
        await request<unknown>('POST', '/invoices', {
          token: tenant.accessToken,
          body: {
            orderId: cancelledOrder.body.id,
            cfdiUseCode: 'G03',
            paymentFormCode: '03',
            paymentMethodCode: 'PUE',
          },
        })
      ).status,
    ).toBe(422);

    const completed = await request<OrderResponse>('POST', `/orders/${order.body.id}/status`, {
      token: tenant.accessToken,
      body: { status: 'completed' },
    });
    expect(completed.status).toBe(200);

    const created = await request<SimulatedInvoiceResponse>('POST', '/invoices', {
      token: tenant.accessToken,
      body: {
        orderId: order.body.id,
        cfdiUseCode: 'G03',
        paymentFormCode: '03',
        paymentMethodCode: 'PUE',
      },
    });
    expect(created.status).toBe(201);
    expect(created.body).toMatchObject({
      orderId: order.body.id,
      status: 'draft',
      series: null,
      folio: null,
      documentLabel: 'Simulación sin validez fiscal',
      collectionStatus: 'pending',
      orderPaidAt: null,
      subtotal: '1000.00',
      transferredTax: '160.00',
      total: '1160.00',
      items: [
        expect.objectContaining({
          taxObjectCode: '02',
          taxCode: '002',
          factorTypeCode: 'Tasa',
          taxRate: '0.160000',
          baseAmount: '1000.00',
          taxAmount: '160.00',
          total: '1160.00',
        }),
      ],
    });
    expect(created.body).not.toHaveProperty('uuid');
    expect(created.body).not.toHaveProperty('satSeal');
    expect(created.body).not.toHaveProperty('xml');

    const orderWithDraft = await request<OrderResponse>('GET', `/orders/${order.body.id}`, {
      token: tenant.accessToken,
    });
    expect(orderWithDraft.body).toMatchObject({
      billingStatus: 'draft',
      activeInvoiceId: created.body.id,
      invoiceSeries: null,
      invoiceFolio: null,
      invoiceIssuedAt: null,
      paymentMethodCode: 'PUE',
      isPaid: false,
    });
    const listedWithDraft = await request<{ items: OrderResponse[] }>('GET', '/orders', {
      token: tenant.accessToken,
    });
    expect(listedWithDraft.body.items.find(({ id }) => id === order.body.id)).toMatchObject({
      billingStatus: 'draft',
      activeInvoiceId: created.body.id,
    });

    expect(
      (
        await request<unknown>('POST', '/invoices', {
          token: tenant.accessToken,
          body: {
            orderId: order.body.id,
            cfdiUseCode: 'G03',
            paymentFormCode: '03',
            paymentMethodCode: 'PUE',
          },
        })
      ).status,
    ).toBe(409);

    const rejectedPueIssue = await request<unknown>(
      'POST',
      `/invoices/${created.body.id}/issue-simulation`,
      { token: tenant.accessToken },
    );
    expect(rejectedPueIssue.status).toBe(422);
    expect(JSON.stringify(rejectedPueIssue.body)).toContain('PUE');
    const unchangedDraft = await request<SimulatedInvoiceResponse>(
      'GET',
      `/invoices/${created.body.id}`,
      { token: tenant.accessToken },
    );
    expect(unchangedDraft.body.status).toBe('draft');
    expect(unchangedDraft.body.events.map(({ eventType }) => eventType)).toEqual(['created']);

    for (const status of ['in_progress', 'cancelled']) {
      const blocked = await request<unknown>('POST', `/orders/${order.body.id}/status`, {
        token: tenant.accessToken,
        body: { status },
      });
      expect(blocked.status).toBe(409);
      expect(JSON.stringify(blocked.body)).toContain(created.body.id);
    }

    const edited = await request<SimulatedInvoiceResponse>(
      'PATCH',
      `/invoices/${created.body.id}`,
      {
        token: tenant.accessToken,
        body: { paymentMethodCode: 'PPD', paymentFormCode: '99' },
      },
    );
    expect(edited.status).toBe(200);
    expect(edited.body).toMatchObject({ paymentMethodCode: 'PPD', paymentFormCode: '99' });

    const issued = await request<SimulatedInvoiceResponse>(
      'POST',
      `/invoices/${created.body.id}/issue-simulation`,
      { token: tenant.accessToken },
    );
    expect(issued.status).toBe(200);
    expect(issued.body).toMatchObject({
      status: 'issued',
      series: 'SIM',
      folio: 25,
      documentLabel: 'Simulación sin validez fiscal',
      collectionStatus: 'pending',
      orderPaidAt: null,
    });
    expect(issued.body.events.map(({ eventType }) => eventType)).toEqual([
      'created',
      'updated',
      'issued',
    ]);
    const orderWithIssuedSimulation = await request<OrderResponse>(
      'GET',
      `/orders/${order.body.id}`,
      { token: tenant.accessToken },
    );
    expect(orderWithIssuedSimulation.body).toMatchObject({
      billingStatus: 'issued',
      activeInvoiceId: created.body.id,
      invoiceSeries: 'SIM',
      invoiceFolio: 25,
      paymentMethodCode: 'PPD',
      isPaid: false,
    });
    expect(orderWithIssuedSimulation.body.invoiceIssuedAt).toBeTruthy();
    const repeatedIssue = await request<SimulatedInvoiceResponse>(
      'POST',
      `/invoices/${created.body.id}/issue-simulation`,
      { token: tenant.accessToken },
    );
    expect(repeatedIssue.status).toBe(200);
    expect(repeatedIssue.body.events.map(({ eventType }) => eventType)).toEqual([
      'created',
      'updated',
      'issued',
    ]);
    for (const status of ['in_progress', 'cancelled']) {
      const blocked = await request<unknown>('POST', `/orders/${order.body.id}/status`, {
        token: tenant.accessToken,
        body: { status },
      });
      expect(blocked.status).toBe(409);
      expect(JSON.stringify(blocked.body)).toContain(created.body.id);
    }
    const paidWithPpd = await request<OrderResponse>(
      'PATCH',
      `/orders/${order.body.id}/payment-status`,
      { token: tenant.accessToken, body: { isPaid: true } },
    );
    expect(paidWithPpd.body.isPaid).toBe(true);
    const pendingWithPpd = await request<OrderResponse>(
      'PATCH',
      `/orders/${order.body.id}/payment-status`,
      { token: tenant.accessToken, body: { isPaid: false } },
    );
    expect(pendingWithPpd.body.isPaid).toBe(false);
    expect(
      (
        await request<unknown>('PATCH', `/invoices/${created.body.id}`, {
          token: tenant.accessToken,
          body: { cfdiUseCode: 'G03' },
        })
      ).status,
    ).toBe(400);

    const cancelled = await request<SimulatedInvoiceResponse>(
      'POST',
      `/invoices/${created.body.id}/cancel-simulation`,
      { token: tenant.accessToken },
    );
    expect(cancelled.status).toBe(200);
    expect(cancelled.body.status).toBe('cancelled');
    expect(cancelled.body.events.map(({ eventType }) => eventType)).toEqual([
      'created',
      'updated',
      'issued',
      'cancelled',
    ]);
    const orderWithCancelledSimulation = await request<OrderResponse>(
      'GET',
      `/orders/${order.body.id}`,
      { token: tenant.accessToken },
    );
    expect(orderWithCancelledSimulation.body).toMatchObject({
      billingStatus: 'cancelled',
      activeInvoiceId: null,
      invoiceSeries: 'SIM',
      invoiceFolio: 25,
      paymentMethodCode: 'PPD',
    });
    expect(orderWithCancelledSimulation.body.invoiceIssuedAt).toBeTruthy();
    const repeatedCancellation = await request<SimulatedInvoiceResponse>(
      'POST',
      `/invoices/${created.body.id}/cancel-simulation`,
      { token: tenant.accessToken },
    );
    expect(repeatedCancellation.status).toBe(200);
    expect(repeatedCancellation.body.events.map(({ eventType }) => eventType)).toEqual([
      'created',
      'updated',
      'issued',
      'cancelled',
    ]);

    const schema = quoteIdentifier(tenant.company.schemaName);
    const stored = await control.query<
      Array<{ fiscal_uuid: string | null; sat_seal: string | null; xml: string | null }>
    >(
      `SELECT
         to_jsonb(invoice)->>'fiscal_uuid' AS fiscal_uuid,
         to_jsonb(invoice)->>'sat_seal' AS sat_seal,
         to_jsonb(invoice)->>'xml' AS xml
       FROM ${schema}.simulated_invoices invoice WHERE id=$1`,
      [created.body.id],
    );
    expect(stored[0]).toEqual({ fiscal_uuid: null, sat_seal: null, xml: null });

    const replacementDraft = await request<SimulatedInvoiceResponse>('POST', '/invoices', {
      token: tenant.accessToken,
      body: {
        orderId: order.body.id,
        cfdiUseCode: 'G03',
        paymentFormCode: '99',
        paymentMethodCode: 'PPD',
      },
    });
    expect(replacementDraft.status).toBe(201);
    const orderWithReplacementDraft = await request<OrderResponse>(
      'GET',
      `/orders/${order.body.id}`,
      { token: tenant.accessToken },
    );
    expect(orderWithReplacementDraft.body).toMatchObject({
      billingStatus: 'draft',
      activeInvoiceId: replacementDraft.body.id,
      invoiceSeries: null,
      invoiceFolio: null,
      invoiceIssuedAt: null,
      paymentMethodCode: 'PPD',
    });
    const cancelDraft = await request<unknown>(
      'POST',
      `/invoices/${replacementDraft.body.id}/cancel-simulation`,
      { token: tenant.accessToken },
    );
    expect(cancelDraft.status).toBe(400);
    expect(JSON.stringify(cancelDraft.body)).toContain('descartarse');
    const discarded = await request<SimulatedInvoiceResponse>(
      'POST',
      `/invoices/${replacementDraft.body.id}/discard-draft`,
      { token: tenant.accessToken },
    );
    expect(discarded.status).toBe(200);
    expect(discarded.body.status).toBe('discarded');
    expect(discarded.body.events.map(({ eventType }) => eventType)).toEqual([
      'created',
      'discarded',
    ]);
    const repeatedDiscard = await request<SimulatedInvoiceResponse>(
      'POST',
      `/invoices/${replacementDraft.body.id}/discard-draft`,
      { token: tenant.accessToken },
    );
    expect(repeatedDiscard.status).toBe(200);
    expect(repeatedDiscard.body.events.map(({ eventType }) => eventType)).toEqual([
      'created',
      'discarded',
    ]);
    const reopenedAfterDiscard = await request<OrderResponse>(
      'POST',
      `/orders/${order.body.id}/status`,
      { token: tenant.accessToken, body: { status: 'in_progress' } },
    );
    expect(reopenedAfterDiscard.status).toBe(200);
    expect(
      (
        await request<OrderResponse>('POST', `/orders/${order.body.id}/status`, {
          token: tenant.accessToken,
          body: { status: 'completed' },
        })
      ).status,
    ).toBe(200);
    const paidOrder = await request<OrderResponse>(
      'PATCH',
      `/orders/${order.body.id}/payment-status`,
      { token: tenant.accessToken, body: { isPaid: true } },
    );
    expect(paidOrder.body.isPaid).toBe(true);
    const pueDraftRequests = await Promise.all([
      request<SimulatedInvoiceResponse>('POST', '/invoices', {
        token: tenant.accessToken,
        body: {
          orderId: order.body.id,
          cfdiUseCode: 'G03',
          paymentFormCode: '03',
          paymentMethodCode: 'PUE',
        },
      }),
      request<SimulatedInvoiceResponse>('POST', '/invoices', {
        token: tenant.accessToken,
        body: {
          orderId: order.body.id,
          cfdiUseCode: 'G03',
          paymentFormCode: '03',
          paymentMethodCode: 'PUE',
        },
      }),
    ]);
    expect(pueDraftRequests.map(({ status }) => status).sort()).toEqual([201, 409]);
    const pueDraft = pueDraftRequests.find(({ status }) => status === 201)!;
    const pueIssued = await request<SimulatedInvoiceResponse>(
      'POST',
      `/invoices/${pueDraft.body.id}/issue-simulation`,
      { token: tenant.accessToken },
    );
    expect(pueIssued.body).toMatchObject({
      status: 'issued',
      paymentMethodCode: 'PUE',
      collectionStatus: 'paid',
    });
    const blockedPending = await request<unknown>(
      'PATCH',
      `/orders/${order.body.id}/payment-status`,
      { token: tenant.accessToken, body: { isPaid: false } },
    );
    expect(blockedPending.status).toBe(409);
    expect(JSON.stringify(blockedPending.body)).toContain(pueDraft.body.id);
    expect(
      (
        await request<unknown>('POST', `/invoices/${pueDraft.body.id}/cancel-simulation`, {
          token: tenant.accessToken,
        })
      ).status,
    ).toBe(200);
    expect(
      (
        await request<OrderResponse>('PATCH', `/orders/${order.body.id}/payment-status`, {
          token: tenant.accessToken,
          body: { isPaid: false },
        })
      ).body.isPaid,
    ).toBe(false);
    expect(
      (
        await request<unknown>('GET', `/orders/${order.body.id}`, {
          token: controlPlan.accessToken,
        })
      ).status,
    ).toBe(404);

    const downgraded = await request<{
      planCode: string;
      features: string[];
      readOnlyFeatures: string[];
    }>('PATCH', `/subscriptions/companies/${tenant.company.id}`, {
      token: platformToken,
      body: {
        planCode: 'control',
        status: 'active',
        reason: 'Conservar simulaciones como historial de solo lectura',
      },
    });
    expect(downgraded.status).toBe(200);
    expect(downgraded.body.planCode).toBe('control');
    expect(downgraded.body.features).not.toContain('invoicing');
    expect(downgraded.body.readOnlyFeatures).toEqual(['invoicing']);

    const currentAfterDowngrade = await request<SubscriptionSummaryResponse>(
      'GET',
      '/subscriptions/current',
      { token: tenant.accessToken },
    );
    expect(currentAfterDowngrade.status).toBe(200);
    expect(currentAfterDowngrade.body).toMatchObject({
      planCode: 'control',
      readOnlyFeatures: ['invoicing'],
    });
    expect((await request<unknown>('GET', '/invoices', { token: tenant.accessToken })).status).toBe(
      200,
    );
    expect(
      (
        await request<SimulatedInvoiceResponse>('GET', `/invoices/${created.body.id}`, {
          token: tenant.accessToken,
        })
      ).body.status,
    ).toBe('cancelled');
    expect(
      (await request<unknown>('GET', '/invoices/settings', { token: tenant.accessToken })).status,
    ).toBe(403);
    expect(
      (
        await request<unknown>('PATCH', `/invoices/${created.body.id}`, {
          token: tenant.accessToken,
          body: { cfdiUseCode: 'G03' },
        })
      ).status,
    ).toBe(403);
    expect(
      (
        await request<unknown>('POST', `/invoices/${created.body.id}/issue-simulation`, {
          token: tenant.accessToken,
        })
      ).status,
    ).toBe(403);

    const essential = await request<{
      planCode: string;
      readOnlyFeatures: string[];
    }>('PATCH', `/subscriptions/companies/${tenant.company.id}`, {
      token: platformToken,
      body: {
        planCode: 'essential',
        status: 'active',
        reason: 'Ocultar módulos avanzados sin eliminar información',
      },
    });
    expect(essential.body).toMatchObject({ planCode: 'essential', readOnlyFeatures: [] });
    expect((await request<unknown>('GET', '/invoices', { token: tenant.accessToken })).status).toBe(
      403,
    );
    expect(
      (await request<unknown>('GET', '/catalogs/concepts', { token: tenant.accessToken })).status,
    ).toBe(403);

    const restored = await request<{
      planCode: string;
      readOnlyFeatures: string[];
    }>('PATCH', `/subscriptions/companies/${tenant.company.id}`, {
      token: platformToken,
      body: {
        planCode: 'invoicing',
        status: 'active',
        reason: 'Restaurar Facturación sin perder datos',
      },
    });
    expect(restored.body).toMatchObject({ planCode: 'invoicing', readOnlyFeatures: [] });
    expect(
      (
        await request<InvoiceSettingsResponse>('GET', '/invoices/settings', {
          token: tenant.accessToken,
        })
      ).body.mode,
    ).toBe('simulation');

    const planHistory = await control.query<
      Array<{ previous_plan_code: string | null; new_plan_code: string; reason: string | null }>
    >(
      `SELECT previous_plan_code, new_plan_code, reason
       FROM public.company_subscription_history
       WHERE company_id=$1 ORDER BY changed_at,id`,
      [tenant.company.id],
    );
    expect(planHistory).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          previous_plan_code: 'invoicing',
          new_plan_code: 'control',
        }),
        expect.objectContaining({
          previous_plan_code: 'control',
          new_plan_code: 'essential',
        }),
        expect.objectContaining({
          previous_plan_code: 'essential',
          new_plan_code: 'invoicing',
        }),
      ]),
    );

    const swagger = SwaggerModule.createDocument(app, new DocumentBuilder().build());
    expect(swagger.paths['/api/invoices']).toBeDefined();
    expect(swagger.paths['/api/invoices/catalogs']).toBeDefined();
    expect(swagger.paths['/api/invoices/{id}/issue-simulation']).toBeDefined();
    expect(swagger.paths['/api/invoices/{id}/cancel-simulation']).toBeDefined();
    expect(swagger.paths['/api/invoices/{id}/discard-draft']).toBeDefined();
    const documentSchema = JSON.stringify(swagger.components?.schemas?.SimulatedInvoiceResponseDto);
    const orderSchema = JSON.stringify(swagger.components?.schemas?.OrderResponseDto);
    expect(documentSchema).toContain('Simulación sin validez fiscal');
    expect(documentSchema).toContain('collectionStatus');
    expect(documentSchema).toContain('orderPaidAt');
    expect(orderSchema).toContain('billingStatus');
    expect(orderSchema).toContain('activeInvoiceId');
    expect(orderSchema).toContain('invoiceSeries');
    expect(orderSchema).toContain('invoiceFolio');
    expect(orderSchema).toContain('invoiceIssuedAt');
    expect(orderSchema).toContain('paymentMethodCode');
    expect(documentSchema).not.toContain('fiscalUuid');
    expect(documentSchema).not.toContain('satSeal');
  });

  it('revierte compañía, schema y versión si falla el aprovisionamiento', async () => {
    const schemasBefore = await tenantSchemaNames();
    const result = await createCompany('Rollback Integration', PLATFORM_EMAIL);

    expect(result.status).toBe(409);
    const companyRows = await control.query<unknown[]>(
      'SELECT 1 FROM public.companies WHERE name = $1',
      ['Rollback Integration'],
    );
    const versionRows = await control.query<unknown[]>(
      `SELECT 1 FROM public.tenant_schema_versions v
       JOIN public.companies c ON c.id = v.company_id
       WHERE c.name = $1`,
      ['Rollback Integration'],
    );
    expect(await tenantSchemaNames()).toEqual(schemasBefore);
    expect(companyRows).toHaveLength(0);
    expect(versionRows).toHaveLength(0);
  });

  it('rechaza un schema físico duplicado sin registrar la compañía', async () => {
    await control.query('CREATE SCHEMA "_9999_mul_duplicate_integration"');
    await control.query("SELECT setval('public.tenant_schema_number_seq', 9999, false)");
    const duplicate = await createCompany('Duplicate Integration', 'duplicate.attempt@test.local');
    expect(duplicate.status).toBe(409);

    const companies = await control.query<unknown[]>(
      'SELECT 1 FROM public.companies WHERE name = $1',
      ['Duplicate Integration'],
    );
    const attemptedUsers = await control.query<unknown[]>(
      'SELECT 1 FROM public.users WHERE email = $1',
      ['duplicate.attempt@test.local'],
    );
    expect(companies).toHaveLength(0);
    expect(attemptedUsers).toHaveLength(0);
  });

  it('aísla los clientes de dos tenants incluso al consultar un id ajeno', async () => {
    const alpha = await provisionAndLogin('Alpha Integration', 'alpha.admin@test.local');
    const beta = await provisionAndLogin('Beta Integration', 'beta.admin@test.local');

    const alphaClient = await request<ClientResponse>('POST', '/clients', {
      token: alpha.accessToken,
      body: { type: 'person', displayName: 'Cliente exclusivo Alpha' },
    });
    const betaClient = await request<ClientResponse>('POST', '/clients', {
      token: beta.accessToken,
      body: { type: 'person', displayName: 'Cliente exclusivo Beta' },
    });
    expect(alphaClient.status).toBe(201);
    expect(betaClient.status).toBe(201);

    const alphaList = await listClients(alpha.accessToken);
    const betaList = await listClients(beta.accessToken);
    expect(alphaList.body.items.map((client) => client.id)).toEqual([alphaClient.body.id]);
    expect(betaList.body.items.map((client) => client.id)).toEqual([betaClient.body.id]);

    const foreignLookup = await request<unknown>('GET', `/clients/${betaClient.body.id}`, {
      token: alpha.accessToken,
    });
    expect(foreignLookup.status).toBe(404);

    const [alphaRows, betaRows] = await Promise.all([
      control.query<Array<{ display_name: string }>>(
        `SELECT display_name FROM ${quoteIdentifier(alpha.company.schemaName)}.customers`,
      ),
      control.query<Array<{ display_name: string }>>(
        `SELECT display_name FROM ${quoteIdentifier(beta.company.schemaName)}.customers`,
      ),
    ]);
    expect(alphaRows).toEqual([{ display_name: 'Cliente exclusivo Alpha' }]);
    expect(betaRows).toEqual([{ display_name: 'Cliente exclusivo Beta' }]);
  });

  it('normaliza el perfil fiscal y valida el régimen para personas físicas y morales', async () => {
    const alpha = await provisionAndLogin('Fiscal Alpha Integration', 'fiscal.alpha@test.local');
    const beta = await provisionAndLogin('Fiscal Beta Integration', 'fiscal.beta@test.local');

    const personRegimes = await request<FiscalRegimeResponse[]>(
      'GET',
      '/clients/fiscal-regimes?customerType=person',
      { token: alpha.accessToken },
    );
    expect(personRegimes.status).toBe(200);
    expect(personRegimes.body.some((regime) => regime.code === '612')).toBe(true);
    expect(personRegimes.body.some((regime) => regime.code === '601')).toBe(false);

    const personUses = await request<CfdiUseResponse[]>(
      'GET',
      '/clients/cfdi-uses?customerType=person&fiscalRegimeCode=612',
      { token: alpha.accessToken },
    );
    expect(personUses.status).toBe(200);
    expect(personUses.body.map(({ code }) => code)).toEqual(
      expect.arrayContaining(['G01', 'G03', 'S01', 'CP01']),
    );
    expect(personUses.body.map(({ code }) => code)).not.toContain('CN01');
    expect(personUses.body.every(({ isActive }) => isActive)).toBe(true);

    const companyUses = await request<CfdiUseResponse[]>(
      'GET',
      '/clients/cfdi-uses?customerType=company&fiscalRegimeCode=601',
      { token: alpha.accessToken },
    );
    expect(companyUses.status).toBe(200);
    expect(companyUses.body.map(({ code }) => code)).toEqual(
      expect.arrayContaining(['G01', 'G03', 'S01', 'CP01']),
    );
    expect(companyUses.body.map(({ code }) => code)).not.toContain('D01');

    const payrollUses = await request<CfdiUseResponse[]>(
      'GET',
      '/clients/cfdi-uses?customerType=person&fiscalRegimeCode=605',
      { token: alpha.accessToken },
    );
    expect(payrollUses.status).toBe(200);
    expect(payrollUses.body.map(({ code }) => code)).toEqual(
      expect.arrayContaining(['D01', 'S01', 'CP01', 'CN01']),
    );
    expect(payrollUses.body.map(({ code }) => code)).not.toContain('G01');

    const created = await request<ClientResponse>('POST', '/clients', {
      token: alpha.accessToken,
      body: {
        type: 'person',
        displayName: 'Cliente Fiscal Alpha',
        taxId: 'lopa900101ab1',
        fiscalName: '  Ana   López Pérez ',
        fiscalPostalCode: '80000',
        fiscalRegimeCode: '612',
        preferredCfdiUseCode: 'g03',
      },
    });
    expect(created.status).toBe(201);
    expect(created.body).toMatchObject({
      fiscalName: 'ANA LÓPEZ PÉREZ',
      fiscalPostalCode: '80000',
      fiscalRegimeCode: '612',
      preferredCfdiUseCode: 'G03',
      fiscalReadiness: {
        isFiscalProfileComplete: true,
        isReadyToInvoice: true,
        missingFields: [],
        validationIssues: [],
      },
    });

    const companyCreated = await request<ClientResponse>('POST', '/clients', {
      token: alpha.accessToken,
      body: {
        type: 'company',
        displayName: 'Empresa Fiscal Alpha',
        taxId: 'fsa010101ab1',
        fiscalName: '  Empresa Fiscal Alpha, S.A. de C.V. ',
        fiscalPostalCode: '80000',
        fiscalRegimeCode: '601',
        preferredCfdiUseCode: 'G03',
      },
    });
    expect(companyCreated.status).toBe(201);
    expect(companyCreated.body).toMatchObject({
      type: 'company',
      taxId: 'FSA010101AB1',
      fiscalRegimeCode: '601',
      preferredCfdiUseCode: 'G03',
      fiscalReadiness: {
        isFiscalProfileComplete: true,
        isReadyToInvoice: true,
      },
    });

    const partial = await request<ClientResponse>('POST', '/clients', {
      token: alpha.accessToken,
      body: { type: 'person', displayName: 'Cliente fiscal pendiente' },
    });
    expect(partial.status).toBe(201);
    expect(partial.body.fiscalReadiness).toMatchObject({
      isFiscalProfileComplete: false,
      isReadyToInvoice: false,
      validationIssues: [],
    });
    expect(partial.body.fiscalReadiness.missingFields.map(({ code }) => code)).toEqual([
      'RFC_REQUIRED',
      'FISCAL_NAME_REQUIRED',
      'FISCAL_POSTAL_CODE_REQUIRED',
      'FISCAL_REGIME_REQUIRED',
      'CFDI_USE_REQUIRED',
    ]);

    const incompatible = await request<unknown>('POST', '/clients', {
      token: alpha.accessToken,
      body: {
        type: 'person',
        displayName: 'Régimen incompatible',
        fiscalRegimeCode: '601',
      },
    });
    expect(incompatible.status).toBe(400);

    const missingRegime = await request<unknown>('POST', '/clients', {
      token: alpha.accessToken,
      body: {
        type: 'person',
        displayName: 'Uso sin régimen',
        preferredCfdiUseCode: 'G03',
      },
    });
    expect(missingRegime.status).toBe(400);

    const unknownUse = await request<unknown>('POST', '/clients', {
      token: alpha.accessToken,
      body: {
        type: 'person',
        displayName: 'Uso inexistente',
        fiscalRegimeCode: '612',
        preferredCfdiUseCode: 'ZZZ',
      },
    });
    expect(unknownUse.status).toBe(400);

    const incompatiblePersonType = await request<unknown>('POST', '/clients', {
      token: alpha.accessToken,
      body: {
        type: 'company',
        displayName: 'Uso personal en empresa',
        fiscalRegimeCode: '601',
        preferredCfdiUseCode: 'D01',
      },
    });
    expect(incompatiblePersonType.status).toBe(400);

    const incompatibleUseRegime = await request<unknown>('POST', '/clients', {
      token: alpha.accessToken,
      body: {
        type: 'person',
        displayName: 'Uso incompatible con régimen',
        fiscalRegimeCode: '605',
        preferredCfdiUseCode: 'G01',
      },
    });
    expect(incompatibleUseRegime.status).toBe(400);

    await control.query("UPDATE public.sat_cfdi_uses SET is_active = false WHERE code = 'S01'");
    try {
      const inactiveUse = await request<unknown>('POST', '/clients', {
        token: alpha.accessToken,
        body: {
          type: 'person',
          displayName: 'Uso inactivo',
          fiscalRegimeCode: '612',
          preferredCfdiUseCode: 'S01',
        },
      });
      expect(inactiveUse.status).toBe(400);
    } finally {
      await control.query("UPDATE public.sat_cfdi_uses SET is_active = true WHERE code = 'S01'");
    }

    const cleared = await request<ClientResponse>('PATCH', `/clients/${created.body.id}`, {
      token: alpha.accessToken,
      body: { preferredCfdiUseCode: null },
    });
    expect(cleared.status).toBe(200);
    expect(cleared.body.preferredCfdiUseCode).toBeNull();
    expect(cleared.body.fiscalReadiness).toMatchObject({
      isFiscalProfileComplete: true,
      isReadyToInvoice: false,
    });
    expect(cleared.body.fiscalReadiness.missingFields).toEqual([
      expect.objectContaining({ code: 'CFDI_USE_REQUIRED', field: 'preferredCfdiUseCode' }),
    ]);

    await control.query(
      "UPDATE public.sat_fiscal_regimes SET is_active = false WHERE code = '612'",
    );
    try {
      const inactiveRegime = await request<ClientResponse>('GET', `/clients/${created.body.id}`, {
        token: alpha.accessToken,
      });
      expect(inactiveRegime.status).toBe(200);
      expect(inactiveRegime.body.fiscalReadiness.validationIssues).toContainEqual(
        expect.objectContaining({ code: 'FISCAL_REGIME_INACTIVE' }),
      );
      expect(inactiveRegime.body.fiscalReadiness.isFiscalProfileComplete).toBe(false);

      const ordinaryEditWithStaleCatalog = await request<ClientResponse>(
        'PATCH',
        `/clients/${created.body.id}`,
        {
          token: alpha.accessToken,
          body: {
            type: 'person',
            displayName: 'Cliente Fiscal Alpha actualizado',
            taxId: 'LOPA900101AB1',
            fiscalName: 'ANA LÓPEZ PÉREZ',
            fiscalPostalCode: '80000',
            fiscalRegimeCode: '612',
            preferredCfdiUseCode: null,
          },
        },
      );
      expect(ordinaryEditWithStaleCatalog.status).toBe(200);
      expect(ordinaryEditWithStaleCatalog.body.fiscalReadiness.validationIssues).toContainEqual(
        expect.objectContaining({ code: 'FISCAL_REGIME_INACTIVE' }),
      );
    } finally {
      await control.query(
        "UPDATE public.sat_fiscal_regimes SET is_active = true WHERE code = '612'",
      );
    }

    await request<ClientResponse>('PATCH', `/clients/${created.body.id}`, {
      token: alpha.accessToken,
      body: { preferredCfdiUseCode: 'G03' },
    });
    await control.query(
      "DELETE FROM public.sat_cfdi_use_fiscal_regimes WHERE cfdi_use_code = 'G03' AND fiscal_regime_code = '612'",
    );
    try {
      const incompatibleStoredUse = await request<ClientResponse>(
        'GET',
        `/clients/${created.body.id}`,
        { token: alpha.accessToken },
      );
      expect(incompatibleStoredUse.status).toBe(200);
      expect(incompatibleStoredUse.body.fiscalReadiness.validationIssues).toContainEqual(
        expect.objectContaining({ code: 'CFDI_USE_INCOMPATIBLE_WITH_FISCAL_REGIME' }),
      );
      expect(incompatibleStoredUse.body.fiscalReadiness.isReadyToInvoice).toBe(false);
    } finally {
      await control.query(
        `INSERT INTO public.sat_cfdi_use_fiscal_regimes
          (cfdi_use_code, fiscal_regime_code)
         VALUES ('G03', '612')
         ON CONFLICT DO NOTHING`,
      );
    }

    const readinessColumns = await control.query<Array<{ column_name: string }>>(
      `SELECT column_name
       FROM information_schema.columns
       WHERE table_schema = $1 AND table_name = 'customers'
         AND column_name IN ('is_fiscal_profile_complete', 'is_ready_to_invoice')`,
      [alpha.company.schemaName],
    );
    expect(readinessColumns).toEqual([]);

    const foreignLookup = await request<unknown>('GET', `/clients/${created.body.id}`, {
      token: beta.accessToken,
    });
    expect(foreignLookup.status).toBe(404);
    const foreignUpdate = await request<unknown>('PATCH', `/clients/${created.body.id}`, {
      token: beta.accessToken,
      body: { fiscalPostalCode: '81000' },
    });
    expect(foreignUpdate.status).toBe(404);

    const betaList = await listClients(beta.accessToken);
    expect(betaList.body.items).toHaveLength(0);

    const swagger = SwaggerModule.createDocument(app, new DocumentBuilder().build());
    const fiscalRegimesPath = Object.entries(swagger.paths).find(([path]) =>
      path.endsWith('/clients/fiscal-regimes'),
    )?.[1];
    const cfdiUsesPath = Object.entries(swagger.paths).find(([path]) =>
      path.endsWith('/clients/cfdi-uses'),
    )?.[1];
    expect(fiscalRegimesPath?.get).toBeDefined();
    expect(cfdiUsesPath?.get).toBeDefined();
    expect(JSON.stringify(fiscalRegimesPath?.get?.parameters)).toContain('customerType');
    expect(JSON.stringify(cfdiUsesPath?.get?.parameters)).toContain('customerType');
    expect(JSON.stringify(cfdiUsesPath?.get?.parameters)).toContain('fiscalRegimeCode');

    const schemas = swagger.components?.schemas as
      | Record<
          string,
          {
            properties?: Record<
              string,
              { nullable?: boolean; minLength?: number; maxLength?: number }
            >;
          }
        >
      | undefined;
    const expectedFiscalFields = {
      fiscalName: { minLength: 2, maxLength: 180 },
      fiscalPostalCode: { minLength: 5, maxLength: 5 },
      fiscalRegimeCode: { minLength: 3, maxLength: 3 },
      preferredCfdiUseCode: { minLength: 3, maxLength: 4 },
    };
    for (const schemaName of ['CreateClientDto', 'UpdateClientDto', 'ClientResponseDto']) {
      for (const [field, limits] of Object.entries(expectedFiscalFields)) {
        expect(schemas?.[schemaName]?.properties?.[field]).toMatchObject({
          nullable: true,
          ...limits,
        });
      }
    }
    const cfdiUseSchema = JSON.stringify(swagger.components?.schemas?.CfdiUseResponseDto);
    expect(cfdiUseSchema).toContain('description');
    expect(cfdiUseSchema).toContain('validFrom');
    const readinessSchema = JSON.stringify(swagger.components?.schemas?.FiscalReadinessResponseDto);
    expect(readinessSchema).toContain('isFiscalProfileComplete');
    expect(readinessSchema).toContain('isReadyToInvoice');
    expect(readinessSchema).toContain('missingFields');
    expect(readinessSchema).toContain('validationIssues');
  });

  it('valida la estructura y el tipo del RFC sin consultar el padrón del SAT', async () => {
    const alpha = await provisionAndLogin('RFC Alpha Integration', 'rfc.alpha@test.local');
    const beta = await provisionAndLogin('RFC Beta Integration', 'rfc.beta@test.local');

    const person = await request<ClientResponse>('POST', '/clients', {
      token: alpha.accessToken,
      body: {
        type: 'person',
        displayName: 'Persona con RFC',
        taxId: '  lopa900101ab1  ',
      },
    });
    expect(person.status).toBe(201);
    expect(person.body.taxId).toBe('LOPA900101AB1');

    const company = await request<ClientResponse>('POST', '/clients', {
      token: alpha.accessToken,
      body: { type: 'company', displayName: 'Empresa con RFC', taxId: 'mda010101ab1' },
    });
    expect(company.status).toBe(201);
    expect(company.body.taxId).toBe('MDA010101AB1');

    const genericNational = await request<ClientResponse>('POST', '/clients', {
      token: alpha.accessToken,
      body: {
        type: 'company',
        displayName: 'Público general',
        taxId: 'XAXX010101000',
      },
    });
    expect(genericNational.status).toBe(201);
    expect(genericNational.body.fiscalReadiness.missingFields).not.toContainEqual(
      expect.objectContaining({ field: 'taxId' }),
    );
    expect(genericNational.body.fiscalReadiness.validationIssues).not.toContainEqual(
      expect.objectContaining({ field: 'taxId' }),
    );

    const genericForeign = await request<ClientResponse>('POST', '/clients', {
      token: alpha.accessToken,
      body: {
        type: 'person',
        displayName: 'Residente extranjero',
        taxId: 'XEXX010101000',
      },
    });
    expect(genericForeign.status).toBe(201);
    expect(genericForeign.body.fiscalReadiness.missingFields).not.toContainEqual(
      expect.objectContaining({ field: 'taxId' }),
    );
    expect(genericForeign.body.fiscalReadiness.validationIssues).not.toContainEqual(
      expect.objectContaining({ field: 'taxId' }),
    );

    const emptyRfc = await request<ClientResponse>('POST', '/clients', {
      token: alpha.accessToken,
      body: { type: 'person', displayName: 'RFC vacío', taxId: '' },
    });
    expect(emptyRfc.status).toBe(201);
    expect(emptyRfc.body.taxId).toBeNull();

    const nullRfc = await request<ClientResponse>('POST', '/clients', {
      token: alpha.accessToken,
      body: { type: 'company', displayName: 'RFC nulo', taxId: null },
    });
    expect(nullRfc.status).toBe(201);
    expect(nullRfc.body.taxId).toBeNull();

    const invalidStructure = await request<unknown>('POST', '/clients', {
      token: alpha.accessToken,
      body: { type: 'person', displayName: 'RFC inválido', taxId: 'INVALIDO123' },
    });
    expect(invalidStructure.status).toBe(400);

    const moralAsPerson = await request<unknown>('POST', '/clients', {
      token: alpha.accessToken,
      body: { type: 'person', displayName: 'Moral como física', taxId: 'ABC010101AB1' },
    });
    expect(moralAsPerson.status).toBe(400);

    const personAsCompany = await request<unknown>('POST', '/clients', {
      token: alpha.accessToken,
      body: { type: 'company', displayName: 'Física como moral', taxId: 'CAMR900101AB1' },
    });
    expect(personAsCompany.status).toBe(400);

    const changing = await request<ClientResponse>('POST', '/clients', {
      token: alpha.accessToken,
      body: { type: 'person', displayName: 'Cambio de tipo', taxId: 'CAMR900101AB1' },
    });
    expect(changing.status).toBe(201);
    expect(
      (
        await request<unknown>('PATCH', `/clients/${changing.body.id}`, {
          token: alpha.accessToken,
          body: { type: 'company' },
        })
      ).status,
    ).toBe(400);

    const changedTogether = await request<ClientResponse>('PATCH', `/clients/${changing.body.id}`, {
      token: alpha.accessToken,
      body: { type: 'company', taxId: ' mec010101ab1 ' },
    });
    expect(changedTogether.status).toBe(200);
    expect(changedTogether.body).toMatchObject({ type: 'company', taxId: 'MEC010101AB1' });

    const removed = await request<ClientResponse>('PATCH', `/clients/${changing.body.id}`, {
      token: alpha.accessToken,
      body: { type: 'person', taxId: null },
    });
    expect(removed.status).toBe(200);
    expect(removed.body).toMatchObject({ type: 'person', taxId: null });

    const regimeClient = await request<ClientResponse>('POST', '/clients', {
      token: alpha.accessToken,
      body: {
        type: 'person',
        displayName: 'Cambio con régimen',
        fiscalRegimeCode: '612',
      },
    });
    expect(regimeClient.status).toBe(201);
    expect(
      (
        await request<unknown>('PATCH', `/clients/${regimeClient.body.id}`, {
          token: alpha.accessToken,
          body: { type: 'company' },
        })
      ).status,
    ).toBe(400);

    await expect(
      control.query(
        `UPDATE ${quoteIdentifier(alpha.company.schemaName)}.customers
         SET tax_id = 'RFC-INVALIDO' WHERE id = $1`,
        [person.body.id],
      ),
    ).rejects.toMatchObject({ code: '23514' });
    await expect(
      control.query(
        `UPDATE ${quoteIdentifier(alpha.company.schemaName)}.customers
         SET customer_type = 'company' WHERE id = $1`,
        [person.body.id],
      ),
    ).rejects.toMatchObject({ code: '23514' });

    const foreignLookup = await request<unknown>('GET', `/clients/${person.body.id}`, {
      token: beta.accessToken,
    });
    expect(foreignLookup.status).toBe(404);

    const swagger = SwaggerModule.createDocument(app, new DocumentBuilder().build());
    const createClientSchema = JSON.stringify(swagger.components?.schemas?.CreateClientDto);
    expect(createClientSchema).toContain('13 caracteres para persona física');
    expect(createClientSchema).toContain('XAXX010101000');
    expect(createClientSchema).toContain('XEXX010101000');
  });

  it('reutiliza el pool y libera las conexiones tenant después de cada solicitud', async () => {
    const tenant = await provisionAndLogin('Pool Integration', 'pool.admin@test.local');
    await listClients(tenant.accessToken);

    const dataSource = app.get(DataSource);
    const pool = (dataSource.driver as unknown as { master: PoolStats }).master;
    const initialTotal = pool.totalCount;

    for (let index = 0; index < 25; index += 1) {
      const response = await listClients(tenant.accessToken);
      expect(response.status).toBe(200);
    }
    await new Promise((resolve) => setTimeout(resolve, 25));

    expect(pool.totalCount).toBe(initialTotal);
    expect(pool.waitingCount).toBe(0);
    expect(pool.idleCount).toBe(pool.totalCount);
  });

  it('emite access tokens de 15 minutos y rechaza sesiones inactivas por más de 14 días', async () => {
    const tenant = await provisionAndLogin('Session Integration', 'session.admin@test.local');
    const active = await listClients(tenant.accessToken);
    expect(active.status).toBe(200);
    expect(active.setCookie).toBeNull();
    const payload = JSON.parse(
      Buffer.from(tenant.accessToken.split('.')[1]!, 'base64url').toString('utf8'),
    ) as { exp: number; iat: number; typ: string };
    expect(payload.exp - payload.iat).toBe(15 * 60);
    expect(payload.typ).toBe('access');

    await control.query(
      `UPDATE public.auth_sessions SET last_used_at = now() - interval '15 days'
       WHERE id = (
         SELECT id FROM public.auth_sessions WHERE user_id = $1
         ORDER BY created_at DESC LIMIT 1
       )`,
      [tenant.user.id],
    );
    expect((await listClients(tenant.accessToken)).status).toBe(401);
  });

  it('rota refresh tokens, detecta reutilización y revoca toda la sesión', async () => {
    const authenticated = await login(PLATFORM_EMAIL, PLATFORM_PASSWORD);
    expect(authenticated.status).toBe(200);
    expect(authenticated.setCookie).toContain('taller_refresh_token=');
    expect(authenticated.setCookie).toContain('HttpOnly');
    expect(authenticated.setCookie).toContain('SameSite=Lax');
    expect(authenticated.setCookie).toContain('Path=/api/auth');
    const firstCookie = cookiePair(authenticated.setCookie!);

    const rotated = await request<{ accessToken: string }>('POST', '/auth/refresh', {
      cookie: firstCookie,
      origin: 'http://127.0.0.1:4200',
    });
    expect(rotated.status).toBe(200);
    const secondCookie = cookiePair(rotated.setCookie!);
    expect(secondCookie).not.toBe(firstCookie);
    const sessionPayload = JSON.parse(
      Buffer.from(authenticated.body.accessToken.split('.')[1]!, 'base64url').toString('utf8'),
    ) as { jti: string };

    const tokenRows = await control.query<
      Array<{ generation: number; consumed_at: Date | null; token_hash: string }>
    >(
      `SELECT generation, consumed_at, token_hash
       FROM public.auth_refresh_tokens refresh
       JOIN public.auth_sessions session ON session.id = refresh.session_id
       WHERE session.id = $1
       ORDER BY refresh.generation`,
      [sessionPayload.jti],
    );
    expect(tokenRows.map(({ generation }) => generation).sort()).toEqual([1, 2]);
    expect(tokenRows.some(({ consumed_at }) => consumed_at !== null)).toBe(true);
    expect(tokenRows.every(({ token_hash }) => !firstCookie.includes(token_hash))).toBe(true);

    const reused = await request<unknown>('POST', '/auth/refresh', { cookie: firstCookie });
    expect(reused.status).toBe(401);
    expect((await request<unknown>('POST', '/auth/refresh', { cookie: secondCookie })).status).toBe(
      401,
    );
    expect(
      (
        await request<unknown>('GET', '/auth/me', {
          token: rotated.body.accessToken,
        })
      ).status,
    ).toBe(401);
  });

  it('restaura una sesión al reabrir el navegador sin persistir el access token', async () => {
    const authenticated = await login(PLATFORM_EMAIL, PLATFORM_PASSWORD);
    const persistedBrowserCookie = cookiePair(authenticated.setCookie!);

    // El access token vive sólo en memoria: al cerrar la pestaña se descarta.
    const restored = await request<{ accessToken: string }>('POST', '/auth/refresh', {
      cookie: persistedBrowserCookie,
    });
    expect(restored.status).toBe(200);
    expect(cookiePair(restored.setCookie!)).not.toBe(persistedBrowserCookie);
    expect(
      (
        await request<LoginResponse['user']>('GET', '/auth/me', {
          token: restored.body.accessToken,
        })
      ).status,
    ).toBe(200);
  });

  it('rechaza refresh tokens expirados y revoca su sesión', async () => {
    const authenticated = await login(PLATFORM_EMAIL, PLATFORM_PASSWORD);
    const cookie = cookiePair(authenticated.setCookie!);
    const payload = JSON.parse(
      Buffer.from(authenticated.body.accessToken.split('.')[1]!, 'base64url').toString('utf8'),
    ) as { jti: string };
    await control.query(
      `UPDATE public.auth_refresh_tokens
       SET issued_at = now() - interval '2 seconds',
           expires_at = now() - interval '1 second'
       WHERE session_id = $1`,
      [payload.jti],
    );

    expect((await request<unknown>('POST', '/auth/refresh', { cookie })).status).toBe(401);
    const sessions = await control.query<Array<{ revoked_at: Date | null }>>(
      'SELECT revoked_at FROM public.auth_sessions WHERE id = $1',
      [payload.jti],
    );
    expect(sessions[0]?.revoked_at).not.toBeNull();
  });

  it('revoca la sesión al cerrar sesión y rechaza orígenes no permitidos', async () => {
    const authenticated = await login(PLATFORM_EMAIL, PLATFORM_PASSWORD);
    const cookie = cookiePair(authenticated.setCookie!);

    const forbiddenOrigin = await request<LoginResponse>('POST', '/auth/login', {
      origin: 'https://sitio-malicioso.example',
      body: { identifier: PLATFORM_EMAIL, password: PLATFORM_PASSWORD },
    });
    expect(forbiddenOrigin.status).toBe(403);
    const missingOrigin = await request<LoginResponse>('POST', '/auth/login', {
      origin: null,
      body: { identifier: PLATFORM_EMAIL, password: PLATFORM_PASSWORD },
    });
    expect(missingOrigin.status).toBe(403);

    const loggedOut = await request<unknown>('POST', '/auth/logout', {
      cookie,
      origin: 'http://127.0.0.1:4200',
    });
    expect(loggedOut.status).toBe(204);
    expect(loggedOut.setCookie).toContain('taller_refresh_token=;');
    expect(
      (await request<unknown>('GET', '/auth/me', { token: authenticated.body.accessToken })).status,
    ).toBe(401);
    expect((await request<unknown>('POST', '/auth/refresh', { cookie })).status).toBe(401);
  });

  it('documenta el refresh token como cookie y la protección de origen', () => {
    const swagger = SwaggerModule.createDocument(
      app,
      new DocumentBuilder()
        .addCookieAuth('taller_refresh_token', { type: 'apiKey', in: 'cookie' }, 'refreshCookie')
        .build(),
    );
    expect(swagger.components?.securitySchemes?.refreshCookie).toMatchObject({
      type: 'apiKey',
      in: 'cookie',
      name: 'taller_refresh_token',
    });
    const refreshPath = Object.entries(swagger.paths).find(([path]) =>
      path.endsWith('/auth/refresh'),
    )?.[1];
    expect(refreshPath?.post?.security).toContainEqual({ refreshCookie: [] });
    expect(refreshPath?.post?.responses).toHaveProperty('403');
    const schemas = swagger.components?.schemas as
      | Record<
          string,
          {
            properties?: Record<string, { enum?: string[]; items?: { enum?: string[] } }>;
          }
        >
      | undefined;
    expect(schemas?.CreateCompanyDto?.properties).not.toHaveProperty('trialDays');
    expect(schemas?.SubscriptionResponseDto?.properties).not.toHaveProperty('trialStartsAt');
    expect(schemas?.SubscriptionResponseDto?.properties).not.toHaveProperty('trialEndsAt');
    expect(schemas?.SubscriptionResponseDto?.properties).not.toHaveProperty(
      'currentPeriodStartsAt',
    );
    expect(schemas?.SubscriptionResponseDto?.properties).not.toHaveProperty('currentPeriodEndsAt');
    expect(schemas?.ChangeSubscriptionDto?.properties).not.toHaveProperty('trialEndsAt');
    expect(schemas?.ChangeSubscriptionDto?.properties).not.toHaveProperty('currentPeriodEndsAt');
    expect(schemas?.ChangeSubscriptionDto?.properties?.status?.enum).not.toContain('trialing');
    expect(schemas?.SubscriptionResponseDto?.properties?.features?.items?.enum).toEqual(
      expect.arrayContaining([
        'dashboard',
        'vehicle_catalog',
        'user_management',
        'suppliers',
        'purchases',
      ]),
    );
    const platformCompanyUsersPath = Object.entries(swagger.paths).find(([path]) =>
      path.endsWith('/companies/{companyId}/users'),
    )?.[1];
    expect(platformCompanyUsersPath?.get?.responses).toHaveProperty('200');
    expect(platformCompanyUsersPath?.post?.responses).toHaveProperty('201');
    expect(schemas?.CreatePlatformCompanyUserDto?.properties?.role?.enum).toEqual([
      'company_admin',
      'admin',
      'user',
    ]);
  });

  it('cambia de plan sin borrar datos y bloquea capacidades cuando se suspende', async () => {
    const tenant = await provisionAndLogin('Subscription Integration', 'plans.admin@test.local');
    const initial = await request<{
      planCode: string;
      status: string;
      features: string[];
      limits: { max_users: number };
    }>('GET', '/subscriptions/current', { token: tenant.accessToken });
    expect(initial.status).toBe(200);
    expect(initial.body).toMatchObject({
      planCode: 'essential',
      status: 'active',
      limits: { max_users: 3 },
    });
    expect(initial.body).not.toHaveProperty('trialStartsAt');
    expect(initial.body).not.toHaveProperty('trialEndsAt');
    expect(initial.body.features).toEqual(
      expect.arrayContaining([
        'dashboard',
        'customer_history',
        'vehicle_history',
        'vehicle_catalog',
        'service_orders',
        'free_order_items',
        'expenses',
        'profitability',
        'user_management',
      ]),
    );
    for (const unavailable of [
      'item_catalog',
      'suppliers',
      'purchases',
      'inventory',
      'invoicing',
    ]) {
      expect(initial.body.features).not.toContain(unavailable);
    }
    expect(
      (await request<unknown>('GET', '/expenses/categories', { token: tenant.accessToken })).status,
    ).toBe(200);
    expect(
      (
        await request<unknown>(
          'GET',
          '/profitability?occurredFrom=2026-10-01&occurredTo=2026-10-31',
          { token: tenant.accessToken },
        )
      ).status,
    ).toBe(200);
    for (const path of ['/catalogs/concepts', '/suppliers', '/purchases', '/inventory/products']) {
      expect((await request<unknown>('GET', path, { token: tenant.accessToken })).status).toBe(403);
    }

    const subscriptionColumns = await control.query<Array<{ column_name: string }>>(
      `SELECT column_name
       FROM information_schema.columns
       WHERE table_schema = 'public' AND table_name = 'company_subscriptions'`,
    );
    expect(subscriptionColumns.map(({ column_name }) => column_name)).not.toEqual(
      expect.arrayContaining(['trial_starts_at', 'trial_ends_at']),
    );

    for (const username of ['limite_uno', 'limite_dos']) {
      const created = await request<UserResponse>('POST', '/users', {
        token: tenant.accessToken,
        body: {
          fullName: `Usuario ${username}`,
          username,
          phone: username === 'limite_uno' ? '+526671110001' : '+526671110002',
          password: USER_PASSWORD,
          timezoneCode: 'America/Mazatlan',
          role: 'user',
        },
      });
      expect(created.status).toBe(201);
    }
    const overLimit = await request<unknown>('POST', '/users', {
      token: tenant.accessToken,
      body: {
        fullName: 'Usuario fuera del límite',
        username: 'limite_tres',
        phone: '+526671110003',
        password: USER_PASSWORD,
        timezoneCode: 'America/Mazatlan',
        role: 'user',
      },
    });
    expect(overLimit.status).toBe(409);

    const permissionsBeforePlanChanges = await control.query<
      Array<{ user_id: string; permission_code: string }>
    >(
      `SELECT permission_profile.user_id::text, permission_profile.permission_code
       FROM public.user_permissions permission_profile
       JOIN public.users user_account ON user_account.id = permission_profile.user_id
       WHERE user_account.company_id = $1
       ORDER BY permission_profile.user_id, permission_profile.permission_code`,
      [tenant.company.id],
    );

    const client = await request<ClientResponse>('POST', '/clients', {
      token: tenant.accessToken,
      body: { type: 'person', displayName: 'Cliente conservado por suscripción' },
    });
    expect(client.status).toBe(201);
    const brand = await request<VehicleBrandResponse>('POST', '/catalogs/vehicle-brands', {
      token: tenant.accessToken,
      body: { name: 'Marca conservada por suscripción' },
    });
    const model = await request<VehicleModelResponse>('POST', '/catalogs/vehicle-models', {
      token: tenant.accessToken,
      body: { brandId: brand.body.id, name: 'Modelo conservado por suscripción' },
    });
    const vehicle = await request<VehicleResponse>('POST', `/clients/${client.body.id}/vehicles`, {
      token: tenant.accessToken,
      body: {
        brandId: brand.body.id,
        modelId: model.body.id,
        year: 2026,
        color: 'Azul',
      },
    });
    expect(vehicle.status).toBe(201);

    const upgraded = await request<{
      planCode: string;
      status: string;
      features: string[];
    }>('PATCH', `/subscriptions/companies/${tenant.company.id}`, {
      token: platformToken,
      body: { planCode: 'control', status: 'active', reason: 'Prueba de integración' },
    });
    expect(upgraded.status).toBe(200);
    expect(upgraded.body.planCode).toBe('control');
    expect(upgraded.body.features).toEqual(
      expect.arrayContaining([
        'item_catalog',
        'suppliers',
        'purchases',
        'inventory',
        'expenses',
        'profitability',
      ]),
    );

    const units = await request<MeasurementUnitResponse[]>('GET', '/catalogs/units', {
      token: tenant.accessToken,
    });
    const serviceUnit = units.body.find(({ name }) => name === 'Servicio')!;
    const catalogService = await request<ConceptResponse>('POST', '/catalogs/concepts', {
      token: tenant.accessToken,
      body: {
        kind: 'service',
        name: 'Servicio histórico conservado',
        unitId: serviceUnit.id,
        cost: 100,
        price: 500,
        tracksInventory: false,
      },
    });
    expect(catalogService.status).toBe(201);
    const catalogOrder = await request<OrderResponse>('POST', '/orders', {
      token: tenant.accessToken,
      body: {
        customerId: client.body.id,
        vehicleId: vehicle.body.id,
        items: [{ productServiceId: catalogService.body.id, quantity: 1 }],
      },
    });
    expect(catalogOrder.status).toBe(201);

    const downgraded = await request<{ planCode: string; features: string[] }>(
      'PATCH',
      `/subscriptions/companies/${tenant.company.id}`,
      {
        token: platformToken,
        body: { planCode: 'essential', status: 'active', reason: 'Validar descenso seguro' },
      },
    );
    expect(downgraded.status).toBe(200);
    expect(downgraded.body.planCode).toBe('essential');
    expect(downgraded.body.features).not.toContain('item_catalog');
    expect(
      (await request<unknown>('GET', '/catalogs/concepts', { token: tenant.accessToken })).status,
    ).toBe(403);
    const historicalOrder = await request<OrderResponse>('GET', `/orders/${catalogOrder.body.id}`, {
      token: tenant.accessToken,
    });
    expect(historicalOrder.status).toBe(200);
    expect(historicalOrder.body.items[0]).toMatchObject({
      productServiceId: catalogService.body.id,
      description: 'Servicio histórico conservado',
      unitPrice: '500.00',
      unitCost: '100.00',
    });
    const editedHistoricalOrder = await request<OrderResponse>(
      'PATCH',
      `/orders/${catalogOrder.body.id}`,
      {
        token: tenant.accessToken,
        body: {
          items: [
            {
              itemId: catalogOrder.body.items[0]!.id,
              productServiceId: catalogService.body.id,
              quantity: 1,
              unitPrice: 550,
            },
          ],
        },
      },
    );
    expect(editedHistoricalOrder.status).toBe(200);
    expect(editedHistoricalOrder.body.items[0]).toMatchObject({
      description: 'Servicio histórico conservado',
      unitPrice: '550.00',
      unitCost: '100.00',
    });

    const restoredControl = await request<{ planCode: string }>(
      'PATCH',
      `/subscriptions/companies/${tenant.company.id}`,
      {
        token: platformToken,
        body: { planCode: 'control', status: 'active', reason: 'Validar restauración' },
      },
    );
    expect(restoredControl.status).toBe(200);
    const restoredCatalog = await request<{ totalItems: number; items: ConceptResponse[] }>(
      'GET',
      '/catalogs/concepts?search=Servicio%20hist%C3%B3rico%20conservado',
      { token: tenant.accessToken },
    );
    expect(restoredCatalog.status).toBe(200);
    expect(restoredCatalog.body.items.map(({ id }) => id)).toContain(catalogService.body.id);

    const activeSession = await login(tenant.company.admin.loginName, PERMANENT_PASSWORD);
    expect(activeSession.status).toBe(200);
    const activeCookie = cookiePair(activeSession.setCookie!);

    const suspended = await request<unknown>(
      'PATCH',
      `/subscriptions/companies/${tenant.company.id}`,
      {
        token: platformToken,
        body: { planCode: 'essential', status: 'suspended', reason: 'Prueba de suspensión' },
      },
    );
    expect(suspended.status).toBe(200);
    expect(
      (
        await control.query<Array<{ is_active: boolean }>>(
          'SELECT is_active FROM public.companies WHERE id = $1',
          [tenant.company.id],
        )
      )[0]?.is_active,
    ).toBe(false);
    expect((await listClients(tenant.accessToken)).status).toBe(401);
    expect((await login(tenant.company.admin.loginName, PERMANENT_PASSWORD)).status).toBe(401);
    expect((await request<unknown>('POST', '/auth/refresh', { cookie: activeCookie })).status).toBe(
      401,
    );

    const reactivated = await request<unknown>(
      'PATCH',
      `/subscriptions/companies/${tenant.company.id}`,
      {
        token: platformToken,
        body: { planCode: 'essential', status: 'active', reason: 'Reactivación' },
      },
    );
    expect(reactivated.status).toBe(200);
    expect(
      (
        await control.query<Array<{ is_active: boolean }>>(
          'SELECT is_active FROM public.companies WHERE id = $1',
          [tenant.company.id],
        )
      )[0]?.is_active,
    ).toBe(true);
    expect((await request<unknown>('POST', '/auth/refresh', { cookie: activeCookie })).status).toBe(
      401,
    );
    const restoredSession = await login(tenant.company.admin.loginName, PERMANENT_PASSWORD);
    expect(restoredSession.status).toBe(200);
    const restored = await listClients(restoredSession.body.accessToken);
    expect(restored.status).toBe(200);
    expect(restored.body.items.map(({ id }) => id)).toContain(client.body.id);
    const permissionsAfterPlanChanges = await control.query<
      Array<{ user_id: string; permission_code: string }>
    >(
      `SELECT permission_profile.user_id::text, permission_profile.permission_code
       FROM public.user_permissions permission_profile
       JOIN public.users user_account ON user_account.id = permission_profile.user_id
       WHERE user_account.company_id = $1
       ORDER BY permission_profile.user_id, permission_profile.permission_code`,
      [tenant.company.id],
    );
    expect(permissionsAfterPlanChanges).toEqual(permissionsBeforePlanChanges);
  });

  it.each([
    ['essential', 'Esencial'],
    ['control', 'Control'],
    ['invoicing', 'Facturación'],
  ] as const)('crea una compañía activa con el plan %s', async (planCode, planName) => {
    const company = await createCompany(
      `Onboarding ${planName}`,
      `onboarding.${planCode}@test.local`,
      planCode,
    );
    expect(company.status).toBe(201);

    const subscriptions = await control.query<Array<{ plan_code: string; status: string }>>(
      `SELECT plan_code, status
       FROM public.company_subscriptions
       WHERE company_id = $1`,
      [company.body.id],
    );
    expect(subscriptions[0]).toEqual({ plan_code: planCode, status: 'active' });

    const authenticated = await login(company.body.admin.loginName, TENANT_PASSWORD);
    expect(authenticated.status).toBe(200);
    expect(authenticated.body.user.subscription).toMatchObject({
      planCode,
      status: 'active',
      usable: true,
    });
  });

  it('opera Esencial de punta a punta sin catálogo, proveedor visible ni inventario', async () => {
    const tenant = await provisionAndLogin(
      'Essential Full Flow Integration',
      'essential.flow@test.local',
    );
    const customer = await request<ClientResponse>('POST', '/clients', {
      token: tenant.accessToken,
      body: { type: 'person', displayName: 'Cliente Esencial Integral' },
    });
    const brand = await request<VehicleBrandResponse>('POST', '/catalogs/vehicle-brands', {
      token: tenant.accessToken,
      body: { name: 'Marca Esencial Integral' },
    });
    const model = await request<VehicleModelResponse>('POST', '/catalogs/vehicle-models', {
      token: tenant.accessToken,
      body: { brandId: brand.body.id, name: 'Modelo Esencial Integral' },
    });
    const vehicle = await request<VehicleResponse>(
      'POST',
      `/clients/${customer.body.id}/vehicles`,
      {
        token: tenant.accessToken,
        body: {
          brandId: brand.body.id,
          modelId: model.body.id,
          year: 2025,
          color: 'Gris',
        },
      },
    );
    const order = await request<OrderResponse>('POST', '/orders', {
      token: tenant.accessToken,
      body: {
        customerId: customer.body.id,
        vehicleId: vehicle.body.id,
        items: [
          {
            kind: 'service',
            description: 'Afinación mayor',
            quantity: 1,
            unitPrice: 2100,
          },
          {
            kind: 'product',
            description: 'Aceite y filtros incluidos',
            quantity: 1,
            unitCost: 500,
          },
          {
            kind: 'product',
            description: 'Aditivo cobrado por separado',
            quantity: 1,
            unitPrice: 300,
            unitCost: 100,
            affectsOrderTotal: true,
          },
        ],
      },
    });
    expect(order.status).toBe(201);
    expect(order.body).toMatchObject({
      total: '2400.00',
      totalCost: '600.00',
      grossProfit: '1800.00',
      hasUnknownCosts: false,
      isFinanciallyComplete: true,
    });
    expect(order.body.items.every(({ productServiceId }) => productServiceId === null)).toBe(true);

    const completed = await request<OrderResponse>('POST', `/orders/${order.body.id}/status`, {
      token: tenant.accessToken,
      body: { status: 'completed' },
    });
    expect(completed.body).toMatchObject({
      status: 'completed',
      inventoryAppliedAt: null,
      grossProfit: '1800.00',
    });
    const schema = quoteIdentifier(tenant.company.schemaName);
    await control.query(
      `UPDATE ${schema}.orders SET closed_at = '2026-10-10 18:00:00+00' WHERE id = $1`,
      [order.body.id],
    );
    const movements = await control.query<Array<{ total: string }>>(
      `SELECT count(*)::text AS total FROM ${schema}.inventory_movements WHERE order_id = $1`,
      [order.body.id],
    );
    expect(movements[0]?.total).toBe('0');

    const categories = await request<ExpenseCategoryResponse[]>('GET', '/expenses/categories', {
      token: tenant.accessToken,
    });
    const expense = await request<ExpenseResponse>('POST', '/expenses', {
      token: tenant.accessToken,
      body: {
        categoryId: categories.body.find(({ code }) => code === 'utilities')!.id,
        occurredOn: '2026-10-10',
        description: 'Electricidad del taller',
        amount: 300,
      },
    });
    expect(expense.status).toBe(201);
    expect(expense.body).toMatchObject({
      status: 'confirmed',
      supplier: { commercialName: 'Proveedor general', isDefault: true },
    });
    const paid = await request<OrderResponse>('PATCH', `/orders/${order.body.id}/payment-status`, {
      token: tenant.accessToken,
      body: { isPaid: true },
    });
    expect(paid.body.isPaid).toBe(true);

    const dashboard = await request<DashboardSummaryResponse>('GET', '/dashboard/summary', {
      token: tenant.accessToken,
    });
    expect(dashboard.status).toBe(200);
    expect(dashboard.body).toMatchObject({
      access: {
        planCode: 'essential',
        includesFinancials: true,
        includesLowStock: false,
      },
      revenue: {
        generated: '2400.00',
        collected: '2400.00',
        outstanding: '0.00',
      },
      financials: {
        directCost: '600.00',
        grossProfit: '1800.00',
        operatingExpenses: '300.00',
        operatingProfit: '1500.00',
        isComplete: true,
      },
      lowStock: null,
    });
    const activity = await request<DashboardActivityResponse>('GET', '/dashboard/activity', {
      token: tenant.accessToken,
    });
    expect(activity.status).toBe(200);
    expect(activity.body).toMatchObject({
      recentPurchases: null,
      recentInventoryMovements: null,
      lowStock: null,
    });
    expect(activity.body.recentExpenses?.map(({ id }) => id)).toContain(expense.body.id);

    const report = await request<ProfitabilityReportResponse>(
      'GET',
      '/profitability?occurredFrom=2026-10-01&occurredTo=2026-10-31',
      { token: tenant.accessToken },
    );
    expect(report.status).toBe(200);
    expect(report.body.totals).toMatchObject({
      income: '2400.00',
      directCost: '600.00',
      grossProfit: '1800.00',
      operatingExpenses: '300.00',
      netProfit: '1500.00',
      isComplete: true,
    });
    const monthly = await request<MonthlyProfitabilityReportResponse>(
      'GET',
      '/profitability/monthly-report?year=2026&month=10',
      { token: tenant.accessToken },
    );
    expect(monthly.status).toBe(200);
    expect(monthly.body.summary).toMatchObject({
      completedOrderCount: 1,
      generatedIncome: '2400.00',
      directCost: '600.00',
      operatingExpenses: '300.00',
      netProfit: '1500.00',
      isComplete: true,
    });
    expect(
      (
        await requestBinary(
          '/profitability/monthly-report.xlsx?year=2026&month=10',
          tenant.accessToken,
        )
      ).status,
    ).toBe(200);

    for (const path of ['/catalogs/concepts', '/suppliers', '/purchases', '/inventory/products']) {
      expect((await request<unknown>('GET', path, { token: tenant.accessToken })).status).toBe(403);
    }
  });

  it('mantiene la activación manual aun cuando exista una vigencia histórica vencida', async () => {
    const tenant = await provisionAndLogin(
      'Legacy Period Compatibility',
      'legacy.period@test.local',
    );
    await control.query(
      `UPDATE public.company_subscriptions
       SET current_period_ends_at = now() - interval '1 day'
       WHERE company_id = $1`,
      [tenant.company.id],
    );

    await request<unknown>('PATCH', `/subscriptions/companies/${tenant.company.id}`, {
      token: platformToken,
      body: { planCode: 'essential', status: 'active', reason: 'Activación manual' },
    });
    expect((await login(tenant.company.admin.loginName, PERMANENT_PASSWORD)).status).toBe(200);
  });

  it('permite al platform_admin crear usuarios con permisos dentro de una compañía', async () => {
    const tenant = await provisionAndLogin(
      'Platform User Management',
      'platform.users.admin@test.local',
    );
    const permissionCatalog = await request<Array<{ code: string }>>('GET', '/permissions', {
      token: platformToken,
    });
    const templates = await request<Array<{ code: string }>>('GET', '/permissions/templates', {
      token: platformToken,
    });
    expect(permissionCatalog.status).toBe(200);
    expect(permissionCatalog.body.map(({ code }) => code)).toContain('clients.create');
    expect(templates.status).toBe(200);
    expect(templates.body.map(({ code }) => code)).toContain('reception');

    const created = await request<{
      user: UserResponse;
      templateCode: string | null;
      isCustomized: boolean;
      automatic: boolean;
      permissionCodes: string[];
    }>('POST', `/companies/${tenant.company.id}/users`, {
      token: platformToken,
      body: {
        fullName: 'Recepción creada por plataforma',
        username: 'recepcion_plataforma',
        email: null,
        phone: '+526671115501',
        password: 'Alta26a',
        timezoneCode: 'America/Mazatlan',
        role: 'user',
        templateCode: 'reception',
        permissionCodes: ['dashboard.view', 'clients.view', 'clients.create'],
      },
    });
    expect(created.status).toBe(201);
    expect(created.body.user).toMatchObject({
      companyId: tenant.company.id,
      role: 'user',
      loginName: `recepcion_plataforma@${tenant.company.loginCode}`,
      mustChangePassword: true,
    });
    expect(created.body).toMatchObject({
      templateCode: 'reception',
      isCustomized: true,
      automatic: false,
      permissionCodes: ['clients.create', 'clients.view', 'dashboard.view'],
    });

    const listed = await request<PaginatedUsersResponse>(
      'GET',
      `/companies/${tenant.company.id}/users?page=1&limit=20&search=recepcion_plataforma`,
      { token: platformToken },
    );
    expect(listed.status).toBe(200);
    expect(listed.body.items).toHaveLength(1);
    expect(listed.body.items[0]?.id).toBe(created.body.user.id);

    const temporaryLogin = await login(created.body.user.loginName, 'Alta26a');
    expect(temporaryLogin.status).toBe(200);
    expect(temporaryLogin.body.user.mustChangePassword).toBe(true);
    expect(temporaryLogin.body.user.permissions).toEqual([
      'dashboard.view',
      'clients.view',
      'clients.create',
    ]);

    const detail = await request<{
      user: UserResponse;
      templateCode: string | null;
      isCustomized: boolean;
      automatic: boolean;
      permissionCodes: string[];
    }>('GET', `/companies/${tenant.company.id}/users/${created.body.user.id}`, {
      token: platformToken,
    });
    expect(detail.status).toBe(200);
    expect(detail.body).toMatchObject({
      user: { id: created.body.user.id, role: 'user', isActive: true },
      templateCode: 'reception',
      isCustomized: true,
      automatic: false,
    });

    const updated = await request<typeof detail.body>(
      'PATCH',
      `/companies/${tenant.company.id}/users/${created.body.user.id}`,
      {
        token: platformToken,
        body: {
          fullName: 'Administración actualizada por plataforma',
          role: 'admin',
          templateCode: null,
          permissionCodes: ['dashboard.view', 'users.view', 'users.manage', 'permissions.manage'],
        },
      },
    );
    expect(updated.status).toBe(200);
    expect(updated.body).toMatchObject({
      user: {
        fullName: 'Administración actualizada por plataforma',
        role: 'admin',
        isActive: true,
      },
      templateCode: null,
      isCustomized: true,
      automatic: false,
      permissionCodes: ['dashboard.view', 'permissions.manage', 'users.manage', 'users.view'],
    });
    expect(
      (
        await request<unknown>('GET', '/auth/me', {
          token: temporaryLogin.body.accessToken,
        })
      ).status,
    ).toBe(401);
    expect(
      (
        await request<unknown>('POST', '/auth/refresh', {
          cookie: cookiePair(temporaryLogin.setCookie!),
        })
      ).status,
    ).toBe(401);

    const updatedLogin = await login(created.body.user.loginName, 'Alta26a');
    expect(updatedLogin.status).toBe(200);
    expect(updatedLogin.body.user).toMatchObject({
      role: 'admin',
      permissions: ['dashboard.view', 'users.view', 'users.manage', 'permissions.manage'],
    });

    const deactivated = await request<typeof detail.body>(
      'DELETE',
      `/companies/${tenant.company.id}/users/${created.body.user.id}`,
      { token: platformToken },
    );
    expect(deactivated.status).toBe(200);
    expect(deactivated.body.user.isActive).toBe(false);
    expect(
      (await request<unknown>('GET', '/auth/me', { token: updatedLogin.body.accessToken })).status,
    ).toBe(401);
    expect((await login(created.body.user.loginName, 'Alta26a')).status).toBe(401);

    const reactivated = await request<typeof detail.body>(
      'PATCH',
      `/companies/${tenant.company.id}/users/${created.body.user.id}/activate`,
      { token: platformToken },
    );
    expect(reactivated.status).toBe(200);
    expect(reactivated.body).toMatchObject({
      user: { isActive: true, role: 'admin' },
      permissionCodes: ['dashboard.view', 'permissions.manage', 'users.manage', 'users.view'],
    });
    expect((await login(created.body.user.loginName, 'Alta26a')).status).toBe(200);

    const incompatibleEdit = await request<unknown>(
      'PATCH',
      `/companies/${tenant.company.id}/users/${created.body.user.id}`,
      {
        token: platformToken,
        body: {
          fullName: 'Este cambio debe revertirse',
          role: 'user',
          templateCode: null,
          permissionCodes: ['users.manage'],
        },
      },
    );
    expect(incompatibleEdit.status).toBe(400);
    const afterRollback = await request<typeof detail.body>(
      'GET',
      `/companies/${tenant.company.id}/users/${created.body.user.id}`,
      { token: platformToken },
    );
    expect(afterRollback.body.user).toMatchObject({
      fullName: 'Administración actualizada por plataforma',
      role: 'admin',
      isActive: true,
    });

    const tenantEditAttempt = await request<unknown>(
      'PATCH',
      `/companies/${tenant.company.id}/users/${created.body.user.id}`,
      {
        token: tenant.accessToken,
        body: { fullName: 'Intento sin permiso' },
      },
    );
    expect(tenantEditAttempt.status).toBe(403);

    const lastCompanyAdmin = await request<unknown>(
      'DELETE',
      `/companies/${tenant.company.id}/users/${tenant.user.id}`,
      { token: platformToken },
    );
    expect(lastCompanyAdmin.status).toBe(409);

    const audit = await control.query<
      Array<{
        company_id: string;
        target_user_id: string;
        actor_user_id: string;
        event_type: string;
        target_role: string;
        previous_role: string | null;
        previous_is_active: boolean | null;
        current_is_active: boolean | null;
        template_code: string | null;
        previous_permission_codes: string[];
        permission_codes: string[];
        changes: Record<string, unknown>;
      }>
    >(
      `SELECT company_id, target_user_id, actor_user_id, event_type,
              previous_role, target_role, previous_is_active, current_is_active,
              previous_template_code, template_code,
              previous_permission_codes, permission_codes, changes
       FROM public.platform_company_user_events
       WHERE target_user_id = $1
       ORDER BY created_at, id`,
      [created.body.user.id],
    );
    expect(audit).toHaveLength(4);
    expect(audit[0]).toMatchObject({
      company_id: tenant.company.id,
      target_user_id: created.body.user.id,
      event_type: 'user_created',
      target_role: 'user',
      template_code: 'reception',
      permission_codes: ['clients.create', 'clients.view', 'dashboard.view'],
    });
    expect(audit[0]?.actor_user_id).toBeTruthy();
    expect(audit[1]).toMatchObject({
      event_type: 'user_updated',
      previous_role: 'user',
      target_role: 'admin',
      previous_is_active: true,
      current_is_active: true,
      previous_permission_codes: ['clients.create', 'clients.view', 'dashboard.view'],
      permission_codes: ['dashboard.view', 'permissions.manage', 'users.manage', 'users.view'],
    });
    expect(audit[1]?.changes).toHaveProperty('permissionCodes');
    expect(audit[2]).toMatchObject({
      event_type: 'user_deactivated',
      previous_is_active: true,
      current_is_active: false,
    });
    expect(audit[3]).toMatchObject({
      event_type: 'user_reactivated',
      previous_is_active: false,
      current_is_active: true,
    });

    const swagger = SwaggerModule.createDocument(app, new DocumentBuilder().build());
    const userLifecyclePath = Object.entries(swagger.paths).find(([path]) =>
      path.endsWith('/companies/{companyId}/users/{userId}'),
    )?.[1];
    const activatePath = Object.entries(swagger.paths).find(([path]) =>
      path.endsWith('/companies/{companyId}/users/{userId}/activate'),
    )?.[1];
    expect(userLifecyclePath?.get).toBeDefined();
    expect(userLifecyclePath?.patch).toBeDefined();
    expect(userLifecyclePath?.delete).toBeDefined();
    expect(activatePath?.patch).toBeDefined();
    const updateSchema = JSON.stringify(swagger.components?.schemas?.UpdatePlatformCompanyUserDto);
    expect(updateSchema).toContain('templateCode');
    expect(updateSchema).toContain('permissionCodes');
    expect(updateSchema).toContain('isActive');
  });

  it('protege el alta de usuarios de plataforma y revierte permisos incompatibles', async () => {
    const tenant = await provisionAndLogin(
      'Platform User Security',
      'platform.users.security@test.local',
    );
    const tenantAttempt = await request<unknown>('POST', `/companies/${tenant.company.id}/users`, {
      token: tenant.accessToken,
      body: {
        fullName: 'Intento tenant',
        username: 'intento_tenant',
        phone: '+526671115502',
        password: 'Alta26a',
        role: 'user',
      },
    });
    expect(tenantAttempt.status).toBe(403);

    const incompatible = await request<unknown>('POST', `/companies/${tenant.company.id}/users`, {
      token: platformToken,
      body: {
        fullName: 'Permisos incompatibles',
        username: 'permisos_incompatibles',
        phone: '+526671115503',
        password: 'Alta26a',
        role: 'user',
        permissionCodes: ['users.manage'],
      },
    });
    expect(incompatible.status).toBe(400);
    const rolledBack = await control.query<Array<{ total: string }>>(
      `SELECT COUNT(*)::text AS total
       FROM public.users
       WHERE company_id = $1 AND username = 'permisos_incompatibles'`,
      [tenant.company.id],
    );
    expect(rolledBack[0]?.total).toBe('0');

    const allowedUsers: UserResponse[] = [];
    for (const index of [1, 2]) {
      const allowed = await request<{ user: UserResponse }>(
        'POST',
        `/companies/${tenant.company.id}/users`,
        {
          token: platformToken,
          body: {
            fullName: `Usuario dentro del límite ${index}`,
            username: `usuario_limite_${index}`,
            phone: `+52667111551${index}`,
            password: 'Alta26a',
            role: 'user',
            templateCode: 'mechanic',
          },
        },
      );
      expect(allowed.status).toBe(201);
      allowedUsers.push(allowed.body.user);
    }
    const overLimit = await request<unknown>('POST', `/companies/${tenant.company.id}/users`, {
      token: platformToken,
      body: {
        fullName: 'Usuario fuera del límite',
        username: 'usuario_fuera_limite',
        phone: '+526671115519',
        password: 'Alta26a',
        role: 'user',
      },
    });
    expect(overLimit.status).toBe(409);

    const deactivated = await request<{ user: UserResponse }>(
      'DELETE',
      `/companies/${tenant.company.id}/users/${allowedUsers[0]!.id}`,
      { token: platformToken },
    );
    expect(deactivated.status).toBe(200);
    expect(deactivated.body.user.isActive).toBe(false);

    const replacement = await request<{ user: UserResponse }>(
      'POST',
      `/companies/${tenant.company.id}/users`,
      {
        token: platformToken,
        body: {
          fullName: 'Usuario que ocupa el lugar disponible',
          username: 'usuario_reemplazo_limite',
          phone: '+526671115518',
          password: 'Alta26a',
          role: 'user',
          templateCode: 'mechanic',
        },
      },
    );
    expect(replacement.status).toBe(201);

    const blockedReactivation = await request<unknown>(
      'PATCH',
      `/companies/${tenant.company.id}/users/${allowedUsers[0]!.id}/activate`,
      { token: platformToken },
    );
    expect(blockedReactivation.status).toBe(409);

    expect(
      (
        await request<unknown>(
          'DELETE',
          `/companies/${tenant.company.id}/users/${replacement.body.user.id}`,
          { token: platformToken },
        )
      ).status,
    ).toBe(200);
    const reactivated = await request<{ user: UserResponse }>(
      'PATCH',
      `/companies/${tenant.company.id}/users/${allowedUsers[0]!.id}/activate`,
      { token: platformToken },
    );
    expect(reactivated.status).toBe(200);
    expect(reactivated.body.user.isActive).toBe(true);

    const activeUsers = await control.query<Array<{ total: string }>>(
      `SELECT COUNT(*)::text AS total
       FROM public.users
       WHERE company_id = $1 AND is_active = TRUE`,
      [tenant.company.id],
    );
    expect(activeUsers[0]?.total).toBe('3');
  });

  it('aísla el alta y el listado de usuarios administrados por plataforma entre compañías', async () => {
    const alpha = await createCompany(
      'Platform Users Isolation Alpha',
      'platform.users.alpha@test.local',
    );
    const beta = await createCompany(
      'Platform Users Isolation Beta',
      'platform.users.beta@test.local',
    );
    expect(alpha.status).toBe(201);
    expect(beta.status).toBe(201);

    const commonUsername = 'recepcion_compartida';
    const alphaUser = await request<{ user: UserResponse }>(
      'POST',
      `/companies/${alpha.body.id}/users`,
      {
        token: platformToken,
        body: {
          fullName: 'Recepción exclusiva Alpha',
          username: commonUsername,
          phone: '+526671115521',
          password: 'Alpha26a',
          timezoneCode: 'America/Mazatlan',
          role: 'user',
          templateCode: 'reception',
        },
      },
    );
    const betaUser = await request<{ user: UserResponse }>(
      'POST',
      `/companies/${beta.body.id}/users`,
      {
        token: platformToken,
        body: {
          fullName: 'Recepción exclusiva Beta',
          username: commonUsername,
          phone: '+526671115522',
          password: 'Beta26b',
          timezoneCode: 'America/Mazatlan',
          role: 'user',
          templateCode: 'reception',
        },
      },
    );
    expect(alphaUser.status).toBe(201);
    expect(betaUser.status).toBe(201);
    expect(alphaUser.body.user.companyId).toBe(alpha.body.id);
    expect(betaUser.body.user.companyId).toBe(beta.body.id);
    expect(alphaUser.body.user.loginName).toBe(`${commonUsername}@${alpha.body.loginCode}`);
    expect(betaUser.body.user.loginName).toBe(`${commonUsername}@${beta.body.loginCode}`);

    const alphaList = await request<PaginatedUsersResponse>(
      'GET',
      `/companies/${alpha.body.id}/users?search=${commonUsername}`,
      { token: platformToken },
    );
    const betaList = await request<PaginatedUsersResponse>(
      'GET',
      `/companies/${beta.body.id}/users?search=${commonUsername}`,
      { token: platformToken },
    );
    expect(alphaList.status).toBe(200);
    expect(betaList.status).toBe(200);
    expect(alphaList.body.items.map(({ id }) => id)).toEqual([alphaUser.body.user.id]);
    expect(betaList.body.items.map(({ id }) => id)).toEqual([betaUser.body.user.id]);

    expect(
      (
        await request<unknown>(
          'GET',
          `/companies/${beta.body.id}/users/${alphaUser.body.user.id}`,
          { token: platformToken },
        )
      ).status,
    ).toBe(404);
    expect(
      (
        await request<unknown>(
          'PATCH',
          `/companies/${beta.body.id}/users/${alphaUser.body.user.id}`,
          {
            token: platformToken,
            body: { fullName: 'No debe cruzar compañías' },
          },
        )
      ).status,
    ).toBe(404);

    const alphaLogin = await login(alphaUser.body.user.loginName, 'Alpha26a');
    const betaLogin = await login(betaUser.body.user.loginName, 'Beta26b');
    expect(alphaLogin.body.user.companyId).toBe(alpha.body.id);
    expect(betaLogin.body.user.companyId).toBe(beta.body.id);
    expect(
      (
        await request<unknown>('GET', '/companies/11111111-1111-4111-8111-111111111111/users', {
          token: platformToken,
        })
      ).status,
    ).toBe(404);
  });

  it('conserva el historial operativo al cambiar permisos, rol y estatus del usuario', async () => {
    const tenant = await provisionAndLogin(
      'Platform User Operational History',
      'platform.history.admin@test.local',
    );
    const created = await request<{
      user: UserResponse;
      permissionCodes: string[];
    }>('POST', `/companies/${tenant.company.id}/users`, {
      token: platformToken,
      body: {
        fullName: 'Operador con historial',
        username: 'operador_historial',
        phone: '+526671115524',
        password: 'History7',
        timezoneCode: 'America/Mazatlan',
        role: 'user',
        templateCode: null,
        permissionCodes: [
          'clients.view',
          'clients.create',
          'vehicles.view',
          'vehicles.create',
          'orders.view',
          'orders.create',
          'orders.edit',
        ],
      },
    });
    expect(created.status).toBe(201);

    const brand = await request<VehicleBrandResponse>('POST', '/catalogs/vehicle-brands', {
      token: tenant.accessToken,
      body: { name: 'Historial Operativo Marca' },
    });
    const model = await request<VehicleModelResponse>('POST', '/catalogs/vehicle-models', {
      token: tenant.accessToken,
      body: { brandId: brand.body.id, name: 'Historial Operativo Modelo' },
    });
    expect(brand.status).toBe(201);
    expect(model.status).toBe(201);

    const temporary = await login(created.body.user.loginName, 'History7');
    expect(temporary.status).toBe(200);
    expect(
      (
        await request<unknown>('PATCH', '/users/me/password', {
          token: temporary.body.accessToken,
          body: { currentPassword: 'History7', newPassword: 'History8' },
        })
      ).status,
    ).toBe(204);
    const operator = await login(created.body.user.loginName, 'History8');
    expect(operator.status).toBe(200);
    const operatorCookie = cookiePair(operator.setCookie!);

    const customer = await request<ClientResponse>('POST', '/clients', {
      token: operator.body.accessToken,
      body: { type: 'person', displayName: 'Cliente con autor histórico' },
    });
    expect(customer.status).toBe(201);
    expect(customer.body.createdByUserId).toBe(created.body.user.id);

    const vehicle = await request<VehicleResponse>(
      'POST',
      `/clients/${customer.body.id}/vehicles`,
      {
        token: operator.body.accessToken,
        body: {
          brandId: brand.body.id,
          modelId: model.body.id,
          year: 2024,
          color: 'Gris',
          licensePlate: 'HIS-2026',
        },
      },
    );
    expect(vehicle.status).toBe(201);

    const order = await request<OrderResponse>('POST', '/orders', {
      token: operator.body.accessToken,
      body: {
        customerId: customer.body.id,
        vehicleId: vehicle.body.id,
        items: [
          {
            kind: 'service',
            description: 'Servicio que debe conservar su autor',
            quantity: 1,
            unitPrice: 850,
            unitCost: 125,
          },
        ],
      },
    });
    expect(order.status).toBe(201);
    expect(order.body).toMatchObject({
      totalCost: null,
      grossProfit: null,
      items: [
        expect.objectContaining({
          productServiceId: null,
          unitCost: '125.00',
          costAmount: '125.00',
          costLayers: [],
        }),
      ],
    });

    const paidByOrderEditor = await request<OrderResponse>(
      'PATCH',
      `/orders/${order.body.id}/payment-status`,
      {
        token: operator.body.accessToken,
        body: { isPaid: true },
      },
    );
    expect(paidByOrderEditor.status).toBe(200);
    expect(paidByOrderEditor.body.isPaid).toBe(true);
    const restoredToPendingByOrderEditor = await request<OrderResponse>(
      'PATCH',
      `/orders/${order.body.id}/payment-status`,
      {
        token: operator.body.accessToken,
        body: { isPaid: false },
      },
    );
    expect(restoredToPendingByOrderEditor.status).toBe(200);
    expect(restoredToPendingByOrderEditor.body.isPaid).toBe(false);

    const promoted = await request<{
      user: UserResponse;
      templateCode: string | null;
      isCustomized: boolean;
      permissionCodes: string[];
    }>('PATCH', `/companies/${tenant.company.id}/users/${created.body.user.id}`, {
      token: platformToken,
      body: {
        role: 'admin',
        templateCode: null,
        permissionCodes: [
          'dashboard.view',
          'clients.view',
          'vehicles.view',
          'orders.view',
          'users.view',
          'users.manage',
          'permissions.manage',
        ],
      },
    });
    expect(promoted.status).toBe(200);
    expect(promoted.body).toMatchObject({
      user: { role: 'admin', isActive: true },
      templateCode: null,
      isCustomized: true,
    });
    expect(promoted.body.permissionCodes).toEqual([
      'clients.view',
      'dashboard.view',
      'orders.view',
      'permissions.manage',
      'users.manage',
      'users.view',
      'vehicles.view',
    ]);
    expect(
      (await request<unknown>('GET', '/auth/me', { token: operator.body.accessToken })).status,
    ).toBe(401);
    expect(
      (await request<unknown>('POST', '/auth/refresh', { cookie: operatorCookie })).status,
    ).toBe(401);

    const deactivated = await request<{ user: UserResponse }>(
      'DELETE',
      `/companies/${tenant.company.id}/users/${created.body.user.id}`,
      { token: platformToken },
    );
    expect(deactivated.status).toBe(200);
    expect(deactivated.body.user.isActive).toBe(false);
    expect((await login(created.body.user.loginName, 'History8')).status).toBe(401);

    const schema = quoteIdentifier(tenant.company.schemaName);
    const operationalRows = await control.query<
      Array<{
        customer_id: string;
        vehicle_id: string;
        order_id: string;
        customer_created_by: string;
        vehicle_created_by: string;
        order_created_by: string;
        status_changed_by: string;
      }>
    >(
      `SELECT customer.id AS customer_id, vehicle.id AS vehicle_id, service_order.id AS order_id,
              customer.created_by_user_id AS customer_created_by,
              vehicle.created_by_user_id AS vehicle_created_by,
              service_order.created_by_user_id AS order_created_by,
              history.changed_by_user_id AS status_changed_by
       FROM ${schema}.customers customer
       JOIN ${schema}.vehicles vehicle ON vehicle.customer_id = customer.id
       JOIN ${schema}.orders service_order ON service_order.vehicle_id = vehicle.id
       JOIN ${schema}.order_status_history history ON history.order_id = service_order.id
       WHERE customer.id = $1 AND vehicle.id = $2 AND service_order.id = $3
         AND history.previous_status IS NULL`,
      [customer.body.id, vehicle.body.id, order.body.id],
    );
    expect(operationalRows).toEqual([
      {
        customer_id: customer.body.id,
        vehicle_id: vehicle.body.id,
        order_id: order.body.id,
        customer_created_by: created.body.user.id,
        vehicle_created_by: created.body.user.id,
        order_created_by: created.body.user.id,
        status_changed_by: created.body.user.id,
      },
    ]);

    const preservedOrder = await request<OrderResponse>('GET', `/orders/${order.body.id}`, {
      token: tenant.accessToken,
    });
    expect(preservedOrder.status).toBe(200);
    expect(preservedOrder.body).toMatchObject({
      id: order.body.id,
      customer: { id: customer.body.id },
      vehicle: { id: vehicle.body.id },
      status: 'in_progress',
    });

    const reactivated = await request<{ user: UserResponse; permissionCodes: string[] }>(
      'PATCH',
      `/companies/${tenant.company.id}/users/${created.body.user.id}/activate`,
      { token: platformToken },
    );
    expect(reactivated.status).toBe(200);
    expect(reactivated.body.user).toMatchObject({ role: 'admin', isActive: true });
    expect(reactivated.body.permissionCodes).toEqual(promoted.body.permissionCodes);

    const restored = await login(created.body.user.loginName, 'History8');
    expect(restored.status).toBe(200);
    expect(restored.body.user.role).toBe('admin');
    expect(
      (
        await request<OrderResponse>('GET', `/orders/${order.body.id}`, {
          token: restored.body.accessToken,
        })
      ).status,
    ).toBe(200);
  });

  it('obliga a cambiar la contraseña temporal creada por plataforma y revoca esa sesión', async () => {
    const company = await createCompany(
      'Platform Temporary Password',
      'platform.temporary.admin@test.local',
    );
    expect(company.status).toBe(201);
    const created = await request<{ user: UserResponse }>(
      'POST',
      `/companies/${company.body.id}/users`,
      {
        token: platformToken,
        body: {
          fullName: 'Usuario con contraseña temporal',
          username: 'temporal_plataforma',
          phone: '+526671115523',
          password: 'Temporal7',
          timezoneCode: 'America/Mazatlan',
          role: 'user',
          permissionCodes: ['clients.view'],
        },
      },
    );
    expect(created.status).toBe(201);
    expect(created.body.user.mustChangePassword).toBe(true);

    const temporary = await login(created.body.user.loginName, 'Temporal7');
    expect(temporary.status).toBe(200);
    expect(temporary.body.user.mustChangePassword).toBe(true);
    expect(
      (
        await request<unknown>('GET', '/clients?page=1&limit=20', {
          token: temporary.body.accessToken,
        })
      ).status,
    ).toBe(403);
    expect(
      (
        await request<LoginResponse['user']>('GET', '/auth/me', {
          token: temporary.body.accessToken,
        })
      ).status,
    ).toBe(200);

    const incorrectCurrentPassword = await request<unknown>('PATCH', '/users/me/password', {
      token: temporary.body.accessToken,
      body: { currentPassword: 'Error28a', newPassword: 'Final28a' },
    });
    expect(incorrectCurrentPassword.status).toBe(401);
    const changed = await request<unknown>('PATCH', '/users/me/password', {
      token: temporary.body.accessToken,
      body: { currentPassword: 'Temporal7', newPassword: 'Final28a' },
    });
    expect(changed.status).toBe(204);
    expect(
      (
        await request<unknown>('GET', '/auth/me', {
          token: temporary.body.accessToken,
        })
      ).status,
    ).toBe(401);
    expect(
      (
        await request<unknown>('POST', '/auth/refresh', {
          cookie: cookiePair(temporary.setCookie!),
        })
      ).status,
    ).toBe(401);
    expect((await login(created.body.user.loginName, 'Temporal7')).status).toBe(401);

    const permanent = await login(created.body.user.loginName, 'Final28a');
    expect(permanent.status).toBe(200);
    expect(permanent.body.user.mustChangePassword).toBe(false);
    expect(permanent.body.user.permissions).toEqual(['clients.view']);
    expect(
      (
        await request<PaginatedClients>('GET', '/clients?page=1&limit=20', {
          token: permanent.body.accessToken,
        })
      ).status,
    ).toBe(200);
  });

  it('permite a plataforma restablecer cualquier usuario tenant con aislamiento y auditoría', async () => {
    const tenant = await provisionAndLogin(
      'Platform Password Reset',
      'platform.password.reset@test.local',
    );
    const controlPlan = await request<unknown>(
      'PATCH',
      `/subscriptions/companies/${tenant.company.id}`,
      {
        token: platformToken,
        body: {
          planCode: 'control',
          status: 'active',
          reason: 'Validación integral de restablecimiento de contraseñas',
        },
      },
    );
    expect(controlPlan.status).toBe(200);
    const otherCompany = await createCompany(
      'Platform Password Reset Isolated',
      'platform.password.isolated@test.local',
    );
    expect(otherCompany.status).toBe(201);

    const manager = await request<{ user: UserResponse; permissionCodes: string[] }>(
      'POST',
      `/companies/${tenant.company.id}/users`,
      {
        token: platformToken,
        body: {
          fullName: 'Administrador restablecido por plataforma',
          username: 'admin_platform_reset',
          phone: '+526671115530',
          password: 'Admin41a',
          role: 'admin',
          permissionCodes: ['dashboard.view', 'users.view', 'users.manage', 'permissions.manage'],
        },
      },
    );
    const operator = await request<{ user: UserResponse; permissionCodes: string[] }>(
      'POST',
      `/companies/${tenant.company.id}/users`,
      {
        token: platformToken,
        body: {
          fullName: 'Usuario restablecido por plataforma',
          username: 'user_platform_reset',
          phone: '+526671115531',
          password: 'User41a',
          role: 'user',
          permissionCodes: ['clients.view', 'dashboard.view'],
        },
      },
    );
    const inactiveOperator = await request<{
      user: UserResponse;
      permissionCodes: string[];
    }>('POST', `/companies/${tenant.company.id}/users`, {
      token: platformToken,
      body: {
        fullName: 'Usuario inactivo restablecido por plataforma',
        username: 'inactive_platform_reset',
        phone: '+526671115532',
        password: 'Inactive1',
        role: 'user',
        permissionCodes: ['dashboard.view', 'orders.view'],
      },
    });
    expect(manager.status).toBe(201);
    expect(operator.status).toBe(201);
    expect(inactiveOperator.status).toBe(201);
    const deactivated = await request<{ user: UserResponse }>(
      'DELETE',
      `/companies/${tenant.company.id}/users/${inactiveOperator.body.user.id}`,
      { token: platformToken },
    );
    expect(deactivated.status).toBe(200);
    expect(deactivated.body.user.isActive).toBe(false);

    const managerTemporary = await login(manager.body.user.loginName, 'Admin41a');
    const operatorTemporary = await login(operator.body.user.loginName, 'User41a');
    await request<unknown>('PATCH', '/users/me/password', {
      token: managerTemporary.body.accessToken,
      body: { currentPassword: 'Admin41a', newPassword: 'Admin42b' },
    });
    await request<unknown>('PATCH', '/users/me/password', {
      token: operatorTemporary.body.accessToken,
      body: { currentPassword: 'User41a', newPassword: 'User42b' },
    });
    const primarySession = await login(tenant.company.admin.loginName, PERMANENT_PASSWORD);
    const managerSession = await login(manager.body.user.loginName, 'Admin42b');
    const operatorSession = await login(operator.body.user.loginName, 'User42b');
    expect(primarySession.status).toBe(200);
    expect(managerSession.status).toBe(200);
    expect(operatorSession.status).toBe(200);

    const targetIds = [
      tenant.company.admin.id,
      manager.body.user.id,
      operator.body.user.id,
      inactiveOperator.body.user.id,
    ];
    const before = await control.query<
      Array<{ id: string; role: string; is_active: boolean; permission_codes: string[] }>
    >(
      `SELECT user_account.id::text, user_account.role, user_account.is_active,
              COALESCE(array_agg(permission.permission_code ORDER BY permission.permission_code)
                FILTER (WHERE permission.permission_code IS NOT NULL), ARRAY[]::varchar[])
                AS permission_codes
       FROM public.users user_account
       LEFT JOIN public.user_permissions permission ON permission.user_id = user_account.id
       WHERE user_account.id = ANY($1::uuid[])
       GROUP BY user_account.id
       ORDER BY user_account.id`,
      [targetIds],
    );
    const crossCompany = await request<unknown>(
      'PATCH',
      `/companies/${otherCompany.body.id}/users/${operator.body.user.id}/password`,
      { token: platformToken, body: { password: 'Blocked2' } },
    );
    expect(crossCompany.status).toBe(404);
    expect(
      (
        await request<unknown>(
          'PATCH',
          `/companies/${tenant.company.id}/users/${operator.body.user.id}/password`,
          { token: tenant.accessToken, body: { password: 'Blocked3' } },
        )
      ).status,
    ).toBe(403);
    expect(
      (
        await request<unknown>(
          'PATCH',
          `/companies/${tenant.company.id}/users/${operator.body.user.id}/password`,
          { token: platformToken, body: { password: 'abcde' } },
        )
      ).status,
    ).toBe(400);

    await control.query(
      `UPDATE public.users
       SET failed_login_attempts = 5, locked_until = NOW() + interval '15 minutes'
       WHERE id = ANY($1::uuid[])`,
      [targetIds],
    );

    for (const [targetId, password] of [
      [tenant.company.admin.id, 'Primary4'],
      [manager.body.user.id, 'Admin43c'],
      [operator.body.user.id, 'User43c'],
      [inactiveOperator.body.user.id, 'Inactive2'],
    ] as const) {
      const reset = await request<unknown>(
        'PATCH',
        `/companies/${tenant.company.id}/users/${targetId}/password`,
        { token: platformToken, body: { password } },
      );
      expect(reset.status).toBe(204);
    }

    for (const session of [primarySession, managerSession, operatorSession]) {
      expect(
        (await request<unknown>('GET', '/auth/me', { token: session.body.accessToken })).status,
      ).toBe(401);
      expect(
        (
          await request<unknown>('POST', '/auth/refresh', {
            cookie: cookiePair(session.setCookie!),
          })
        ).status,
      ).toBe(401);
    }

    const after = await control.query<
      Array<{
        id: string;
        role: string;
        is_active: boolean;
        permission_codes: string[];
        failed_login_attempts: number;
        locked_until: Date | null;
        must_change_password: boolean;
        active_sessions: number;
      }>
    >(
      `SELECT user_account.id::text, user_account.role, user_account.is_active,
              user_account.failed_login_attempts, user_account.locked_until,
              user_account.must_change_password,
              COALESCE(array_agg(DISTINCT permission.permission_code ORDER BY permission.permission_code)
                FILTER (WHERE permission.permission_code IS NOT NULL), ARRAY[]::varchar[])
                AS permission_codes,
              count(DISTINCT session.id) FILTER (WHERE session.revoked_at IS NULL)::int
                AS active_sessions
       FROM public.users user_account
       LEFT JOIN public.user_permissions permission ON permission.user_id = user_account.id
       LEFT JOIN public.auth_sessions session ON session.user_id = user_account.id
       WHERE user_account.id = ANY($1::uuid[])
       GROUP BY user_account.id
       ORDER BY user_account.id`,
      [targetIds],
    );
    expect(
      after.map(
        ({ failed_login_attempts, locked_until, must_change_password, active_sessions }) => ({
          failed_login_attempts,
          locked_until,
          must_change_password,
          active_sessions,
        }),
      ),
    ).toEqual(
      targetIds.map(() => ({
        failed_login_attempts: 0,
        locked_until: null,
        must_change_password: true,
        active_sessions: 0,
      })),
    );
    expect(
      after.map(({ id, role, is_active, permission_codes }) => ({
        id,
        role,
        is_active,
        permission_codes,
      })),
    ).toEqual(before);

    for (const [loginName, password, role] of [
      [tenant.company.admin.loginName, 'Primary4', 'company_admin'],
      [manager.body.user.loginName, 'Admin43c', 'admin'],
      [operator.body.user.loginName, 'User43c', 'user'],
    ] as const) {
      const loginAfterReset = await login(loginName, password);
      expect(loginAfterReset.status).toBe(200);
      expect(loginAfterReset.body.user).toMatchObject({ role, mustChangePassword: true });
      expect(
        (
          await request<unknown>('GET', '/dashboard/summary', {
            token: loginAfterReset.body.accessToken,
          })
        ).status,
      ).toBe(403);
    }

    expect((await login(inactiveOperator.body.user.loginName, 'Inactive2')).status).toBe(401);
    const reactivated = await request<{ user: UserResponse }>(
      'PATCH',
      `/companies/${tenant.company.id}/users/${inactiveOperator.body.user.id}/activate`,
      { token: platformToken },
    );
    expect(reactivated.status).toBe(200);
    expect(reactivated.body.user.isActive).toBe(true);
    const inactiveAfterReactivation = await login(
      inactiveOperator.body.user.loginName,
      'Inactive2',
    );
    expect(inactiveAfterReactivation.status).toBe(200);
    expect(inactiveAfterReactivation.body.user).toMatchObject({
      role: 'user',
      mustChangePassword: true,
    });
    expect(
      (
        await request<unknown>('GET', '/dashboard/summary', {
          token: inactiveAfterReactivation.body.accessToken,
        })
      ).status,
    ).toBe(403);

    const audit = await control.query<
      Array<{ target_user_id: string; reset_by_role: string; target_role: string; source: string }>
    >(
      `SELECT target_user_id::text, reset_by_role, target_role, source
       FROM public.password_reset_events
       WHERE company_id = $1 AND target_user_id = ANY($2::uuid[])
       ORDER BY target_user_id`,
      [tenant.company.id, targetIds],
    );
    expect(audit).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          target_user_id: tenant.company.admin.id,
          target_role: 'company_admin',
          reset_by_role: 'platform_admin',
          source: 'platform_admin',
        }),
        expect.objectContaining({
          target_user_id: manager.body.user.id,
          target_role: 'admin',
          reset_by_role: 'platform_admin',
          source: 'platform_admin',
        }),
        expect.objectContaining({
          target_user_id: operator.body.user.id,
          target_role: 'user',
          reset_by_role: 'platform_admin',
          source: 'platform_admin',
        }),
        expect.objectContaining({
          target_user_id: inactiveOperator.body.user.id,
          target_role: 'user',
          reset_by_role: 'platform_admin',
          source: 'platform_admin',
        }),
      ]),
    );

    const swagger = SwaggerModule.createDocument(app, new DocumentBuilder().build());
    const passwordPath = Object.entries(swagger.paths).find(([path]) =>
      path.endsWith('/companies/{companyId}/users/{userId}/password'),
    )?.[1];
    expect(passwordPath?.patch?.responses).toHaveProperty('204');
    expect(passwordPath?.patch?.responses).toHaveProperty('400');
    expect(passwordPath?.patch?.responses).toHaveProperty('403');
    expect(passwordPath?.patch?.responses).toHaveProperty('404');
    expect(JSON.stringify(passwordPath?.patch?.requestBody)).toContain(
      '"$ref":"#/components/schemas/ResetPasswordDto"',
    );
    const resetPasswordSchema = JSON.stringify(swagger.components?.schemas?.ResetPasswordDto);
    expect(resetPasswordSchema).toContain('"required":["password"]');
    expect(resetPasswordSchema).toContain('"minLength":6');
    expect(resetPasswordSchema).toContain('"maxLength":10');
    expect(resetPasswordSchema).toContain('"writeOnly":true');
  });

  it('aplica la jerarquía company_admin → admin → user al administrar cuentas', async () => {
    const tenant = await provisionAndLogin('Role Hierarchy Integration', 'roles.admin@test.local');
    await request<unknown>('PATCH', `/subscriptions/companies/${tenant.company.id}`, {
      token: platformToken,
      body: { planCode: 'control', status: 'active', reason: 'Prueba de jerarquía' },
    });

    const manager = await request<UserResponse>('POST', '/users', {
      token: tenant.accessToken,
      body: {
        fullName: 'Administrador Operativo',
        username: 'operaciones',
        phone: '+526671110010',
        password: USER_PASSWORD,
        timezoneCode: 'America/Mazatlan',
        role: 'admin',
      },
    });
    expect(manager.status).toBe(201);
    expect(manager.body.role).toBe('admin');

    const temporaryLogin = await login(`operaciones@${tenant.company.loginCode}`, USER_PASSWORD);
    expect(temporaryLogin.status).toBe(200);
    expect(
      (
        await request<unknown>('PATCH', '/users/me/password', {
          token: temporaryLogin.body.accessToken,
          body: { currentPassword: USER_PASSWORD, newPassword: PERMANENT_PASSWORD },
        })
      ).status,
    ).toBe(204);
    const managerLogin = await login(`operaciones@${tenant.company.loginCode}`, PERMANENT_PASSWORD);
    expect(managerLogin.status).toBe(200);
    expect(
      (await request<unknown>('GET', '/users', { token: managerLogin.body.accessToken })).status,
    ).toBe(200);

    const operator = await request<UserResponse>('POST', '/users', {
      token: managerLogin.body.accessToken,
      body: {
        fullName: 'Usuario Operativo',
        username: 'operador_roles',
        phone: '+526671110011',
        password: USER_PASSWORD,
        timezoneCode: 'America/Mazatlan',
        role: 'user',
      },
    });
    expect(operator.status).toBe(201);
    expect(operator.body.role).toBe('user');

    const forbiddenCreation = await request<unknown>('POST', '/users', {
      token: managerLogin.body.accessToken,
      body: {
        fullName: 'Administrador Indebido',
        username: 'admin_indebido',
        phone: '+526671110012',
        password: USER_PASSWORD,
        timezoneCode: 'America/Mazatlan',
        role: 'admin',
      },
    });
    expect(forbiddenCreation.status).toBe(403);
    expect(
      (
        await request<unknown>('PATCH', `/users/${operator.body.id}`, {
          token: managerLogin.body.accessToken,
          body: { role: 'admin' },
        })
      ).status,
    ).toBe(403);
    expect(
      (
        await request<unknown>('PATCH', `/users/${tenant.user.id}`, {
          token: managerLogin.body.accessToken,
          body: { fullName: 'Cambio no autorizado' },
        })
      ).status,
    ).toBe(403);
    expect(
      (
        await request<unknown>('DELETE', `/users/${tenant.user.id}`, {
          token: managerLogin.body.accessToken,
        })
      ).status,
    ).toBe(403);

    const promoted = await request<UserResponse>('PATCH', `/users/${operator.body.id}`, {
      token: tenant.accessToken,
      body: { role: 'admin' },
    });
    expect(promoted.status).toBe(200);
    expect(promoted.body.role).toBe('admin');
    expect(
      (
        await request<unknown>('PATCH', `/users/${operator.body.id}`, {
          token: managerLogin.body.accessToken,
          body: { fullName: 'Tampoco permitido' },
        })
      ).status,
    ).toBe(403);
  });

  it('restablece contraseñas temporales con jerarquía, revocación y bitácora', async () => {
    const tenant = await provisionAndLogin(
      'Password Reset Integration',
      'password.reset@test.local',
    );
    await request<unknown>('PATCH', `/subscriptions/companies/${tenant.company.id}`, {
      token: platformToken,
      body: { planCode: 'control', status: 'active', reason: 'Prueba de restablecimiento' },
    });

    const manager = await request<UserResponse>('POST', '/users', {
      token: tenant.accessToken,
      body: {
        fullName: 'Administrador para restablecimiento',
        username: 'admin_reset',
        phone: '+526671110020',
        password: USER_PASSWORD,
        timezoneCode: 'America/Mazatlan',
        role: 'admin',
      },
    });
    expect(manager.status).toBe(201);
    const managerTemporary = await login(`admin_reset@${tenant.company.loginCode}`, USER_PASSWORD);
    await request<unknown>('PATCH', '/users/me/password', {
      token: managerTemporary.body.accessToken,
      body: { currentPassword: USER_PASSWORD, newPassword: PERMANENT_PASSWORD },
    });
    const managerSession = await login(
      `admin_reset@${tenant.company.loginCode}`,
      PERMANENT_PASSWORD,
    );

    const operator = await request<UserResponse>('POST', '/users', {
      token: managerSession.body.accessToken,
      body: {
        fullName: 'Usuario para restablecimiento',
        username: 'user_reset',
        phone: '+526671110021',
        password: USER_PASSWORD,
        timezoneCode: 'America/Mazatlan',
        role: 'user',
      },
    });
    expect(operator.status).toBe(201);
    const operatorSession = await login(`user_reset@${tenant.company.loginCode}`, USER_PASSWORD);

    await control.query(
      `UPDATE public.users
       SET failed_login_attempts = 5, locked_until = NOW() + interval '15 minutes'
       WHERE id = $1`,
      [manager.body.id],
    );
    expect(
      (await login(`admin_reset@${tenant.company.loginCode}`, PERMANENT_PASSWORD)).status,
    ).toBe(401);

    const managerReset = await request<unknown>('PATCH', `/users/${manager.body.id}/password`, {
      token: tenant.accessToken,
      body: { password: 'Admin28c' },
    });
    expect(managerReset.status).toBe(204);
    expect(
      (await request<unknown>('GET', '/auth/me', { token: managerSession.body.accessToken }))
        .status,
    ).toBe(401);
    const managerSecurity = await control.query<
      Array<{ failed_login_attempts: number; locked_until: Date | null; active_sessions: number }>
    >(
      `SELECT user_account.failed_login_attempts, user_account.locked_until,
              count(session.id)::int AS active_sessions
       FROM public.users user_account
       LEFT JOIN public.auth_sessions session
         ON session.user_id = user_account.id AND session.revoked_at IS NULL
       WHERE user_account.id = $1
       GROUP BY user_account.id`,
      [manager.body.id],
    );
    expect(managerSecurity[0]).toMatchObject({
      failed_login_attempts: 0,
      locked_until: null,
      active_sessions: 0,
    });
    const resetManagerLogin = await login(`admin_reset@${tenant.company.loginCode}`, 'Admin28c');
    expect(resetManagerLogin.status).toBe(200);
    expect(resetManagerLogin.body.user.mustChangePassword).toBe(true);
    await request<unknown>('PATCH', '/users/me/password', {
      token: resetManagerLogin.body.accessToken,
      body: { currentPassword: 'Admin28c', newPassword: 'Admin30e' },
    });
    const activeManager = await login(`admin_reset@${tenant.company.loginCode}`, 'Admin30e');

    const operatorReset = await request<unknown>('PATCH', `/users/${operator.body.id}/password`, {
      token: activeManager.body.accessToken,
      body: { password: 'User29d' },
    });
    expect(operatorReset.status).toBe(204);
    expect(
      (await request<unknown>('GET', '/auth/me', { token: operatorSession.body.accessToken }))
        .status,
    ).toBe(401);
    expect(
      (
        await request<unknown>('PATCH', `/users/${tenant.user.id}/password`, {
          token: activeManager.body.accessToken,
          body: { password: 'Blocked1' },
        })
      ).status,
    ).toBe(403);

    const primaryAdministrators = await control.query<Array<{ total: number }>>(
      `SELECT count(*)::int AS total
       FROM public.users
       WHERE company_id = $1 AND role = 'company_admin' AND is_active = TRUE`,
      [tenant.company.id],
    );
    expect(primaryAdministrators[0]?.total).toBe(1);
    await control.query(
      `UPDATE public.users
       SET failed_login_attempts = 5, locked_until = NOW() + interval '15 minutes'
       WHERE id = $1`,
      [tenant.user.id],
    );
    expect((await login(tenant.company.admin.loginName, PERMANENT_PASSWORD)).status).toBe(401);

    const primaryReset = await request<unknown>(
      'PATCH',
      `/companies/${tenant.company.id}/admin/password`,
      { token: platformToken, body: { password: 'Primary3' } },
    );
    expect(primaryReset.status).toBe(204);
    expect((await request<unknown>('GET', '/auth/me', { token: tenant.accessToken })).status).toBe(
      401,
    );
    const primaryLogin = await login(tenant.company.admin.loginName, 'Primary3');
    expect(primaryLogin.status).toBe(200);
    expect(primaryLogin.body.user.mustChangePassword).toBe(true);
    const primarySecurity = await control.query<
      Array<{ failed_login_attempts: number; locked_until: Date | null; active_sessions: number }>
    >(
      `SELECT user_account.failed_login_attempts, user_account.locked_until,
              count(session.id)::int AS active_sessions
       FROM public.users user_account
       LEFT JOIN public.auth_sessions session
         ON session.user_id = user_account.id AND session.revoked_at IS NULL
       WHERE user_account.id = $1
       GROUP BY user_account.id`,
      [tenant.user.id],
    );
    expect(primarySecurity[0]).toMatchObject({
      failed_login_attempts: 0,
      locked_until: null,
      active_sessions: 1,
    });

    const companies = await request<CompanyResponse[]>('GET', '/companies', {
      token: platformToken,
    });
    expect(companies.status).toBe(200);
    const listedCompany = companies.body.find(({ id }) => id === tenant.company.id);
    expect(listedCompany?.admin.id).toBe(tenant.user.id);

    const audit = await control.query<
      Array<{
        target_user_id: string;
        reset_by_role: string;
        target_role: string;
        source: string;
      }>
    >(
      `SELECT target_user_id, reset_by_role, target_role, source
       FROM public.password_reset_events
       WHERE company_id = $1
       ORDER BY created_at, id`,
      [tenant.company.id],
    );
    expect(audit).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          target_user_id: manager.body.id,
          reset_by_role: 'company_admin',
          target_role: 'admin',
          source: 'tenant_admin',
        }),
        expect.objectContaining({
          target_user_id: operator.body.id,
          reset_by_role: 'admin',
          target_role: 'user',
          source: 'tenant_admin',
        }),
        expect.objectContaining({
          target_user_id: tenant.user.id,
          reset_by_role: 'platform_admin',
          target_role: 'company_admin',
          source: 'platform_admin',
        }),
      ]),
    );
  });

  it('conserva permisos por usuario, plantillas y acceso automático del Administrador principal', async () => {
    const tenant = await provisionAndLogin(
      'Permission Model Integration',
      'permissions@test.local',
    );
    const catalog = await request<Array<{ code: string; module: string; action: string }>>(
      'GET',
      '/permissions',
      { token: tenant.accessToken },
    );
    expect(catalog.status).toBe(200);
    expect(catalog.body).toHaveLength(47);
    expect(catalog.body).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ code: 'orders.create', module: 'orders', action: 'create' }),
        expect.objectContaining({ code: 'profitability.view' }),
        expect.objectContaining({ code: 'permissions.manage' }),
        expect.objectContaining({ code: 'invoices.view', module: 'invoices', action: 'view' }),
        expect.objectContaining({ code: 'invoices.configure' }),
        expect.objectContaining({
          code: 'clients.edit_fiscal',
          module: 'clients',
          action: 'edit_fiscal',
        }),
      ]),
    );

    const templates = await request<PermissionTemplateResponse[]>('GET', '/permissions/templates', {
      token: tenant.accessToken,
    });
    expect(templates.status).toBe(200);
    expect(templates.body.map(({ code }) => code)).toEqual([
      'reception',
      'mechanic',
      'warehouse',
      'administration',
      'accounting',
    ]);

    const principal = await request<UserPermissionProfileResponse>(
      'GET',
      `/permissions/users/${tenant.user.id}`,
      { token: tenant.accessToken },
    );
    expect(principal.status).toBe(200);
    expect(principal.body).toMatchObject({
      role: 'company_admin',
      automatic: true,
      templateCode: null,
      isCustomized: false,
    });
    expect(principal.body.permissionCodes).toHaveLength(catalog.body.length);

    const manager = await request<UserResponse>('POST', '/users', {
      token: tenant.accessToken,
      body: {
        fullName: 'Administrador con permisos',
        username: 'admin_permisos',
        phone: '+526671110020',
        password: USER_PASSWORD,
        timezoneCode: 'America/Mazatlan',
        role: 'admin',
      },
    });
    const operator = await request<UserResponse>('POST', '/users', {
      token: tenant.accessToken,
      body: {
        fullName: 'Usuario con permisos',
        username: 'user_permisos',
        phone: '+526671110021',
        password: USER_PASSWORD,
        timezoneCode: 'America/Mazatlan',
        role: 'user',
      },
    });
    expect(manager.status).toBe(201);
    expect(operator.status).toBe(201);

    const managerProfile = await request<UserPermissionProfileResponse>(
      'GET',
      `/permissions/users/${manager.body.id}`,
      { token: tenant.accessToken },
    );
    expect(managerProfile.body).toMatchObject({
      role: 'admin',
      templateCode: 'administration',
      isCustomized: true,
      automatic: false,
    });
    expect(managerProfile.body.permissionCodes).toEqual(
      expect.arrayContaining(['users.view', 'users.manage', 'permissions.manage']),
    );

    const reception = templates.body.find(({ code }) => code === 'reception')!;
    const assigned = await request<UserPermissionProfileResponse>(
      'PUT',
      `/permissions/users/${operator.body.id}`,
      {
        token: tenant.accessToken,
        body: { templateCode: 'reception', permissionCodes: reception.permissionCodes },
      },
    );
    expect(assigned.status).toBe(200);
    expect(assigned.body).toMatchObject({
      templateCode: 'reception',
      isCustomized: false,
      automatic: false,
    });
    expect(assigned.body.permissionCodes).toEqual(reception.permissionCodes);

    await request<unknown>('PATCH', `/subscriptions/companies/${tenant.company.id}`, {
      token: platformToken,
      body: { planCode: 'control', status: 'active', reason: 'Cambio temporal de plan' },
    });
    await request<unknown>('PATCH', `/subscriptions/companies/${tenant.company.id}`, {
      token: platformToken,
      body: { planCode: 'essential', status: 'active', reason: 'Regreso al plan original' },
    });
    const preserved = await request<UserPermissionProfileResponse>(
      'GET',
      `/permissions/users/${operator.body.id}`,
      { token: tenant.accessToken },
    );
    expect(preserved.status).toBe(200);
    expect(preserved.body.permissionCodes).toEqual(reception.permissionCodes);
  });

  it('limita la plantilla Contabilidad al perfil fiscal y facturación del plan contratado', async () => {
    const tenant = await provisionAndLogin(
      'Accounting Template Integration',
      'accounting.admin@test.local',
      'invoicing',
    );
    const foreign = await provisionAndLogin(
      'Accounting Foreign Integration',
      'accounting.foreign@test.local',
      'invoicing',
    );
    const templates = await request<PermissionTemplateResponse[]>('GET', '/permissions/templates', {
      token: tenant.accessToken,
    });
    const accounting = templates.body.find(({ code }) => code === 'accounting')!;
    const exactPermissions = [
      'orders.view',
      'clients.view',
      'clients.edit_fiscal',
      'invoices.view',
      'invoices.create',
      'invoices.edit',
      'invoices.simulate_issue',
      'invoices.cancel_simulation',
    ];
    expect([...accounting.permissionCodes].sort()).toEqual([...exactPermissions].sort());

    const client = await request<ClientResponse>('POST', '/clients', {
      token: tenant.accessToken,
      body: { type: 'person', displayName: 'Cliente para Contabilidad' },
    });
    const foreignClient = await request<ClientResponse>('POST', '/clients', {
      token: foreign.accessToken,
      body: { type: 'person', displayName: 'Cliente de otra compañía' },
    });
    const accountant = await request<UserResponse>('POST', '/users', {
      token: tenant.accessToken,
      body: {
        fullName: 'Contador Integration',
        username: 'contador_integration',
        phone: '+526671110061',
        password: USER_PASSWORD,
        timezoneCode: 'America/Mazatlan',
        role: 'user',
      },
    });
    expect(accountant.status).toBe(201);
    const assigned = await request<UserPermissionProfileResponse>(
      'PUT',
      `/permissions/users/${accountant.body.id}`,
      {
        token: tenant.accessToken,
        body: { templateCode: 'accounting', permissionCodes: accounting.permissionCodes },
      },
    );
    expect(assigned.body).toMatchObject({
      role: 'user',
      templateCode: 'accounting',
      isCustomized: false,
      permissionCodes: accounting.permissionCodes,
    });

    const temporary = await login(accountant.body.loginName, USER_PASSWORD);
    expect(
      (
        await request<unknown>('PATCH', '/users/me/password', {
          token: temporary.body.accessToken,
          body: { currentPassword: USER_PASSWORD, newPassword: PERMANENT_PASSWORD },
        })
      ).status,
    ).toBe(204);
    const active = await login(accountant.body.loginName, PERMANENT_PASSWORD);
    expect(active.body.user.role).toBe('user');
    expect([...active.body.user.permissions].sort()).toEqual([...exactPermissions].sort());

    expect((await request<unknown>('GET', '/orders', { token: active.body.accessToken })).status).toBe(
      200,
    );
    expect((await request<unknown>('GET', '/clients', { token: active.body.accessToken })).status).toBe(
      200,
    );
    expect((await request<unknown>('GET', '/invoices', { token: active.body.accessToken })).status).toBe(
      200,
    );
    expect(
      (await request<unknown>('GET', '/invoices/settings', { token: active.body.accessToken })).status,
    ).toBe(403);

    const fiscalUpdate = await request<ClientResponse>(
      'PATCH',
      `/clients/${client.body.id}/fiscal-profile`,
      {
        token: active.body.accessToken,
        body: {
          taxId: 'GODE561231GR8',
          fiscalName: 'CLIENTE PARA CONTABILIDAD',
          fiscalPostalCode: '80000',
          fiscalRegimeCode: '612',
          preferredCfdiUseCode: 'G03',
        },
      },
    );
    expect(fiscalUpdate.status).toBe(200);
    expect(fiscalUpdate.body).toMatchObject({
      displayName: 'Cliente para Contabilidad',
      taxId: 'GODE561231GR8',
      fiscalName: 'CLIENTE PARA CONTABILIDAD',
      fiscalReadiness: { isReadyToInvoice: true },
    });
    expect(
      (
        await request<unknown>('PATCH', `/clients/${client.body.id}/fiscal-profile`, {
          token: active.body.accessToken,
          body: { phone: '+526671234567' },
        })
      ).status,
    ).toBe(400);
    expect(
      (
        await request<unknown>('PATCH', `/clients/${client.body.id}`, {
          token: active.body.accessToken,
          body: { fiscalName: 'INTENTO POR ENDPOINT GENERAL' },
        })
      ).status,
    ).toBe(403);
    expect(
      (
        await request<unknown>('GET', `/clients/${foreignClient.body.id}`, {
          token: active.body.accessToken,
        })
      ).status,
    ).toBe(404);
    expect(
      (
        await request<unknown>('PATCH', `/clients/${foreignClient.body.id}/fiscal-profile`, {
          token: active.body.accessToken,
          body: { fiscalName: 'NO DEBE MODIFICARSE' },
        })
      ).status,
    ).toBe(404);

    for (const [method, path, body] of [
      ['POST', '/clients', { type: 'person', displayName: 'No permitido' }],
      ['POST', '/orders', {}],
      ['POST', '/orders/00000000-0000-4000-8000-000000000001/status', { status: 'completed' }],
      ['PATCH', '/orders/00000000-0000-4000-8000-000000000001/payment-status', { isPaid: true }],
      ['GET', '/expenses', undefined],
      ['GET', '/profitability', undefined],
      ['GET', '/inventory/products', undefined],
      ['GET', '/purchases', undefined],
      ['GET', '/suppliers', undefined],
    ] as const) {
      const denied = await request<unknown>(method, path, {
        token: active.body.accessToken,
        ...(body === undefined ? {} : { body }),
      });
      expect(denied.status).toBe(403);
    }

    const audit = await control.query<Array<{ changes: Record<string, unknown> }>>(
      `SELECT changes FROM public.platform_company_user_events
       WHERE company_id=$1 AND target_user_id=$2 AND event_type='user_updated'
       ORDER BY created_at DESC, id DESC LIMIT 1`,
      [tenant.company.id, accountant.body.id],
    );
    expect(audit[0]?.changes).toHaveProperty('templateCode');
    expect(audit[0]?.changes).toHaveProperty('permissionCodes');

    const controlTenant = await provisionAndLogin(
      'Accounting Control Plan Integration',
      'accounting.control@test.local',
      'control',
    );
    const platformAccountant = await request<{ user: UserResponse; permissionCodes: string[] }>(
      'POST',
      `/companies/${controlTenant.company.id}/users`,
      {
        token: platformToken,
        body: {
          fullName: 'Contador asignado por plataforma',
          username: 'contador_plataforma',
          phone: '+526671110062',
          password: USER_PASSWORD,
          timezoneCode: 'America/Mazatlan',
          role: 'user',
          templateCode: 'accounting',
          permissionCodes: accounting.permissionCodes,
        },
      },
    );
    expect(platformAccountant.status).toBe(201);
    expect([...platformAccountant.body.permissionCodes].sort()).toEqual(
      [...accounting.permissionCodes].sort(),
    );
    const controlTemporary = await login(platformAccountant.body.user.loginName, USER_PASSWORD);
    expect(
      (
        await request<unknown>('PATCH', '/users/me/password', {
          token: controlTemporary.body.accessToken,
          body: { currentPassword: USER_PASSWORD, newPassword: PERMANENT_PASSWORD },
        })
      ).status,
    ).toBe(204);
    const controlActive = await login(platformAccountant.body.user.loginName, PERMANENT_PASSWORD);
    expect(
      (await request<unknown>('GET', '/invoices', { token: controlActive.body.accessToken })).status,
    ).toBe(403);
    expect(
      (
        await request<unknown>('PATCH', `/clients/${client.body.id}/fiscal-profile`, {
          token: controlActive.body.accessToken,
          body: { fiscalName: 'NO DISPONIBLE EN CONTROL' },
        })
      ).status,
    ).toBe(403);

    const swagger = SwaggerModule.createDocument(app, new DocumentBuilder().build());
    expect(swagger.paths['/api/clients/{id}/fiscal-profile']).toBeDefined();
    const fiscalDto = JSON.stringify(swagger.components?.schemas?.UpdateClientFiscalDto);
    expect(fiscalDto).toContain('preferredCfdiUseCode');
    expect(fiscalDto).not.toContain('phone');
    expect(fiscalDto).not.toContain('isActive');
  });

  it('ofrece el mismo comportamiento operativo a admin y user con permisos idénticos', async () => {
    const tenant = await provisionAndLogin(
      'Role Permission Parity Integration',
      'role.parity@test.local',
    );
    const sharedPermissions = [
      'dashboard.view',
      'clients.view',
      'clients.create',
      'clients.edit',
      'vehicles.view',
      'vehicles.create',
      'vehicles.edit',
      'orders.view',
      'orders.create',
      'orders.edit',
      'orders.change_status',
      'orders.add_notes',
      'vehicle_catalog.view',
      'vehicle_catalog.manage',
    ];

    const prepareOperator = async (role: 'admin' | 'user', suffix: string) => {
      const created = await request<UserResponse>('POST', '/users', {
        token: tenant.accessToken,
        body: {
          fullName: `Paridad ${role}`,
          username: `paridad_${suffix}`,
          phone: role === 'admin' ? '+526671110041' : '+526671110042',
          password: USER_PASSWORD,
          timezoneCode: 'America/Mazatlan',
          role,
        },
      });
      expect(created.status).toBe(201);

      const assigned = await request<UserPermissionProfileResponse>(
        'PUT',
        `/permissions/users/${created.body.id}`,
        {
          token: tenant.accessToken,
          body: { templateCode: null, permissionCodes: sharedPermissions },
        },
      );
      expect(assigned.status).toBe(200);
      expect(assigned.body).toMatchObject({ role, isCustomized: true });
      expect([...assigned.body.permissionCodes].sort()).toEqual([...sharedPermissions].sort());

      const temporary = await login(created.body.loginName, USER_PASSWORD);
      expect(temporary.status).toBe(200);
      expect(
        (
          await request<unknown>('PATCH', '/users/me/password', {
            token: temporary.body.accessToken,
            body: { currentPassword: USER_PASSWORD, newPassword: PERMANENT_PASSWORD },
          })
        ).status,
      ).toBe(204);
      const authenticated = await login(created.body.loginName, PERMANENT_PASSWORD);
      expect(authenticated.status).toBe(200);
      expect(authenticated.body.user.role).toBe(role);
      expect([...authenticated.body.user.permissions].sort()).toEqual(
        [...sharedPermissions].sort(),
      );
      return authenticated.body.accessToken;
    };

    const sessions = [
      { role: 'admin' as const, suffix: 'admin', token: '' },
      { role: 'user' as const, suffix: 'user', token: '' },
    ];
    for (const session of sessions) {
      session.token = await prepareOperator(session.role, session.suffix);
    }

    for (const session of sessions) {
      const client = await request<ClientResponse>('POST', '/clients', {
        token: session.token,
        body: {
          type: 'person',
          displayName: `Cliente paridad ${session.suffix}`,
        },
      });
      expect(client.status).toBe(201);

      const brand = await request<VehicleBrandResponse>('POST', '/catalogs/vehicle-brands', {
        token: session.token,
        body: { name: `Marca paridad ${session.suffix}` },
      });
      expect(brand.status).toBe(201);
      const model = await request<VehicleModelResponse>('POST', '/catalogs/vehicle-models', {
        token: session.token,
        body: { brandId: brand.body.id, name: `Modelo paridad ${session.suffix}` },
      });
      expect(model.status).toBe(201);

      const vehicle = await request<VehicleResponse>(
        'POST',
        `/clients/${client.body.id}/vehicles`,
        {
          token: session.token,
          body: {
            brandId: brand.body.id,
            modelId: model.body.id,
            year: 2026,
            color: 'Azul',
          },
        },
      );
      expect(vehicle.status).toBe(201);

      const order = await request<OrderResponse>('POST', '/orders', {
        token: session.token,
        body: {
          customerId: client.body.id,
          vehicleId: vehicle.body.id,
          items: [
            {
              kind: 'service',
              description: `Servicio paridad ${session.suffix}`,
              quantity: 1,
              unitCost: 100,
              unitPrice: 500,
            },
          ],
        },
      });
      expect(order.status).toBe(201);
      expect(order.body.items[0]).toMatchObject({ unitCost: '100.00', unitPrice: '500.00' });

      const edited = await request<OrderResponse>('PATCH', `/orders/${order.body.id}`, {
        token: session.token,
        body: {
          externalFolio: `PARIDAD-${session.suffix.toUpperCase()}`,
          items: [
            {
              kind: 'service',
              description: `Servicio editado ${session.suffix}`,
              quantity: 1,
              unitCost: 125,
              unitPrice: 600,
            },
          ],
        },
      });
      expect(edited.status).toBe(200);
      expect(edited.body.items[0]).toMatchObject({ unitCost: '125.00', unitPrice: '600.00' });

      expect(
        (
          await request<OrderResponse>('PATCH', `/orders/${order.body.id}/payment-status`, {
            token: session.token,
            body: { isPaid: true },
          })
        ).status,
      ).toBe(200);
      expect(
        (
          await request<unknown>('POST', `/orders/${order.body.id}/notes`, {
            token: session.token,
            body: { body: 'Seguimiento con los mismos permisos operativos.' },
          })
        ).status,
      ).toBe(201);
      expect(
        (
          await request<unknown>('GET', '/dashboard/summary', {
            token: session.token,
          })
        ).status,
      ).toBe(200);

      // Acceder directamente a la URL no evita el permiso específico de desactivación.
      expect(
        (
          await request<unknown>('PATCH', `/clients/${client.body.id}`, {
            token: session.token,
            body: { isActive: false },
          })
        ).status,
      ).toBe(403);
      // Cambiar estatus está permitido, pero cancelar requiere el permiso sensible adicional.
      expect(
        (
          await request<unknown>('POST', `/orders/${order.body.id}/status`, {
            token: session.token,
            body: { status: 'cancelled' },
          })
        ).status,
      ).toBe(403);
    }
  });

  it('combina plan, rol y permiso sin permitir escalamiento ni acceso entre compañías', async () => {
    const tenant = await provisionAndLogin('Permission Security Integration', 'secure@test.local');
    await request<unknown>('PATCH', `/subscriptions/companies/${tenant.company.id}`, {
      token: platformToken,
      body: { planCode: 'control', status: 'active', reason: 'Prueba de permisos' },
    });
    const operator = await request<UserResponse>('POST', '/users', {
      token: tenant.accessToken,
      body: {
        fullName: 'Operador Restringido',
        username: 'restringido',
        phone: '+526671110030',
        password: USER_PASSWORD,
        timezoneCode: 'America/Mazatlan',
        role: 'user',
      },
    });
    expect(operator.status).toBe(201);
    const restrictedCodes = [
      'dashboard.view',
      'clients.view',
      'orders.view',
      'orders.change_status',
      'catalog.view',
      'inventory.view',
    ];
    expect(
      (
        await request<UserPermissionProfileResponse>(
          'PUT',
          `/permissions/users/${operator.body.id}`,
          {
            token: tenant.accessToken,
            body: { templateCode: null, permissionCodes: restrictedCodes },
          },
        )
      ).status,
    ).toBe(200);

    const temporaryLogin = await login(`restringido@${tenant.company.loginCode}`, USER_PASSWORD);
    await request<unknown>('PATCH', '/users/me/password', {
      token: temporaryLogin.body.accessToken,
      body: { currentPassword: USER_PASSWORD, newPassword: PERMANENT_PASSWORD },
    });
    const operatorLogin = await login(
      `restringido@${tenant.company.loginCode}`,
      PERMANENT_PASSWORD,
    );
    expect(operatorLogin.status).toBe(200);
    expect(operatorLogin.body.user).toMatchObject({ role: 'user' });
    expect(operatorLogin.body.user.permissions).toEqual(restrictedCodes);

    expect((await listClients(operatorLogin.body.accessToken)).status).toBe(200);
    expect(
      (
        await request<unknown>('POST', '/clients', {
          token: operatorLogin.body.accessToken,
          body: { type: 'person', displayName: 'Cliente no permitido' },
        })
      ).status,
    ).toBe(403);
    expect(
      (
        await request<unknown>('GET', '/profitability', {
          token: operatorLogin.body.accessToken,
        })
      ).status,
    ).toBe(403);
    expect(
      (
        await request<unknown>('GET', '/profitability/analytics?months=6', {
          token: operatorLogin.body.accessToken,
        })
      ).status,
    ).toBe(403);
    expect(
      (
        await request<unknown>('GET', '/profitability/monthly-report?year=2026&month=10', {
          token: operatorLogin.body.accessToken,
        })
      ).status,
    ).toBe(403);
    expect(
      (
        await request<unknown>('GET', '/profitability/monthly-report.xlsx?year=2026&month=10', {
          token: operatorLogin.body.accessToken,
        })
      ).status,
    ).toBe(403);

    const fakeId = '11111111-1111-4111-8111-111111111111';
    expect(
      (
        await request<unknown>('POST', `/orders/${fakeId}/status`, {
          token: operatorLogin.body.accessToken,
          body: { status: 'cancelled' },
        })
      ).status,
    ).toBe(403);
    expect(
      (
        await request<unknown>('PATCH', `/orders/${fakeId}/payment-status`, {
          token: operatorLogin.body.accessToken,
          body: { isPaid: true },
        })
      ).status,
    ).toBe(403);
    expect(
      (
        await request<unknown>('POST', '/inventory/movements', {
          token: operatorLogin.body.accessToken,
          body: {
            productId: fakeId,
            type: 'adjustment',
            quantity: 1,
            unitCost: 10,
            reason: 'Ajuste no autorizado',
          },
        })
      ).status,
    ).toBe(403);
    expect(
      (
        await request<unknown>('POST', `/purchases/${fakeId}/status`, {
          token: operatorLogin.body.accessToken,
          body: { status: 'confirmed' },
        })
      ).status,
    ).toBe(403);
    expect(
      (
        await request<unknown>('POST', `/expenses/${fakeId}/status`, {
          token: operatorLogin.body.accessToken,
          body: { status: 'cancelled' },
        })
      ).status,
    ).toBe(403);
    expect(
      (
        await request<unknown>('PATCH', `/expenses/${fakeId}`, {
          token: operatorLogin.body.accessToken,
          body: { amount: 100 },
        })
      ).status,
    ).toBe(403);

    const units = await request<MeasurementUnitResponse[]>('GET', '/catalogs/units', {
      token: tenant.accessToken,
    });
    const concept = await request<ConceptResponse>('POST', '/catalogs/concepts', {
      token: tenant.accessToken,
      body: {
        kind: 'product',
        sku: 'SEC-001',
        name: 'Producto con costo protegido',
        unitId: units.body[0]!.id,
        cost: 125.5,
        price: 180,
        tracksInventory: false,
        minimumStock: 0,
      },
    });
    expect(concept.status).toBe(201);
    const redacted = await request<ConceptResponse>(
      'GET',
      `/catalogs/concepts/${concept.body.id}`,
      {
        token: operatorLogin.body.accessToken,
      },
    );
    expect(redacted.status).toBe(200);
    expect(redacted.body).toMatchObject({ cost: null, lastCost: null, averageCost: null });

    const inventoryConcept = await request<ConceptResponse>('POST', '/catalogs/concepts', {
      token: tenant.accessToken,
      body: {
        kind: 'product',
        sku: 'SEC-INV-001',
        name: 'Producto con historial protegido',
        unitId: units.body.find(({ name }) => name === 'Pieza')!.id,
        cost: 90,
        price: 150,
        tracksInventory: true,
        minimumStock: 2,
      },
    });
    await request<InventoryMovementResponse>('POST', '/inventory/movements', {
      token: tenant.accessToken,
      body: {
        productId: inventoryConcept.body.id,
        type: 'entry',
        quantity: 4,
        unitCost: 90,
        reason: 'Entrada con costo protegido',
      },
    });
    const redactedInventory = await request<InventoryProductResponse>(
      'GET',
      `/inventory/products/${inventoryConcept.body.id}`,
      { token: operatorLogin.body.accessToken },
    );
    expect(redactedInventory.status).toBe(200);
    expect(redactedInventory.body).toMatchObject({
      stock: '4.000',
      lastCost: null,
      averageCost: null,
    });
    const redactedMovements = await request<{
      totalItems: number;
      items: InventoryMovementResponse[];
    }>('GET', `/inventory/movements?productId=${inventoryConcept.body.id}`, {
      token: operatorLogin.body.accessToken,
    });
    expect(redactedMovements.status).toBe(200);
    expect(redactedMovements.body.items[0]).toMatchObject({
      productId: inventoryConcept.body.id,
      quantity: '4.000',
      unitCost: null,
      reason: 'Entrada con costo protegido',
    });
    expect(
      (
        await request<unknown>('GET', `/inventory/products/${inventoryConcept.body.id}/lots`, {
          token: operatorLogin.body.accessToken,
        })
      ).status,
    ).toBe(403);

    const dashboard = await request<{ financials: unknown }>('GET', '/dashboard/summary', {
      token: operatorLogin.body.accessToken,
    });
    expect(dashboard.status).toBe(200);
    expect(dashboard.body.financials).toBeNull();

    await request<unknown>('PATCH', `/subscriptions/companies/${tenant.company.id}`, {
      token: platformToken,
      body: { planCode: 'essential', status: 'active', reason: 'Validar intersección con plan' },
    });
    expect(
      (
        await request<unknown>('GET', '/inventory/products', {
          token: operatorLogin.body.accessToken,
        })
      ).status,
    ).toBe(403);

    const manager = await request<UserResponse>('POST', '/users', {
      token: tenant.accessToken,
      body: {
        fullName: 'Administrador sin privilegio global',
        username: 'admin_limitado',
        phone: '+526671110031',
        password: USER_PASSWORD,
        timezoneCode: 'America/Mazatlan',
        role: 'admin',
      },
    });
    expect(manager.status).toBe(201);
    const managerTemporaryLogin = await login(
      `admin_limitado@${tenant.company.loginCode}`,
      USER_PASSWORD,
    );
    await request<unknown>('PATCH', '/users/me/password', {
      token: managerTemporaryLogin.body.accessToken,
      body: { currentPassword: USER_PASSWORD, newPassword: PERMANENT_PASSWORD },
    });
    const managerLogin = await login(
      `admin_limitado@${tenant.company.loginCode}`,
      PERMANENT_PASSWORD,
    );
    expect(
      (
        await request<unknown>('PUT', `/permissions/users/${operator.body.id}`, {
          token: managerLogin.body.accessToken,
          body: { templateCode: null, permissionCodes: ['vehicle_catalog.manage'] },
        })
      ).status,
    ).toBe(403);

    const foreign = await provisionAndLogin('Foreign Permission Integration', 'foreign@test.local');
    expect(
      (
        await request<unknown>('GET', `/permissions/users/${foreign.user.id}`, {
          token: tenant.accessToken,
        })
      ).status,
    ).toBe(404);
  });

  it('invalida sesiones y logins de usuarios o compañías desactivadas', async () => {
    const tenant = await provisionAndLogin('Disabled Integration', 'disabled.admin@test.local');
    const createdUser = await request<UserResponse>('POST', '/users', {
      token: tenant.accessToken,
      body: {
        fullName: 'Usuario Desactivable',
        username: 'desactivable',
        email: 'disabled.user@test.local',
        phone: '+526671112255',
        password: USER_PASSWORD,
        timezoneCode: 'America/Mazatlan',
        role: 'user',
      },
    });
    expect(createdUser.status).toBe(201);
    const userLogin = await login(`desactivable@${tenant.company.loginCode}`, USER_PASSWORD);
    expect(userLogin.status).toBe(200);

    const disabledUser = await request<UserResponse>('PATCH', `/users/${createdUser.body.id}`, {
      token: tenant.accessToken,
      body: { isActive: false },
    });
    expect(disabledUser.status).toBe(200);
    expect(disabledUser.body).toMatchObject({ isActive: false });
    expect((await login(`desactivable@${tenant.company.loginCode}`, USER_PASSWORD)).status).toBe(
      401,
    );
    expect(
      (await request<unknown>('GET', '/auth/me', { token: userLogin.body.accessToken })).status,
    ).toBe(401);
    expect(
      (
        await request<unknown>('POST', '/auth/refresh', {
          cookie: cookiePair(userLogin.setCookie!),
        })
      ).status,
    ).toBe(401);

    await control.query('UPDATE public.companies SET is_active = false WHERE id = $1', [
      tenant.user.companyId,
    ]);
    expect((await login(tenant.user.loginName, PERMANENT_PASSWORD)).status).toBe(401);
    expect((await listClients(tenant.accessToken)).status).toBe(401);
  });

  it('completa compañía → usuario → login → clientes con identidad de auditoría', async () => {
    const tenant = await provisionAndLogin('Full Flow Integration', 'flow.admin@test.local');
    const withoutPhone = await request<unknown>('POST', '/users', {
      token: tenant.accessToken,
      body: {
        fullName: 'Usuario Sin Celular',
        username: 'sin_celular',
        password: USER_PASSWORD,
        timezoneCode: 'America/Mazatlan',
        role: 'user',
      },
    });
    expect(withoutPhone.status).toBe(400);
    const invalidPassword = await request<unknown>('POST', '/users', {
      token: tenant.accessToken,
      body: {
        fullName: 'Usuario Inválido',
        username: 'invalido',
        password: 'abcdef',
        timezoneCode: 'America/Mazatlan',
        role: 'user',
      },
    });
    expect(invalidPassword.status).toBe(400);
    const createdUser = await request<UserResponse>('POST', '/users', {
      token: tenant.accessToken,
      body: {
        fullName: 'Operador Flujo',
        username: 'operador',
        phone: '+526671112233',
        password: USER_PASSWORD,
        timezoneCode: 'America/Mazatlan',
        role: 'user',
      },
    });
    expect(createdUser.status).toBe(201);
    expect(createdUser.body.email).toBeNull();
    expect(createdUser.body.phone).toBe('+526671112233');

    const userLogin = await login(`operador@${tenant.company.loginCode}`, USER_PASSWORD);
    expect(userLogin.status).toBe(200);
    expect(userLogin.body.user.mustChangePassword).toBe(true);
    expect(userLogin.body.user.loginName).toBe(`operador@${tenant.company.loginCode}`);
    expect(userLogin.body.user.companyId).toBe(tenant.user.companyId);
    expect(userLogin.body.user.companyName).toBe(tenant.company.name);
    expect((await listClients(userLogin.body.accessToken)).status).toBe(403);
    const passwordChanged = await request<unknown>('PATCH', '/users/me/password', {
      token: userLogin.body.accessToken,
      body: { currentPassword: USER_PASSWORD, newPassword: PERMANENT_PASSWORD },
    });
    expect(passwordChanged.status).toBe(204);
    const permanentLogin = await login(`operador@${tenant.company.loginCode}`, PERMANENT_PASSWORD);
    expect(permanentLogin.status).toBe(200);
    expect(permanentLogin.body.user.mustChangePassword).toBe(false);
    const restoredUser = await request<LoginResponse['user']>('GET', '/auth/me', {
      token: permanentLogin.body.accessToken,
    });
    expect(restoredUser.body.companyName).toBe(tenant.company.name);

    const createdClient = await request<ClientResponse>('POST', '/clients', {
      token: permanentLogin.body.accessToken,
      body: {
        type: 'person',
        displayName: 'Cliente del flujo completo',
        email: 'cliente.flujo@test.local',
        phone: '6671234567',
      },
    });
    expect(createdClient.status).toBe(201);
    expect(createdClient.body.createdByUserId).toBe(createdUser.body.id);
    expect(createdClient.body.updatedByUserId).toBe(createdUser.body.id);

    const listed = await listClients(permanentLogin.body.accessToken);
    expect(listed.status).toBe(200);
    expect(listed.body.totalItems).toBe(1);
    expect(listed.body.items[0]?.id).toBe(createdClient.body.id);

    const fetched = await request<ClientResponse>('GET', `/clients/${createdClient.body.id}`, {
      token: permanentLogin.body.accessToken,
    });
    expect(fetched.status).toBe(200);
    expect(fetched.body.displayName).toBe('Cliente del flujo completo');

    const updated = await request<ClientResponse>('PATCH', `/clients/${createdClient.body.id}`, {
      token: permanentLogin.body.accessToken,
      body: { notes: 'Actualizado desde la integración' },
    });
    expect(updated.status).toBe(200);
    expect(updated.body).toMatchObject({
      id: createdClient.body.id,
      displayName: 'Cliente del flujo completo',
      updatedByUserId: createdUser.body.id,
    });
  });

  it('administra unidades, productos y servicios aislados por compañía y plan', async () => {
    const tenant = await provisionAndLogin(
      'Concept Catalog Integration',
      'concepts.admin@test.local',
    );
    expect(
      (
        await request<MeasurementUnitResponse[]>('GET', '/catalogs/units', {
          token: tenant.accessToken,
        })
      ).status,
    ).toBe(403);

    const upgraded = await request<unknown>(
      'PATCH',
      `/subscriptions/companies/${tenant.company.id}`,
      {
        token: platformToken,
        body: { planCode: 'control', status: 'active', reason: 'Catálogo de integración' },
      },
    );
    expect(upgraded.status).toBe(200);

    const units = await request<MeasurementUnitResponse[]>('GET', '/catalogs/units', {
      token: tenant.accessToken,
    });
    expect(units.status).toBe(200);
    expect(units.body).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ name: 'Pieza', satCode: 'H87', allowsDecimals: false }),
        expect.objectContaining({ name: 'Servicio', satCode: 'E48' }),
      ]),
    );
    expect(units.body.map(({ name }) => name)).not.toContain('Hora');

    const customUnit = await request<MeasurementUnitResponse>('POST', '/catalogs/units', {
      token: tenant.accessToken,
      body: { name: 'Paquete', symbol: 'paq', satCode: 'XPK', allowsDecimals: false },
    });
    expect(customUnit.status).toBe(201);
    expect(customUnit.body).toMatchObject({
      name: 'Paquete',
      symbol: 'paq',
      satCode: 'XPK',
      isActive: true,
    });
    expect(
      (
        await request<unknown>('POST', '/catalogs/units', {
          token: tenant.accessToken,
          body: { name: 'Otro paquete', symbol: 'PAQ', allowsDecimals: true },
        })
      ).status,
    ).toBe(409);

    const invalidService = await request<unknown>('POST', '/catalogs/concepts', {
      token: tenant.accessToken,
      body: {
        kind: 'service',
        sku: 'SERV-INV',
        name: 'Servicio con inventario inválido',
        unitId: customUnit.body.id,
        cost: 100,
        price: 200,
        tracksInventory: true,
      },
    });
    expect(invalidService.status).toBe(400);

    const product = await request<ConceptResponse>('POST', '/catalogs/concepts', {
      token: tenant.accessToken,
      body: {
        kind: 'product',
        sku: 'ace-5w30',
        name: 'Aceite sintético 5W-30',
        description: 'Presentación de un litro',
        unitId: customUnit.body.id,
        cost: 120.5,
        price: 189.9,
        tracksInventory: true,
        satProductServiceCode: '15121501',
      },
    });
    expect(product.status).toBe(201);
    expect(product.body).toMatchObject({
      kind: 'product',
      sku: 'ACE-5W30',
      cost: '120.50',
      price: '189.90',
      tracksInventory: true,
      satProductServiceCode: '15121501',
      unit: { id: customUnit.body.id, symbol: 'paq' },
    });
    expect(
      (
        await request<unknown>('POST', '/catalogs/concepts', {
          token: tenant.accessToken,
          body: {
            kind: 'product',
            sku: 'Ace-5W30',
            name: 'Producto duplicado',
            unitId: customUnit.body.id,
            cost: 1,
            price: 2,
            tracksInventory: false,
          },
        })
      ).status,
    ).toBe(409);

    const listed = await request<{ totalItems: number; items: ConceptResponse[] }>(
      'GET',
      '/catalogs/concepts?search=5W-30&kind=product',
      { token: tenant.accessToken },
    );
    expect(listed.status).toBe(200);
    expect(listed.body.totalItems).toBe(1);
    expect(listed.body.items[0]?.id).toBe(product.body.id);

    const deactivated = await request<ConceptResponse>(
      'PATCH',
      `/catalogs/concepts/${product.body.id}`,
      { token: tenant.accessToken, body: { isActive: false } },
    );
    expect(deactivated.status).toBe(200);
    expect(deactivated.body.isActive).toBe(false);
    const inactive = await request<{ totalItems: number; items: ConceptResponse[] }>(
      'GET',
      '/catalogs/concepts?isActive=false',
      { token: tenant.accessToken },
    );
    expect(inactive.body.items.map(({ id }) => id)).toContain(product.body.id);
  });

  it('administra proveedores aislados y conserva un Proveedor general predeterminado', async () => {
    const tenant = await provisionAndLogin('Supplier Integration', 'supplier.admin@test.local');
    await request<unknown>('PATCH', `/subscriptions/companies/${tenant.company.id}`, {
      token: platformToken,
      body: { planCode: 'control', status: 'active', reason: 'Proveedores de integración' },
    });

    const initial = await request<{ totalItems: number; items: SupplierResponse[] }>(
      'GET',
      '/suppliers',
      { token: tenant.accessToken },
    );
    expect(initial.status).toBe(200);
    expect(initial.body.totalItems).toBe(1);
    expect(initial.body.items[0]).toMatchObject({
      commercialName: 'Proveedor general',
      isActive: true,
      isDefault: true,
    });

    const created = await request<SupplierResponse>('POST', '/suppliers', {
      token: tenant.accessToken,
      body: {
        commercialName: 'Refaccionaria del Pacífico',
        legalName: 'Refacciones del Pacífico, S.A. de C.V.',
        taxId: 'RPA010101AB1',
        phone: '+526671223344',
        email: 'VENTAS@PROVEEDOR.MX',
        notes: 'Entrega los martes',
      },
    });
    expect(created.status).toBe(201);
    expect(created.body).toMatchObject({
      commercialName: 'Refaccionaria del Pacífico',
      taxId: 'RPA010101AB1',
      email: 'ventas@proveedor.mx',
      isActive: true,
      isDefault: false,
    });

    const duplicateName = await request<unknown>('POST', '/suppliers', {
      token: tenant.accessToken,
      body: { commercialName: 'refaccionaria del pacífico' },
    });
    expect(duplicateName.status).toBe(409);
    const duplicateTaxId = await request<unknown>('POST', '/suppliers', {
      token: tenant.accessToken,
      body: { commercialName: 'Otro proveedor', taxId: 'rpa010101ab1' },
    });
    expect(duplicateTaxId.status).toBe(409);

    const updated = await request<SupplierResponse>('PATCH', `/suppliers/${created.body.id}`, {
      token: tenant.accessToken,
      body: { phone: '+526679998877', notes: 'Entrega lunes y jueves' },
    });
    expect(updated.body).toMatchObject({
      phone: '+526679998877',
      notes: 'Entrega lunes y jueves',
    });
    const deactivated = await request<SupplierResponse>('PATCH', `/suppliers/${created.body.id}`, {
      token: tenant.accessToken,
      body: { isActive: false },
    });
    expect(deactivated.body.isActive).toBe(false);

    const protectedDefault = await request<unknown>(
      'PATCH',
      `/suppliers/${initial.body.items[0]!.id}`,
      { token: tenant.accessToken, body: { isActive: false } },
    );
    expect(protectedDefault.status).toBe(400);

    const otherTenant = await provisionAndLogin(
      'Supplier Isolation',
      'supplier.isolation@test.local',
    );
    await request<unknown>('PATCH', `/subscriptions/companies/${otherTenant.company.id}`, {
      token: platformToken,
      body: { planCode: 'control', status: 'active', reason: 'Aislamiento de proveedores' },
    });
    const isolated = await request<{ totalItems: number; items: SupplierResponse[] }>(
      'GET',
      '/suppliers',
      { token: otherTenant.accessToken },
    );
    expect(isolated.body.totalItems).toBe(1);
    expect(isolated.body.items[0]).toMatchObject({
      commercialName: 'Proveedor general',
      isDefault: true,
    });
  });

  it('administra gastos, categorías, recurrencia, proveedor general e historial', async () => {
    const tenant = await provisionAndLogin('Expense Integration', 'expense.admin@test.local');
    expect(
      (
        await request<unknown>('GET', '/expenses/categories', {
          token: tenant.accessToken,
        })
      ).status,
    ).toBe(200);

    const categories = await request<ExpenseCategoryResponse[]>('GET', '/expenses/categories', {
      token: tenant.accessToken,
    });
    expect(categories.status).toBe(200);
    expect(categories.body).toHaveLength(6);
    expect(categories.body.map(({ code }) => code).sort()).toEqual([
      'other',
      'payroll',
      'rent',
      'tools',
      'transportation',
      'utilities',
    ]);
    expect(categories.body.every(({ isActive, isSystem }) => isActive && isSystem)).toBe(true);
    const rent = categories.body.find(({ code }) => code === 'rent')!;
    const tools = categories.body.find(({ code }) => code === 'tools')!;

    const invalidAmount = await request<unknown>('POST', '/expenses', {
      token: tenant.accessToken,
      body: {
        categoryId: rent.id,
        occurredOn: '2026-10-01',
        description: 'Importe inválido',
        amount: 100.555,
      },
    });
    expect(invalidAmount.status).toBe(400);

    const created = await request<ExpenseResponse>('POST', '/expenses', {
      token: tenant.accessToken,
      body: {
        categoryId: rent.id,
        occurredOn: '2026-10-01',
        description: 'Renta del taller',
        reference: 'REN-OCT-2026',
        amount: 12500.5,
        notes: 'Pago mensual',
        recurrenceType: 'recurring',
      },
    });
    expect(created.status).toBe(201);
    expect(created.body).toMatchObject({
      category: { code: 'rent', name: 'Renta' },
      supplier: { commercialName: 'Proveedor general', isDefault: true },
      status: 'confirmed',
      recurrenceType: 'recurring',
      occurredOn: '2026-10-01',
      description: 'Renta del taller',
      reference: 'REN-OCT-2026',
      amount: '12500.50',
      notes: 'Pago mensual',
      receiptFileKey: null,
      statusHistory: [
        { previousStatus: null, newStatus: 'confirmed', changedByUserId: tenant.user.id },
      ],
      changeHistory: [],
    });
    expect(created.body.confirmedAt).not.toBeNull();

    const edited = await request<ExpenseResponse>('PATCH', `/expenses/${created.body.id}`, {
      token: tenant.accessToken,
      body: { amount: 12750, reference: null, notes: 'Renta actualizada' },
    });
    expect(edited.body).toMatchObject({
      amount: '12750.00',
      reference: null,
      notes: 'Renta actualizada',
    });
    expect(edited.body.changeHistory).toEqual([
      expect.objectContaining({
        changedFields: ['reference', 'amount', 'notes'],
        previousValues: {
          reference: 'REN-OCT-2026',
          amount: '12500.50',
          notes: 'Pago mensual',
        },
        newValues: { reference: null, amount: '12750.00', notes: 'Renta actualizada' },
        changedByUserId: tenant.user.id,
      }),
    ]);
    expect(
      (
        await request<unknown>('POST', `/expenses/${created.body.id}/status`, {
          token: tenant.accessToken,
          body: { status: 'confirmed' },
        })
      ).status,
    ).toBe(400);

    const cancelled = await request<ExpenseResponse>(
      'POST',
      `/expenses/${created.body.id}/status`,
      { token: tenant.accessToken, body: { status: 'cancelled' } },
    );
    expect(cancelled.body.status).toBe('cancelled');
    expect(cancelled.body.cancelledAt).not.toBeNull();
    expect(cancelled.body.statusHistory.map(({ newStatus }) => newStatus)).toEqual([
      'confirmed',
      'cancelled',
    ]);
    expect(
      (
        await request<unknown>('PATCH', `/expenses/${created.body.id}`, {
          token: tenant.accessToken,
          body: { amount: 1 },
        })
      ).status,
    ).toBe(400);

    const unfiltered = await request<{ totalItems: number; items: ExpenseResponse[] }>(
      'GET',
      '/expenses',
      { token: tenant.accessToken },
    );
    expect(unfiltered.body.totalItems).toBe(1);
    for (const query of [
      'search=renta',
      'status=cancelled',
      'recurrenceType=recurring',
      `categoryId=${rent.id}`,
    ]) {
      const filtered = await request<{ totalItems: number }>('GET', `/expenses?${query}`, {
        token: tenant.accessToken,
      });
      expect({ query, totalItems: filtered.body.totalItems }).toEqual({ query, totalItems: 1 });
    }
    const listed = await request<{ totalItems: number; items: ExpenseResponse[] }>(
      'GET',
      `/expenses?search=renta&status=cancelled&recurrenceType=recurring&categoryId=${rent.id}`,
      { token: tenant.accessToken },
    );
    expect(listed.status).toBe(200);
    expect(listed.body.totalItems).toBe(1);
    expect(listed.body.items[0]?.id).toBe(created.body.id);

    const singleExpense = await request<ExpenseResponse>('POST', '/expenses', {
      token: tenant.accessToken,
      body: {
        categoryId: categories.body.find(({ code }) => code === 'other')!.id,
        occurredOn: '2026-10-02',
        description: 'Gasto único',
        amount: 250,
      },
    });
    expect(singleExpense.body.recurrenceType).toBe('one_time');
    const singleExpenseCancelled = await request<ExpenseResponse>(
      'POST',
      `/expenses/${singleExpense.body.id}/status`,
      { token: tenant.accessToken, body: { status: 'cancelled' } },
    );
    expect(singleExpenseCancelled.body.statusHistory.map(({ newStatus }) => newStatus)).toEqual([
      'confirmed',
      'cancelled',
    ]);

    const utilities = categories.body.find(({ code }) => code === 'utilities')!;
    const previousMonthExpense = await request<ExpenseResponse>('POST', '/expenses', {
      token: tenant.accessToken,
      body: {
        categoryId: utilities.id,
        occurredOn: '2026-09-20',
        description: 'Electricidad septiembre',
        amount: 1000,
      },
    });
    const currentMonthExpense = await request<ExpenseResponse>('POST', '/expenses', {
      token: tenant.accessToken,
      body: {
        categoryId: utilities.id,
        occurredOn: '2026-10-02',
        description: 'Electricidad octubre',
        amount: 1500,
      },
    });
    const movedExpense = await request<ExpenseResponse>(
      'PATCH',
      `/expenses/${currentMonthExpense.body.id}`,
      {
        token: tenant.accessToken,
        body: {
          categoryId: tools.id,
          occurredOn: '2026-10-03',
          description: 'Herramientas octubre',
          amount: 1600,
        },
      },
    );
    expect(movedExpense.status).toBe(200);
    expect(movedExpense.body).toMatchObject({
      category: { id: tools.id, code: 'tools' },
      occurredOn: '2026-10-03',
      description: 'Herramientas octubre',
      amount: '1600.00',
    });
    expect(movedExpense.body.changeHistory.at(-1)).toMatchObject({
      changedFields: ['categoryId', 'occurredOn', 'description', 'amount'],
      previousValues: {
        categoryId: utilities.id,
        occurredOn: '2026-10-02',
        description: 'Electricidad octubre',
        amount: '1500.00',
      },
      newValues: {
        categoryId: tools.id,
        occurredOn: '2026-10-03',
        description: 'Herramientas octubre',
        amount: '1600.00',
      },
    });

    const monthly = await request<ExpenseMonthlySummaryResponse>(
      'GET',
      '/expenses/summary?month=2026-10',
      { token: tenant.accessToken },
    );
    expect(monthly.status).toBe(200);
    expect(monthly.body).toMatchObject({
      month: '2026-10',
      previousMonth: '2026-09',
      confirmedCount: 1,
      confirmedAmount: '1600.00',
      previousConfirmedCount: 1,
      previousConfirmedAmount: '1000.00',
      changeAmount: '600.00',
      changePercent: '60.00',
      direction: 'increase',
      draftCount: 0,
      draftAmount: '0.00',
    });
    expect(monthly.body.byCategory).toHaveLength(1);
    expect(monthly.body.byCategory[0]).toMatchObject({
      category: { code: 'tools' },
      count: 1,
      amount: '1600.00',
    });
    expect(monthly.body.recentExpenses.map(({ id }) => id)).toEqual(
      expect.arrayContaining([previousMonthExpense.body.id, currentMonthExpense.body.id]),
    );

    const octoberFiltered = await request<{ totalItems: number; items: ExpenseResponse[] }>(
      'GET',
      `/expenses?occurredFrom=2026-10-03&occurredTo=2026-10-03&categoryId=${tools.id}&status=confirmed`,
      { token: tenant.accessToken },
    );
    expect(octoberFiltered.body.totalItems).toBe(1);
    expect(octoberFiltered.body.items[0]?.id).toBe(currentMonthExpense.body.id);
    expect(
      (
        await request<unknown>('GET', '/expenses?occurredFrom=2026-10-31&occurredTo=2026-10-01', {
          token: tenant.accessToken,
        })
      ).status,
    ).toBe(400);

    const versions = await control.query<Array<{ version: number }>>(
      'SELECT version FROM public.tenant_schema_versions WHERE company_id = $1 AND version = 29',
      [tenant.company.id],
    );
    expect(versions).toEqual([{ version: 29 }]);

    const isolated = await provisionAndLogin(
      'Expense Isolated Integration',
      'expense.isolated@test.local',
    );
    expect(
      (
        await request<unknown>('GET', `/expenses/${currentMonthExpense.body.id}`, {
          token: isolated.accessToken,
        })
      ).status,
    ).toBe(404);
    const isolatedExpenses = await request<{ totalItems: number; items: ExpenseResponse[] }>(
      'GET',
      '/expenses',
      { token: isolated.accessToken },
    );
    expect(isolatedExpenses.body.items.map(({ id }) => id)).not.toContain(
      currentMonthExpense.body.id,
    );
  });

  it('calcula utilidad con ingresos terminados, FIFO y gastos confirmados', async () => {
    const tenant = await provisionAndLogin(
      'Profitability Integration',
      'profitability.admin@test.local',
    );
    expect(
      (
        await request<unknown>(
          'GET',
          '/profitability?occurredFrom=2026-10-01&occurredTo=2026-10-31',
          {
            token: tenant.accessToken,
          },
        )
      ).status,
    ).toBe(200);
    expect(
      (
        await request<unknown>('GET', '/profitability/analytics?months=6', {
          token: tenant.accessToken,
        })
      ).status,
    ).toBe(200);
    expect(
      (
        await request<unknown>('GET', '/profitability/monthly-report?year=2026&month=10', {
          token: tenant.accessToken,
        })
      ).status,
    ).toBe(200);
    await request<unknown>('PATCH', `/subscriptions/companies/${tenant.company.id}`, {
      token: platformToken,
      body: { planCode: 'control', status: 'active', reason: 'Utilidad de integración' },
    });

    const units = await request<MeasurementUnitResponse[]>('GET', '/catalogs/units', {
      token: tenant.accessToken,
    });
    const piece = units.body.find(({ name }) => name === 'Pieza')!;
    const serviceUnit = units.body.find(({ name }) => name === 'Servicio')!;
    const product = await request<ConceptResponse>('POST', '/catalogs/concepts', {
      token: tenant.accessToken,
      body: {
        kind: 'product',
        sku: 'UTL-FIFO-001',
        name: 'Producto FIFO utilidad',
        unitId: piece.id,
        cost: 0,
        price: 200,
        tracksInventory: true,
      },
    });
    const catalogService = await request<ConceptResponse>('POST', '/catalogs/concepts', {
      token: tenant.accessToken,
      body: {
        kind: 'service',
        name: 'Servicio de utilidad',
        unitId: serviceUnit.id,
        cost: 50,
        price: 300,
        tracksInventory: false,
      },
    });
    await request<InventoryMovementResponse>('POST', '/inventory/movements', {
      token: tenant.accessToken,
      body: {
        productId: product.body.id,
        type: 'entry',
        quantity: 2,
        unitCost: 80,
        reason: 'Lote para utilidad',
      },
    });
    const customer = await request<ClientResponse>('POST', '/clients', {
      token: tenant.accessToken,
      body: { type: 'person', displayName: 'Cliente Rentable' },
    });
    const brand = await request<VehicleBrandResponse>('POST', '/catalogs/vehicle-brands', {
      token: tenant.accessToken,
      body: { name: 'Marca Utilidad Integration' },
    });
    const model = await request<VehicleModelResponse>('POST', '/catalogs/vehicle-models', {
      token: tenant.accessToken,
      body: { brandId: brand.body.id, name: 'Modelo Utilidad Integration' },
    });
    const vehicle = await request<VehicleResponse>(
      'POST',
      `/clients/${customer.body.id}/vehicles`,
      {
        token: tenant.accessToken,
        body: { brandId: brand.body.id, modelId: model.body.id, year: 2025, color: 'Gris' },
      },
    );
    const order = await request<OrderResponse>('POST', '/orders', {
      token: tenant.accessToken,
      body: {
        customerId: customer.body.id,
        vehicleId: vehicle.body.id,
        externalFolio: 'CBS-2026-100',
        items: [
          {
            productServiceId: product.body.id,
            description: product.body.name,
            quantity: 1,
            affectsOrderTotal: true,
          },
          {
            productServiceId: catalogService.body.id,
            description: catalogService.body.name,
            quantity: 1,
          },
          { description: 'Servicio libre', quantity: 1, unitPrice: 200, unitCost: 20 },
          {
            kind: 'product',
            description: 'Insumo incluido',
            quantity: 2,
            unitCost: 0,
            affectsOrderTotal: false,
          },
        ],
      },
    });
    expect(order.status).toBe(201);
    expect(order.body.items.map(({ kind, unitCost }) => ({ kind, unitCost }))).toEqual([
      { kind: 'product', unitCost: '80.00' },
      { kind: 'service', unitCost: '50.00' },
      { kind: 'service', unitCost: '20.00' },
      { kind: 'product', unitCost: '0.00' },
    ]);
    const unknownCostService = await request<OrderResponse>('POST', '/orders', {
      token: tenant.accessToken,
      body: {
        customerId: customer.body.id,
        vehicleId: vehicle.body.id,
        items: [
          { kind: 'service', description: 'Mano de obra propia', quantity: 1, unitPrice: 250 },
        ],
      },
    });
    expect(unknownCostService.status).toBe(201);
    expect(unknownCostService.body.items[0]).toMatchObject({
      kind: 'service',
      unitCost: null,
      costAmount: null,
    });
    const completedUnknownCostService = await request<OrderResponse>(
      'POST',
      `/orders/${unknownCostService.body.id}/status`,
      { token: tenant.accessToken, body: { status: 'completed' } },
    );
    expect(completedUnknownCostService.body).toMatchObject({
      total: '250.00',
      totalCost: '0.00',
      grossProfit: '250.00',
      hasUnknownCosts: false,
      isFinanciallyComplete: true,
    });
    const emptyCostServiceDashboard = await request<DashboardSummaryResponse>(
      'GET',
      '/dashboard/summary',
      { token: tenant.accessToken },
    );
    expect(emptyCostServiceDashboard.body.financials).toEqual({
      directCost: '0.00',
      grossProfit: '250.00',
      operatingExpenses: '0.00',
      operatingProfit: '250.00',
      incompleteOrderCount: 0,
      missingPriceOrderCount: 0,
      missingCostOrderCount: 0,
      isComplete: true,
    });
    const serviceCostReport = await request<ProfitabilityReportResponse>(
      'GET',
      '/profitability?occurredFrom=2026-10-01&occurredTo=2026-10-31',
      { token: tenant.accessToken },
    );
    expect(serviceCostReport.body.totals).toMatchObject({
      completedOrderCount: 1,
      incompleteOrderCount: 0,
      missingPriceOrderCount: 0,
      missingCostOrderCount: 0,
      income: '250.00',
      directCost: '0.00',
      grossProfit: '250.00',
      isComplete: true,
    });
    await request<OrderResponse>('POST', `/orders/${unknownCostService.body.id}/status`, {
      token: tenant.accessToken,
      body: { status: 'cancelled' },
    });
    const confirmedZeroCostService = await request<OrderResponse>('POST', '/orders', {
      token: tenant.accessToken,
      body: {
        customerId: customer.body.id,
        vehicleId: vehicle.body.id,
        items: [
          {
            kind: 'service',
            description: 'Servicio sin costo para el taller',
            quantity: 1,
            unitPrice: 75,
            unitCost: 0,
          },
        ],
      },
    });
    expect(confirmedZeroCostService.body).toMatchObject({
      total: '75.00',
      totalCost: '0.00',
      grossProfit: '75.00',
      hasUnknownCosts: false,
      isFinanciallyComplete: true,
    });
    const completedZeroCostService = await request<OrderResponse>(
      'POST',
      `/orders/${confirmedZeroCostService.body.id}/status`,
      { token: tenant.accessToken, body: { status: 'completed' } },
    );
    expect(completedZeroCostService.body).toMatchObject({
      status: 'completed',
      total: '75.00',
      totalCost: '0.00',
      grossProfit: '75.00',
      hasUnknownCosts: false,
      isFinanciallyComplete: true,
    });
    const zeroCostServiceDashboard = await request<DashboardSummaryResponse>(
      'GET',
      '/dashboard/summary',
      { token: tenant.accessToken },
    );
    expect(zeroCostServiceDashboard.body.financials).toMatchObject({
      directCost: '0.00',
      grossProfit: '75.00',
      operatingProfit: '75.00',
      incompleteOrderCount: 0,
      missingCostOrderCount: 0,
      isComplete: true,
    });
    await request<OrderResponse>('POST', `/orders/${confirmedZeroCostService.body.id}/status`, {
      token: tenant.accessToken,
      body: { status: 'cancelled' },
    });
    const catalogPriceOverride = await request<OrderResponse>('POST', '/orders', {
      token: tenant.accessToken,
      body: {
        customerId: customer.body.id,
        vehicleId: vehicle.body.id,
        items: [{ productServiceId: catalogService.body.id, quantity: 1, unitPrice: 345 }],
      },
    });
    expect(catalogPriceOverride.status).toBe(201);
    expect(catalogPriceOverride.body.items[0]).toMatchObject({
      unitPrice: '345.00',
      amount: '345.00',
    });
    const editedCatalogPrice = await request<OrderResponse>(
      'PATCH',
      `/orders/${catalogPriceOverride.body.id}`,
      {
        token: tenant.accessToken,
        body: {
          items: [
            {
              itemId: catalogPriceOverride.body.items[0]!.id,
              productServiceId: catalogService.body.id,
              quantity: 1,
              unitPrice: 360,
            },
          ],
        },
      },
    );
    expect(editedCatalogPrice.status).toBe(200);
    expect(editedCatalogPrice.body.items[0]).toMatchObject({
      unitPrice: '360.00',
      amount: '360.00',
    });
    await request<OrderResponse>('POST', `/orders/${catalogPriceOverride.body.id}/status`, {
      token: tenant.accessToken,
      body: { status: 'cancelled' },
    });
    const productWithoutCost = await request<OrderResponse>('POST', '/orders', {
      token: tenant.accessToken,
      body: {
        customerId: customer.body.id,
        vehicleId: vehicle.body.id,
        items: [
          {
            kind: 'product',
            description: 'Producto libre',
            quantity: 1,
            unitPrice: 100,
            affectsOrderTotal: true,
          },
        ],
      },
    });
    expect(productWithoutCost.status).toBe(201);
    expect(productWithoutCost.body.items[0]).toMatchObject({
      kind: 'product',
      unitPrice: '100.00',
      unitCost: null,
    });
    const completedWithoutCost = await request<OrderResponse>(
      'POST',
      `/orders/${productWithoutCost.body.id}/status`,
      { token: tenant.accessToken, body: { status: 'completed' } },
    );
    expect(completedWithoutCost.status).toBe(200);
    expect(completedWithoutCost.body).toMatchObject({
      status: 'completed',
      total: '100.00',
      totalCost: '0.00',
      grossProfit: null,
      hasUnknownCosts: true,
      isFinanciallyComplete: false,
    });
    const incompleteProductReport = await request<ProfitabilityReportResponse>(
      'GET',
      '/profitability?occurredFrom=2026-10-01&occurredTo=2026-10-31',
      { token: tenant.accessToken },
    );
    expect(incompleteProductReport.body.orders).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: productWithoutCost.body.id,
          hasMissingPrice: false,
          hasUnknownProductCost: true,
          isComplete: false,
        }),
      ]),
    );
    await control.query(
      `UPDATE ${quoteIdentifier(tenant.company.schemaName)}.orders
       SET closed_at = '2026-10-03 12:00:00+00' WHERE id = $1`,
      [productWithoutCost.body.id],
    );
    const incompleteMonthlyReport = await request<MonthlyProfitabilityReportResponse>(
      'GET',
      '/profitability/monthly-report?year=2026&month=10',
      { token: tenant.accessToken },
    );
    expect(incompleteMonthlyReport.body.summary).toMatchObject({
      completedOrderCount: 1,
      incompleteCostOrderCount: 1,
      generatedIncome: '100.00',
      isComplete: false,
    });
    expect(incompleteMonthlyReport.body.orders).toEqual([
      expect.objectContaining({
        id: productWithoutCost.body.id,
        grossProfit: null,
        hasUnknownProductCost: true,
        isCostComplete: false,
      }),
    ]);
    const incompleteWorkbookResponse = await requestBinary(
      '/profitability/monthly-report.xlsx?year=2026&month=10',
      tenant.accessToken,
    );
    const incompleteWorkbook = new Workbook();
    await incompleteWorkbook.xlsx.load(Uint8Array.from(incompleteWorkbookResponse.body).buffer);
    const incompleteSummary = incompleteWorkbook.getWorksheet('Resumen Octubre 2026')!;
    const incompleteOrders = incompleteWorkbook.getWorksheet('Órdenes Octubre 2026')!;
    expect(incompleteSummary.getCell('I5').value).toBe('Información de costos incompleta');
    expect(incompleteOrders.getCell('O6').value).toBeNull();
    expect(incompleteOrders.getCell('P6').value).toBe('No');
    const incompleteProductDashboard = await request<DashboardSummaryResponse>(
      'GET',
      '/dashboard/summary',
      { token: tenant.accessToken },
    );
    expect(incompleteProductDashboard.body.financials).toMatchObject({
      directCost: '0.00',
      grossProfit: '0.00',
      operatingExpenses: '0.00',
      operatingProfit: '0.00',
      incompleteOrderCount: 1,
      missingPriceOrderCount: 0,
      missingCostOrderCount: 1,
      isComplete: false,
    });
    const paidWithoutCost = await request<OrderResponse>(
      'PATCH',
      `/orders/${productWithoutCost.body.id}/payment-status`,
      { token: tenant.accessToken, body: { isPaid: true } },
    );
    expect(paidWithoutCost.body).toMatchObject({
      isPaid: true,
      total: '100.00',
      grossProfit: null,
    });
    await request<OrderResponse>('PATCH', `/orders/${productWithoutCost.body.id}/payment-status`, {
      token: tenant.accessToken,
      body: { isPaid: false },
    });
    await request<OrderResponse>('POST', `/orders/${productWithoutCost.body.id}/status`, {
      token: tenant.accessToken,
      body: { status: 'in_progress' },
    });
    await request<OrderResponse>('POST', `/orders/${productWithoutCost.body.id}/status`, {
      token: tenant.accessToken,
      body: { status: 'completed' },
    });
    await request<OrderResponse>('POST', `/orders/${productWithoutCost.body.id}/status`, {
      token: tenant.accessToken,
      body: { status: 'cancelled' },
    });
    const completed = await request<OrderResponse>('POST', `/orders/${order.body.id}/status`, {
      token: tenant.accessToken,
      body: { status: 'completed' },
    });
    expect(completed.body).toMatchObject({
      total: '700.00',
      totalCost: '150.00',
      grossProfit: '550.00',
      isPaid: false,
    });
    await control.query(
      `UPDATE ${quoteIdentifier(tenant.company.schemaName)}.orders
       SET closed_at = '2026-10-02 12:00:00+00' WHERE id = $1`,
      [order.body.id],
    );

    const categories = await request<ExpenseCategoryResponse[]>('GET', '/expenses/categories', {
      token: tenant.accessToken,
    });
    const expense = await request<ExpenseResponse>('POST', '/expenses', {
      token: tenant.accessToken,
      body: {
        categoryId: categories.body.find(({ code }) => code === 'utilities')!.id,
        occurredOn: '2026-10-02',
        description: 'Gasto operativo de prueba',
        amount: 120,
      },
    });
    expect(expense.body.status).toBe('confirmed');

    const paid = await request<OrderResponse>('PATCH', `/orders/${order.body.id}/payment-status`, {
      token: tenant.accessToken,
      body: { isPaid: true },
    });
    expect(paid.status).toBe(200);
    expect(paid.body).toMatchObject({ isPaid: true });
    expect(paid.body.paidAt).not.toBeNull();
    expect(
      (
        await request<unknown>('POST', `/orders/${order.body.id}/status`, {
          token: tenant.accessToken,
          body: { status: 'cancelled' },
        })
      ).status,
    ).toBe(400);
    expect(
      (
        await request<unknown>('PATCH', `/orders/${order.body.id}`, {
          token: tenant.accessToken,
          body: { notes: 'No debe editar una orden pagada' },
        })
      ).status,
    ).toBe(400);
    const paidOrders = await request<{ items: OrderResponse[] }>('GET', '/orders?isPaid=true', {
      token: tenant.accessToken,
    });
    expect(paidOrders.body.items.map(({ id }) => id)).toContain(order.body.id);

    const inProgressReceivable = await request<OrderResponse>('POST', '/orders', {
      token: tenant.accessToken,
      body: {
        customerId: customer.body.id,
        vehicleId: vehicle.body.id,
        items: [{ description: 'Trabajo todavía en proceso', quantity: 1, unitPrice: 125 }],
      },
    });
    expect(inProgressReceivable.body).toMatchObject({
      status: 'in_progress',
      isPaid: false,
      total: '125.00',
    });

    const report = await request<ProfitabilityReportResponse>(
      'GET',
      '/profitability?occurredFrom=2026-10-01&occurredTo=2026-10-31',
      { token: tenant.accessToken },
    );
    expect(report.status).toBe(200);
    expect(report.body.totals).toEqual({
      completedOrderCount: 1,
      incompleteOrderCount: 0,
      missingPriceOrderCount: 0,
      missingCostOrderCount: 0,
      paidCompletedOrderCount: 1,
      unpaidCompletedOrderCount: 0,
      receivableOrderCount: 1,
      income: '700.00',
      collectedIncome: '700.00',
      outstandingIncome: '0.00',
      receivableAmount: '125.00',
      directCost: '150.00',
      fifoProductCost: '80.00',
      grossProfit: '550.00',
      collectedGrossProfit: '550.00',
      operatingExpenses: '120.00',
      netProfit: '430.00',
      collectedNetResult: '430.00',
      grossMarginPercent: '78.57',
      netMarginPercent: '61.43',
      isComplete: true,
    });
    expect(report.body.byDay).toEqual([
      expect.objectContaining({
        period: '2026-10-02',
        income: '700.00',
        collectedIncome: '700.00',
        outstandingIncome: '0.00',
        operatingExpenses: '120.00',
        netProfit: '430.00',
        collectedNetResult: '430.00',
      }),
    ]);
    expect(report.body.byMonth[0]).toMatchObject({
      period: '2026-10',
      netProfit: '430.00',
      collectedNetResult: '430.00',
    });
    expect(report.body.byCustomer[0]).toMatchObject({
      customerId: customer.body.id,
      customerName: 'Cliente Rentable',
      completedOrderCount: 1,
      collectedIncome: '700.00',
      outstandingIncome: '0.00',
      grossProfit: '550.00',
    });
    expect(report.body.byServiceType).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ type: 'product', income: '200.00', directCost: '80.00' }),
        expect.objectContaining({ type: 'service', income: '500.00', directCost: '70.00' }),
      ]),
    );
    expect(report.body.orders[0]).toMatchObject({
      id: order.body.id,
      isPaid: true,
      fifoProductCost: '80.00',
      grossProfit: '550.00',
      hasMissingPrice: false,
      hasUnknownProductCost: false,
      isComplete: true,
    });
    expect(report.body.orders.map(({ id }) => id)).not.toContain(productWithoutCost.body.id);

    const monthlyReport = await request<MonthlyProfitabilityReportResponse>(
      'GET',
      '/profitability/monthly-report?year=2026&month=10',
      { token: tenant.accessToken },
    );
    expect(monthlyReport.status).toBe(200);
    expect(monthlyReport.body).toMatchObject({
      period: '2026-10',
      label: 'Octubre 2026',
      startsOn: '2026-10-01',
      endsOn: '2026-10-31',
      timezoneCode: 'America/Mazatlan',
      summary: {
        completedOrderCount: 1,
        paidOrderCount: 1,
        pendingOrderCount: 0,
        incompleteCostOrderCount: 0,
        generatedIncome: '700.00',
        collectedIncome: '700.00',
        outstandingIncome: '0.00',
        directCost: '150.00',
        grossProfit: '550.00',
        operatingExpenses: '120.00',
        netProfit: '430.00',
        isComplete: true,
      },
    });
    expect(monthlyReport.body.orders).toEqual([
      expect.objectContaining({
        id: order.body.id,
        externalFolio: 'CBS-2026-100',
        completedOn: '2026-10-02',
        customerId: customer.body.id,
        customerName: 'Cliente Rentable',
        vehicleId: vehicle.body.id,
        vehicleBrand: 'Marca Utilidad Integration',
        vehicleModel: 'Modelo Utilidad Integration',
        vehicleYear: 2025,
        vehicleColor: 'Gris',
        isPaid: true,
        income: '700.00',
        directCost: '150.00',
        grossProfit: '550.00',
        hasUnknownProductCost: false,
        isCostComplete: true,
        concepts: [
          {
            description: product.body.name,
            type: 'product',
            quantity: '1.000',
            affectsOrderTotal: true,
          },
          {
            description: catalogService.body.name,
            type: 'service',
            quantity: '1.000',
            affectsOrderTotal: true,
          },
          {
            description: 'Servicio libre',
            type: 'service',
            quantity: '1.000',
            affectsOrderTotal: true,
          },
          {
            description: 'Insumo incluido',
            type: 'product',
            quantity: '2.000',
            affectsOrderTotal: false,
          },
        ],
      }),
    ]);
    const monthlyWorkbook = await requestBinary(
      '/profitability/monthly-report.xlsx?year=2026&month=10',
      tenant.accessToken,
    );
    expect(monthlyWorkbook.status).toBe(200);
    expect(monthlyWorkbook.contentType).toBe(
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    );
    expect(monthlyWorkbook.contentDisposition).toBe(
      'attachment; filename="reporte-ordenes-utilidad-octubre-2026.xlsx"',
    );
    const parsedWorkbook = new Workbook();
    await parsedWorkbook.xlsx.load(Uint8Array.from(monthlyWorkbook.body).buffer);
    expect(parsedWorkbook.worksheets.map(({ name }) => name)).toEqual([
      'Resumen Octubre 2026',
      'Órdenes Octubre 2026',
    ]);
    const octoberSummary = parsedWorkbook.getWorksheet('Resumen Octubre 2026')!;
    const octoberOrders = parsedWorkbook.getWorksheet('Órdenes Octubre 2026')!;
    expect(octoberSummary.getCell('A2').value).toBe('Resumen mensual de órdenes y utilidad');
    expect(octoberSummary.getCell('D7').value).toBe(120);
    expect(octoberSummary.getCell('F7').value).toBe(430);
    expect(octoberOrders.getCell('A2').value).toBe('Detalle mensual de órdenes');
    expect(octoberOrders.getCell('A6').value).toBe(order.body.folio);
    expect(octoberOrders.getCell('B6').value).toBe('CBS-2026-100');
    expect(octoberOrders.getCell('C6').value).toBeInstanceOf(Date);
    expect(octoberOrders.getCell('D6').value).toBe('Cliente Rentable');
    expect(octoberOrders.getCell('E6').value).toBe(
      'Marca Utilidad Integration Modelo Utilidad Integration',
    );
    expect(octoberOrders.getCell('F6').value).toBe(2025);
    expect(octoberOrders.getCell('G6').value).toBe('Gris');
    expect(octoberOrders.getCell('J6').value).toContain('2 × Insumo incluido — Producto · Insumo');
    expect(octoberOrders.getCell('J6').value).toContain('Servicio libre — Servicio · Cobrable');
    expect(octoberOrders.getCell('J6').alignment).toMatchObject({ wrapText: true });
    expect(octoberOrders.getCell('K6').value).toBe('Pagada');
    expect(octoberOrders.getCell('M6').value).toBe(700);
    expect(octoberOrders.getCell('M6').numFmt).toContain('$');
    expect(octoberOrders.getCell('N6').value).toBe(150);
    expect(octoberOrders.getCell('O6').value).toBe(550);
    expect(octoberOrders.autoFilter).toBeUndefined();
    expect(octoberOrders.views[0]).toMatchObject({ state: 'frozen', ySplit: 5 });

    await control.query(
      `UPDATE ${quoteIdentifier(tenant.company.schemaName)}.orders
       SET closed_at = '2026-10-12 01:30:00+00' WHERE id = $1`,
      [order.body.id],
    );
    const localClosingDay = await request<ProfitabilityReportResponse>(
      'GET',
      '/profitability?occurredFrom=2026-10-01&occurredTo=2026-10-11',
      { token: tenant.accessToken },
    );
    expect(localClosingDay.body.orders.map(({ id }) => id)).toContain(order.body.id);
    expect(localClosingDay.body.byDay).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ period: '2026-10-11', completedOrderCount: 1 }),
      ]),
    );
    const dayBeforeClosing = await request<ProfitabilityReportResponse>(
      'GET',
      '/profitability?occurredFrom=2026-10-01&occurredTo=2026-10-10',
      { token: tenant.accessToken },
    );
    expect(dayBeforeClosing.body.orders.map(({ id }) => id)).not.toContain(order.body.id);

    expect(
      (
        await request<unknown>('GET', '/profitability/monthly-report?year=2026&month=13', {
          token: tenant.accessToken,
        })
      ).status,
    ).toBe(400);

    await control.query(
      `UPDATE ${quoteIdentifier(tenant.company.schemaName)}.orders
       SET closed_at = '2026-11-01 06:30:00+00' WHERE id = $1`,
      [order.body.id],
    );
    const localMonthBoundary = await request<MonthlyProfitabilityReportResponse>(
      'GET',
      '/profitability/monthly-report?year=2026&month=10',
      { token: tenant.accessToken },
    );
    expect(localMonthBoundary.body.orders[0]).toMatchObject({
      id: order.body.id,
      completedOn: '2026-10-31',
    });
    expect(
      (
        await request<MonthlyProfitabilityReportResponse>(
          'GET',
          '/profitability/monthly-report?year=2026&month=11',
          { token: tenant.accessToken },
        )
      ).body.orders,
    ).toEqual([]);
    const localMonthAnalytics = await request<ProfitabilityAnalyticsResponse>(
      'GET',
      '/profitability/analytics?months=6&endingMonth=2026-10',
      { token: tenant.accessToken },
    );
    expect(localMonthAnalytics.body.summary).toMatchObject({
      completedOrderCount: 1,
      generatedIncome: '700.00',
    });
    await control.query(
      `UPDATE ${quoteIdentifier(tenant.company.schemaName)}.orders
       SET closed_at = '2026-10-02 12:00:00+00' WHERE id = $1`,
      [order.body.id],
    );

    const updatedExpense = await request<ExpenseResponse>('PATCH', `/expenses/${expense.body.id}`, {
      token: tenant.accessToken,
      body: { amount: 150 },
    });
    expect(updatedExpense.status).toBe(200);
    expect(updatedExpense.body.changeHistory.at(-1)).toMatchObject({
      changedFields: ['amount'],
      previousValues: { amount: '120.00' },
      newValues: { amount: '150.00' },
    });
    const recalculatedReport = await request<ProfitabilityReportResponse>(
      'GET',
      '/profitability?occurredFrom=2026-10-01&occurredTo=2026-10-31',
      { token: tenant.accessToken },
    );
    expect(recalculatedReport.body.totals).toMatchObject({
      operatingExpenses: '150.00',
      netProfit: '400.00',
      collectedNetResult: '400.00',
    });
    await request<ExpenseResponse>('PATCH', `/expenses/${expense.body.id}`, {
      token: tenant.accessToken,
      body: { amount: 120 },
    });

    const analytics = await request<ProfitabilityAnalyticsResponse>(
      'GET',
      '/profitability/analytics?months=6&endingMonth=2026-10',
      { token: tenant.accessToken },
    );
    expect(analytics.status).toBe(200);
    expect(analytics.body).toMatchObject({
      months: 6,
      occurredFrom: '2026-05-01',
      occurredTo: '2026-10-31',
      summary: {
        period: '2026-10',
        generatedIncome: '700.00',
        generatedDirectCost: '150.00',
        generatedGrossProfit: '550.00',
        operatingExpenses: '120.00',
        generatedNetProfit: '430.00',
        collectedIncome: '700.00',
        collectedDirectCost: '150.00',
        collectedGrossProfit: '550.00',
        collectedNetResult: '430.00',
        isComplete: true,
      },
      collection: {
        paidOrderCount: 1,
        paidAmount: '700.00',
        pendingOrderCount: 0,
        pendingAmount: '0.00',
      },
    });
    expect(analytics.body.series).toHaveLength(6);
    expect(analytics.body.series.map(({ period }) => period)).toEqual([
      '2026-05',
      '2026-06',
      '2026-07',
      '2026-08',
      '2026-09',
      '2026-10',
    ]);
    expect(analytics.body.series[0]).toMatchObject({
      period: '2026-05',
      completedOrderCount: 0,
      collectedOrderCount: 0,
      generatedIncome: '0.00',
      generatedDirectCost: '0.00',
      generatedNetProfit: '0.00',
      generatedNetMarginPercent: null,
      operatingExpenses: '0.00',
    });
    expect(analytics.body.expensesByCategory).toEqual([
      expect.objectContaining({
        categoryCode: 'utilities',
        expenseCount: 1,
        amount: '120.00',
        percentage: '100.00',
      }),
    ]);

    expect(
      (
        await request<unknown>('GET', '/profitability/analytics?months=9', {
          token: tenant.accessToken,
        })
      ).status,
    ).toBe(400);

    const isolated = await provisionAndLogin(
      'Profitability Isolated Integration',
      'profitability.isolated@test.local',
    );
    await request<unknown>('PATCH', `/subscriptions/companies/${isolated.company.id}`, {
      token: platformToken,
      body: { planCode: 'control', status: 'active', reason: 'Aislamiento de analítica' },
    });
    const isolatedAnalytics = await request<ProfitabilityAnalyticsResponse>(
      'GET',
      '/profitability/analytics?months=6&endingMonth=2026-10',
      { token: isolated.accessToken },
    );
    expect(isolatedAnalytics.status).toBe(200);
    expect(isolatedAnalytics.body.summary).toMatchObject({
      generatedIncome: '0.00',
      generatedDirectCost: '0.00',
      generatedNetProfit: '0.00',
      collectedIncome: '0.00',
    });
    expect(isolatedAnalytics.body.expensesByCategory).toEqual([]);
    const isolatedReport = await request<ProfitabilityReportResponse>(
      'GET',
      '/profitability?occurredFrom=2026-10-01&occurredTo=2026-10-31',
      { token: isolated.accessToken },
    );
    expect(isolatedReport.status).toBe(200);
    expect(isolatedReport.body.totals).toMatchObject({
      completedOrderCount: 0,
      incompleteOrderCount: 0,
      income: '0.00',
      directCost: '0.00',
      grossProfit: '0.00',
      operatingExpenses: '0.00',
      netProfit: '0.00',
      isComplete: true,
    });
    expect(isolatedReport.body.orders).toEqual([]);
    const isolatedMonthlyReport = await request<MonthlyProfitabilityReportResponse>(
      'GET',
      '/profitability/monthly-report?year=2026&month=10',
      { token: isolated.accessToken },
    );
    expect(isolatedMonthlyReport.status).toBe(200);
    expect(isolatedMonthlyReport.body.summary).toMatchObject({
      completedOrderCount: 0,
      generatedIncome: '0.00',
      directCost: '0.00',
      operatingExpenses: '0.00',
      netProfit: '0.00',
      isComplete: true,
    });
    expect(isolatedMonthlyReport.body.orders).toEqual([]);
    const isolatedWorkbookResponse = await requestBinary(
      '/profitability/monthly-report.xlsx?year=2026&month=10',
      isolated.accessToken,
    );
    const isolatedWorkbook = new Workbook();
    await isolatedWorkbook.xlsx.load(Uint8Array.from(isolatedWorkbookResponse.body).buffer);
    const isolatedSummary = isolatedWorkbook.getWorksheet('Resumen Octubre 2026')!;
    const isolatedOrders = isolatedWorkbook.getWorksheet('Órdenes Octubre 2026')!;
    expect(isolatedSummary.getCell('B6').value).toBe(0);
    expect(isolatedSummary.getCell('F7').value).toBe(0);
    expect(isolatedOrders.autoFilter).toBeUndefined();
    expect(isolatedOrders.getCell('A6').value).toBe('No hay órdenes terminadas en este periodo.');
    expect(isolatedOrders.getCell('A7').value).toBeNull();

    const pending = await request<OrderResponse>(
      'PATCH',
      `/orders/${order.body.id}/payment-status`,
      { token: tenant.accessToken, body: { isPaid: false } },
    );
    expect(pending.body.isPaid).toBe(false);
    expect(pending.body.paidAt).toBeNull();
    const pendingReport = await request<ProfitabilityReportResponse>(
      'GET',
      '/profitability?occurredFrom=2026-10-01&occurredTo=2026-10-31',
      { token: tenant.accessToken },
    );
    expect(pendingReport.body.totals).toMatchObject({
      paidCompletedOrderCount: 0,
      unpaidCompletedOrderCount: 1,
      receivableOrderCount: 2,
      collectedIncome: '0.00',
      outstandingIncome: '700.00',
      receivableAmount: '825.00',
      collectedGrossProfit: '0.00',
      collectedNetResult: '-120.00',
    });
    const pendingWorkbookResponse = await requestBinary(
      '/profitability/monthly-report.xlsx?year=2026&month=10',
      tenant.accessToken,
    );
    const pendingWorkbook = new Workbook();
    await pendingWorkbook.xlsx.load(Uint8Array.from(pendingWorkbookResponse.body).buffer);
    const pendingSheet = pendingWorkbook.getWorksheet('Órdenes Octubre 2026')!;
    const pendingOrderRow = Array.from({ length: pendingSheet.rowCount - 5 }, (_, index) =>
      pendingSheet.getRow(index + 6),
    ).find((row) => row.getCell(1).value === order.body.folio);
    expect(pendingOrderRow).toBeDefined();
    expect(pendingOrderRow!.getCell(11).value).toBe('Pendiente');
    expect(pendingOrderRow!.getCell(12).value).toBeNull();
    expect(
      (
        await request<unknown>(
          'GET',
          '/profitability?occurredFrom=2026-10-31&occurredTo=2026-10-01',
          { token: tenant.accessToken },
        )
      ).status,
    ).toBe(400);

    await request<unknown>('PATCH', `/subscriptions/companies/${tenant.company.id}`, {
      token: platformToken,
      body: { planCode: 'invoicing', status: 'active', reason: 'Validar plan Facturación' },
    });
    const invoicingAnalytics = await request<ProfitabilityAnalyticsResponse>(
      'GET',
      '/profitability/analytics?months=12&endingMonth=2026-10',
      { token: tenant.accessToken },
    );
    expect(invoicingAnalytics.status).toBe(200);
    expect(invoicingAnalytics.body.months).toBe(12);
    expect(invoicingAnalytics.body.series).toHaveLength(12);
    await request<unknown>('PATCH', `/subscriptions/companies/${tenant.company.id}`, {
      token: platformToken,
      body: {
        planCode: 'essential',
        status: 'active',
        reason: 'Validar utilidad conservada en el plan Esencial',
      },
    });
    expect(
      (
        await request<unknown>('GET', '/profitability', {
          token: tenant.accessToken,
        })
      ).status,
    ).toBe(200);
    expect(
      (
        await request<unknown>('GET', '/profitability/monthly-report?year=2026&month=10', {
          token: tenant.accessToken,
        })
      ).status,
    ).toBe(200);
  });

  it('resume la operación e incluye finanzas desde Esencial e inventario desde Control', async () => {
    const tenant = await provisionAndLogin('Dashboard Integration', 'dashboard.admin@test.local');
    const customer = await request<ClientResponse>('POST', '/clients', {
      token: tenant.accessToken,
      body: { type: 'person', displayName: 'Cliente del tablero' },
    });
    const brand = await request<VehicleBrandResponse>('POST', '/catalogs/vehicle-brands', {
      token: tenant.accessToken,
      body: { name: 'Marca Dashboard Integration' },
    });
    const model = await request<VehicleModelResponse>('POST', '/catalogs/vehicle-models', {
      token: tenant.accessToken,
      body: { brandId: brand.body.id, name: 'Modelo Dashboard Integration' },
    });
    const vehicle = await request<VehicleResponse>(
      'POST',
      `/clients/${customer.body.id}/vehicles`,
      {
        token: tenant.accessToken,
        body: { brandId: brand.body.id, modelId: model.body.id, year: 2026, color: 'Azul' },
      },
    );
    const createOrder = (description: string, unitPrice: number, unitCost: number) =>
      request<OrderResponse>('POST', '/orders', {
        token: tenant.accessToken,
        body: {
          customerId: customer.body.id,
          vehicleId: vehicle.body.id,
          items: [{ description, quantity: 1, unitPrice, unitCost }],
        },
      });

    const paidOrder = await createOrder('Servicio cobrado', 300, 100);
    await request<OrderResponse>('POST', `/orders/${paidOrder.body.id}/status`, {
      token: tenant.accessToken,
      body: { status: 'completed' },
    });
    await request<OrderResponse>('PATCH', `/orders/${paidOrder.body.id}/payment-status`, {
      token: tenant.accessToken,
      body: { isPaid: true },
    });
    const unpaidOrder = await createOrder('Servicio pendiente', 200, 50);
    await request<OrderResponse>('POST', `/orders/${unpaidOrder.body.id}/status`, {
      token: tenant.accessToken,
      body: { status: 'completed' },
    });
    const inProgressOrder = await createOrder('Servicio en proceso', 100, 20);

    const essential = await request<DashboardSummaryResponse>('GET', '/dashboard/summary', {
      token: tenant.accessToken,
    });
    expect(essential.status).toBe(200);
    expect(essential.body.period.month).toMatch(/^\d{4}-\d{2}$/);
    expect(essential.body.access).toEqual({
      planCode: 'essential',
      planName: 'Esencial',
      includesFinancials: true,
      includesLowStock: false,
    });
    expect(essential.body.orders).toEqual({
      inProgressCount: 1,
      unpaidCount: 2,
      completedUnpaidCount: 1,
      completedPaidCount: 1,
    });
    expect(essential.body.revenue).toEqual({
      generated: '500.00',
      collected: '300.00',
      outstanding: '200.00',
      receivable: '300.00',
    });
    expect(essential.body.financials).toEqual({
      directCost: '150.00',
      grossProfit: '350.00',
      operatingExpenses: '0.00',
      operatingProfit: '350.00',
      incompleteOrderCount: 0,
      missingPriceOrderCount: 0,
      missingCostOrderCount: 0,
      isComplete: true,
    });
    expect(essential.body.lowStock).toBeNull();
    const essentialActivity = await request<DashboardActivityResponse>(
      'GET',
      '/dashboard/activity',
      {
        token: tenant.accessToken,
      },
    );
    expect(essentialActivity.status).toBe(200);
    expect(essentialActivity.body.recentOrders).toHaveLength(3);
    expect(essentialActivity.body.oldestInProgress).toEqual([
      expect.objectContaining({ id: inProgressOrder.body.id, daysOpen: 0 }),
    ]);
    expect(essentialActivity.body.pendingCollection).toHaveLength(2);
    expect(essentialActivity.body.pendingCollection).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: unpaidOrder.body.id,
          status: 'completed',
          total: '200.00',
        }),
        expect.objectContaining({
          id: inProgressOrder.body.id,
          status: 'in_progress',
          total: '100.00',
          completedAt: null,
        }),
      ]),
    );
    expect(essentialActivity.body.recentPurchases).toBeNull();
    expect(essentialActivity.body.recentExpenses).toEqual([]);
    expect(essentialActivity.body.recentInventoryMovements).toBeNull();
    expect(essentialActivity.body.lowStock).toBeNull();

    await request<unknown>('PATCH', `/subscriptions/companies/${tenant.company.id}`, {
      token: platformToken,
      body: { planCode: 'control', status: 'active', reason: 'Tablero de integración' },
    });
    const units = await request<MeasurementUnitResponse[]>('GET', '/catalogs/units', {
      token: tenant.accessToken,
    });
    const lowStockProduct = await request<ConceptResponse>('POST', '/catalogs/concepts', {
      token: tenant.accessToken,
      body: {
        kind: 'product',
        sku: 'TAB-LOW-001',
        name: 'Producto bajo para tablero',
        unitId: units.body.find(({ name }) => name === 'Pieza')!.id,
        cost: 80,
        price: 120,
        tracksInventory: true,
        minimumStock: 5,
      },
    });
    const categories = await request<ExpenseCategoryResponse[]>('GET', '/expenses/categories', {
      token: tenant.accessToken,
    });
    const expense = await request<ExpenseResponse>('POST', '/expenses', {
      token: tenant.accessToken,
      body: {
        categoryId: categories.body.find(({ code }) => code === 'utilities')!.id,
        occurredOn: essential.body.period.startsOn,
        description: 'Gasto para resumen del tablero',
        amount: 120,
      },
    });
    expect(expense.body.status).toBe('confirmed');

    const controlSummary = await request<DashboardSummaryResponse>('GET', '/dashboard/summary', {
      token: tenant.accessToken,
    });
    expect(controlSummary.status).toBe(200);
    expect(controlSummary.body.access).toMatchObject({
      planCode: 'control',
      includesFinancials: true,
      includesLowStock: true,
    });
    expect(controlSummary.body.financials).toEqual({
      directCost: '150.00',
      grossProfit: '350.00',
      operatingExpenses: '120.00',
      operatingProfit: '230.00',
      incompleteOrderCount: 0,
      missingPriceOrderCount: 0,
      missingCostOrderCount: 0,
      isComplete: true,
    });
    expect(controlSummary.body.lowStock).toMatchObject({
      totalProducts: 1,
      products: [
        {
          id: lowStockProduct.body.id,
          sku: 'TAB-LOW-001',
          name: 'Producto bajo para tablero',
          unitSymbol: 'pza',
          stock: '0.000',
          minimumStock: '5.000',
        },
      ],
    });
    const movement = await request<InventoryMovementResponse>('POST', '/inventory/movements', {
      token: tenant.accessToken,
      body: {
        productId: lowStockProduct.body.id,
        type: 'entry',
        quantity: 2,
        unitCost: 80,
        reason: 'Entrada para actividad del tablero',
      },
    });
    const purchase = await request<PurchaseResponse>('POST', '/purchases', {
      token: tenant.accessToken,
      body: {
        reference: 'TAB-ACT-001',
        items: [{ productId: lowStockProduct.body.id, quantity: 1, unitCost: 85 }],
      },
    });
    const controlActivity = await request<DashboardActivityResponse>('GET', '/dashboard/activity', {
      token: tenant.accessToken,
    });
    expect(controlActivity.status).toBe(200);
    expect(controlActivity.body.recentPurchases?.[0]).toMatchObject({
      id: purchase.body.id,
      status: 'draft',
      total: '85.00',
    });
    expect(controlActivity.body.recentExpenses?.[0]).toMatchObject({
      id: expense.body.id,
      description: 'Gasto para resumen del tablero',
      status: 'confirmed',
      amount: '120.00',
    });
    expect(controlActivity.body.recentInventoryMovements?.[0]).toMatchObject({
      id: movement.body.id,
      productId: lowStockProduct.body.id,
      type: 'entry',
      quantity: '2.000',
      resultingStock: '2.000',
    });
    expect(controlActivity.body.lowStock).toMatchObject({
      totalProducts: 1,
      products: [
        expect.objectContaining({
          id: lowStockProduct.body.id,
          stock: '2.000',
          minimumStock: '5.000',
        }),
      ],
    });

    const previousMonthOrder = await createOrder('Servicio del mes anterior', 1000, 200);
    await request<OrderResponse>('POST', `/orders/${previousMonthOrder.body.id}/status`, {
      token: tenant.accessToken,
      body: { status: 'completed' },
    });
    await control.query(
      `UPDATE ${quoteIdentifier(tenant.company.schemaName)}.orders
       SET closed_at = date_trunc('month', current_date) - interval '1 day'
       WHERE id = $1`,
      [previousMonthOrder.body.id],
    );
    const periodSummary = await request<DashboardSummaryResponse>('GET', '/dashboard/summary', {
      token: tenant.accessToken,
    });
    expect(periodSummary.body.orders).toEqual({
      inProgressCount: 1,
      unpaidCount: 3,
      completedUnpaidCount: 2,
      completedPaidCount: 1,
    });
    expect(periodSummary.body.revenue).toEqual({
      generated: '500.00',
      collected: '300.00',
      outstanding: '200.00',
      receivable: '1300.00',
    });
    expect(periodSummary.body.financials).toMatchObject({
      directCost: '150.00',
      grossProfit: '350.00',
      operatingExpenses: '120.00',
      operatingProfit: '230.00',
    });

    await request<unknown>('PATCH', `/subscriptions/companies/${tenant.company.id}`, {
      token: platformToken,
      body: { planCode: 'invoicing', status: 'active', reason: 'Tablero de facturación' },
    });
    const invoicingSummary = await request<DashboardSummaryResponse>('GET', '/dashboard/summary', {
      token: tenant.accessToken,
    });
    expect(invoicingSummary.body.access).toMatchObject({
      planCode: 'invoicing',
      planName: 'Facturación',
      includesFinancials: true,
      includesLowStock: true,
    });
    const invoicingActivity = await request<DashboardActivityResponse>(
      'GET',
      '/dashboard/activity',
      { token: tenant.accessToken },
    );
    expect(invoicingActivity.body.recentPurchases).not.toBeNull();
    expect(invoicingActivity.body.recentExpenses).not.toBeNull();
    expect(invoicingActivity.body.recentInventoryMovements).not.toBeNull();

    const isolated = await provisionAndLogin(
      'Dashboard Isolated Integration',
      'dashboard.isolated@test.local',
    );
    await request<unknown>('PATCH', `/subscriptions/companies/${isolated.company.id}`, {
      token: platformToken,
      body: { planCode: 'control', status: 'active', reason: 'Aislamiento del tablero' },
    });
    const isolatedSummary = await request<DashboardSummaryResponse>('GET', '/dashboard/summary', {
      token: isolated.accessToken,
    });
    expect(isolatedSummary.body.orders).toEqual({
      inProgressCount: 0,
      unpaidCount: 0,
      completedUnpaidCount: 0,
      completedPaidCount: 0,
    });
    expect(isolatedSummary.body.revenue).toEqual({
      generated: '0.00',
      collected: '0.00',
      outstanding: '0.00',
      receivable: '0.00',
    });
    expect(isolatedSummary.body.financials).toMatchObject({
      directCost: '0.00',
      grossProfit: '0.00',
      operatingExpenses: '0.00',
      operatingProfit: '0.00',
    });
    expect(isolatedSummary.body.lowStock).toEqual({ totalProducts: 0, products: [] });
    const isolatedActivity = await request<DashboardActivityResponse>(
      'GET',
      '/dashboard/activity',
      { token: isolated.accessToken },
    );
    expect(isolatedActivity.body.recentOrders).toEqual([]);
    expect(isolatedActivity.body.oldestInProgress).toEqual([]);
    expect(isolatedActivity.body.pendingCollection).toEqual([]);
    expect(isolatedActivity.body.recentPurchases).toEqual([]);
    expect(isolatedActivity.body.recentExpenses).toEqual([]);
    expect(isolatedActivity.body.recentInventoryMovements).toEqual([]);
  });

  it('administra compras con folio, totales, proveedor general y entradas de inventario', async () => {
    const tenant = await provisionAndLogin('Purchase Integration', 'purchase.admin@test.local');
    await request<unknown>('PATCH', `/subscriptions/companies/${tenant.company.id}`, {
      token: platformToken,
      body: { planCode: 'control', status: 'active', reason: 'Compras de integración' },
    });
    const units = await request<MeasurementUnitResponse[]>('GET', '/catalogs/units', {
      token: tenant.accessToken,
    });
    const piece = units.body.find(({ name }) => name === 'Pieza')!;
    const product = await request<ConceptResponse>('POST', '/catalogs/concepts', {
      token: tenant.accessToken,
      body: {
        kind: 'product',
        sku: 'COM-001',
        name: 'Filtro para compra',
        unitId: piece.id,
        cost: 0,
        price: 180,
        tracksInventory: true,
      },
    });
    await request<InventoryMovementResponse>('POST', '/inventory/movements', {
      token: tenant.accessToken,
      body: {
        productId: product.body.id,
        type: 'entry',
        quantity: 2,
        unitCost: 80,
        reason: 'Existencia anterior a la compra',
      },
    });

    const created = await request<PurchaseResponse>('POST', '/purchases', {
      token: tenant.accessToken,
      body: {
        reference: 'FAC-1001',
        notes: 'Entrega completa',
        items: [{ productId: product.body.id, quantity: 3, unitCost: 105.5 }],
      },
    });
    expect(created.status).toBe(201);
    expect(created.body).toMatchObject({
      folio: '1',
      status: 'draft',
      supplier: { commercialName: 'Proveedor general', isDefault: true },
      reference: 'FAC-1001',
      notes: 'Entrega completa',
      total: '316.50',
      itemCount: 1,
      statusHistory: [
        {
          previousStatus: null,
          newStatus: 'draft',
          changedByUserId: tenant.user.id,
        },
      ],
      items: [
        {
          productId: product.body.id,
          productName: 'Filtro para compra',
          quantity: '3.000',
          unitCost: '105.50',
          amount: '316.50',
        },
      ],
    });
    expect(
      (
        await request<InventoryProductResponse>('GET', `/inventory/products/${product.body.id}`, {
          token: tenant.accessToken,
        })
      ).body,
    ).toMatchObject({ stock: '2.000', lastCost: '80.00', averageCost: '80.00' });

    const edited = await request<PurchaseResponse>('PATCH', `/purchases/${created.body.id}`, {
      token: tenant.accessToken,
      body: {
        notes: null,
        items: [{ productId: product.body.id, quantity: 4, unitCost: 95 }],
      },
    });
    expect(edited.body).toMatchObject({ total: '380.00', notes: null });

    const confirmed = await request<PurchaseResponse>(
      'POST',
      `/purchases/${created.body.id}/status`,
      { token: tenant.accessToken, body: { status: 'confirmed' } },
    );
    expect(confirmed.status).toBe(200);
    expect(confirmed.body.status).toBe('confirmed');
    expect(confirmed.body.confirmedAt).not.toBeNull();
    expect(confirmed.body.statusHistory.map(({ newStatus }) => newStatus)).toEqual([
      'draft',
      'confirmed',
    ]);
    expect(typeof confirmed.body.items[0]?.inventoryMovementId).toBe('string');
    expect(typeof confirmed.body.items[0]?.inventoryLotId).toBe('string');
    const stock = await request<InventoryProductResponse>(
      'GET',
      `/inventory/products/${product.body.id}`,
      { token: tenant.accessToken },
    );
    expect(stock.body).toMatchObject({
      stock: '6.000',
      lastCost: '95.00',
      averageCost: '90.00',
    });
    const lots = await request<InventoryLotResponse[]>(
      'GET',
      `/inventory/products/${product.body.id}/lots`,
      { token: tenant.accessToken },
    );
    expect(lots.body).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          receivedQuantity: '4.000',
          remainingQuantity: '4.000',
          unitCost: '95.00',
          sourceType: 'purchase',
          sourceReference: 'Compra #1',
        }),
      ]),
    );
    const duplicateConfirmation = await request<unknown>(
      'POST',
      `/purchases/${created.body.id}/status`,
      { token: tenant.accessToken, body: { status: 'confirmed' } },
    );
    expect(duplicateConfirmation.status).toBe(400);
    expect(
      (
        await request<InventoryProductResponse>('GET', `/inventory/products/${product.body.id}`, {
          token: tenant.accessToken,
        })
      ).body.stock,
    ).toBe('6.000');
    expect(
      (
        await request<unknown>('PATCH', `/purchases/${created.body.id}`, {
          token: tenant.accessToken,
          body: { reference: 'NO-EDITABLE' },
        })
      ).status,
    ).toBe(400);

    const cancelled = await request<PurchaseResponse>(
      'POST',
      `/purchases/${created.body.id}/status`,
      { token: tenant.accessToken, body: { status: 'cancelled' } },
    );
    expect(cancelled.body.status).toBe('cancelled');
    expect(cancelled.body.cancelledAt).not.toBeNull();
    expect(cancelled.body.statusHistory.map(({ newStatus }) => newStatus)).toEqual([
      'draft',
      'confirmed',
      'cancelled',
    ]);
    const emptyStock = await request<InventoryProductResponse>(
      'GET',
      `/inventory/products/${product.body.id}`,
      { token: tenant.accessToken },
    );
    expect(emptyStock.body).toMatchObject({
      stock: '2.000',
      lastCost: '80.00',
      averageCost: '80.00',
    });
    const duplicateCancellation = await request<unknown>(
      'POST',
      `/purchases/${created.body.id}/status`,
      { token: tenant.accessToken, body: { status: 'cancelled' } },
    );
    expect(duplicateCancellation.status).toBe(400);

    const second = await request<PurchaseResponse>('POST', '/purchases', {
      token: tenant.accessToken,
      body: { items: [{ productId: product.body.id, quantity: 1, unitCost: 100 }] },
    });
    expect(second.body.folio).toBe('2');
    const draftCancelled = await request<PurchaseResponse>(
      'POST',
      `/purchases/${second.body.id}/status`,
      { token: tenant.accessToken, body: { status: 'cancelled' } },
    );
    expect(draftCancelled.body.status).toBe('cancelled');
    expect(draftCancelled.body.statusHistory.map(({ newStatus }) => newStatus)).toEqual([
      'draft',
      'cancelled',
    ]);
    expect(
      (
        await request<unknown>('POST', `/purchases/${second.body.id}/status`, {
          token: tenant.accessToken,
          body: { status: 'cancelled' },
        })
      ).status,
    ).toBe(400);

    const consumedPurchase = await request<PurchaseResponse>('POST', '/purchases', {
      token: tenant.accessToken,
      body: { items: [{ productId: product.body.id, quantity: 3, unitCost: 110 }] },
    });
    await request<PurchaseResponse>('POST', `/purchases/${consumedPurchase.body.id}/status`, {
      token: tenant.accessToken,
      body: { status: 'confirmed' },
    });
    const fifoExit = await request<InventoryMovementResponse>('POST', '/inventory/movements', {
      token: tenant.accessToken,
      body: {
        productId: product.body.id,
        type: 'exit',
        quantity: 3,
        reason: 'Consumo que alcanza el lote de compra',
      },
    });
    expect(fifoExit.body).toMatchObject({
      quantity: '-3.000',
      previousStock: '5.000',
      resultingStock: '2.000',
      unitCost: '90.00',
    });
    const fifoLots = await request<InventoryLotResponse[]>(
      'GET',
      `/inventory/products/${product.body.id}/lots`,
      { token: tenant.accessToken },
    );
    expect(fifoLots.body).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          unitCost: '80.00',
          remainingQuantity: '0.000',
        }),
        expect.objectContaining({
          unitCost: '110.00',
          receivedQuantity: '3.000',
          remainingQuantity: '2.000',
          sourceType: 'purchase',
        }),
      ]),
    );
    const consumedCancellation = await request<unknown>(
      'POST',
      `/purchases/${consumedPurchase.body.id}/status`,
      { token: tenant.accessToken, body: { status: 'cancelled' } },
    );
    expect(consumedCancellation.status).toBe(422);
    const consumedStillConfirmed = await request<PurchaseResponse>(
      'GET',
      `/purchases/${consumedPurchase.body.id}`,
      { token: tenant.accessToken },
    );
    expect(consumedStillConfirmed.body.status).toBe('confirmed');
    expect(consumedStillConfirmed.body.statusHistory.map(({ newStatus }) => newStatus)).toEqual([
      'draft',
      'confirmed',
    ]);
    expect(
      (
        await request<InventoryProductResponse>('GET', `/inventory/products/${product.body.id}`, {
          token: tenant.accessToken,
        })
      ).body,
    ).toMatchObject({ stock: '2.000', lastCost: '110.00', averageCost: '110.00' });

    const higherCostPurchase = await request<PurchaseResponse>('POST', '/purchases', {
      token: tenant.accessToken,
      body: { items: [{ productId: product.body.id, quantity: 1, unitCost: 125 }] },
    });
    await request<PurchaseResponse>('POST', `/purchases/${higherCostPurchase.body.id}/status`, {
      token: tenant.accessToken,
      body: { status: 'confirmed' },
    });
    const indicators = await request<{
      confirmedLast30Days: number;
      confirmedAmountLast30Days: string;
      draftCount: number;
      recentPurchases: PurchaseResponse[];
      importantVariations: Array<{
        productId: string;
        currentCost: string;
        previousCost: string;
        changePercent: string;
        direction: string;
      }>;
    }>('GET', '/purchases/indicators', { token: tenant.accessToken });
    expect(indicators.status).toBe(200);
    expect(indicators.body.confirmedLast30Days).toBe(2);
    expect(indicators.body.draftCount).toBe(0);
    expect(indicators.body.recentPurchases[0]?.id).toBe(higherCostPurchase.body.id);
    expect(indicators.body.importantVariations).toContainEqual(
      expect.objectContaining({
        productId: product.body.id,
        currentCost: '125.00',
        previousCost: '110.00',
        changePercent: '13.64',
        direction: 'increase',
      }),
    );

    const listed = await request<{ totalItems: number; items: PurchaseResponse[] }>(
      'GET',
      '/purchases?search=FAC-1001&status=cancelled',
      { token: tenant.accessToken },
    );
    expect(listed.status).toBe(200);
    expect(listed.body.totalItems).toBe(1);
    expect(listed.body.items[0]?.id).toBe(created.body.id);
  });

  it('administra existencias, entradas, salidas, ajustes e historial de inventario', async () => {
    const tenant = await provisionAndLogin('Inventory Integration', 'inventory.admin@test.local');
    await request<unknown>('PATCH', `/subscriptions/companies/${tenant.company.id}`, {
      token: platformToken,
      body: { planCode: 'control', status: 'active', reason: 'Inventario de integración' },
    });
    const units = await request<MeasurementUnitResponse[]>('GET', '/catalogs/units', {
      token: tenant.accessToken,
    });
    const piece = units.body.find(({ name }) => name === 'Pieza')!;
    const liter = units.body.find(({ name }) => name === 'Litro')!;
    const serviceUnit = units.body.find(({ name }) => name === 'Servicio')!;

    const product = await request<ConceptResponse>('POST', '/catalogs/concepts', {
      token: tenant.accessToken,
      body: {
        kind: 'product',
        sku: 'INV-001',
        name: 'Filtro de aceite',
        unitId: piece.id,
        cost: 80,
        price: 140,
        tracksInventory: true,
        minimumStock: 6,
      },
    });
    expect(product.status).toBe(201);
    expect(product.body).toMatchObject({
      stock: '0.000',
      minimumStock: '6.000',
      isLowStock: true,
    });
    const service = await request<ConceptResponse>('POST', '/catalogs/concepts', {
      token: tenant.accessToken,
      body: {
        kind: 'service',
        sku: 'SERV-001',
        name: 'Diagnóstico',
        unitId: serviceUnit.id,
        cost: 0,
        price: 350,
        tracksInventory: false,
      },
    });

    const serviceMovement = await request<unknown>('POST', '/inventory/movements', {
      token: tenant.accessToken,
      body: {
        productId: service.body.id,
        type: 'entry',
        quantity: 1,
        reason: 'No debe permitirse',
      },
    });
    expect(serviceMovement.status).toBe(400);

    const entryWithoutCost = await request<unknown>('POST', '/inventory/movements', {
      token: tenant.accessToken,
      body: {
        productId: product.body.id,
        type: 'entry',
        quantity: 1,
        reason: 'Entrada sin costo',
      },
    });
    expect(entryWithoutCost.status).toBe(400);

    const entry = await request<InventoryMovementResponse>('POST', '/inventory/movements', {
      token: tenant.accessToken,
      body: {
        productId: product.body.id,
        type: 'entry',
        quantity: 10,
        unitCost: 82.5,
        reason: 'Compra inicial',
      },
    });
    expect(entry.status).toBe(201);
    expect(entry.body).toMatchObject({
      type: 'entry',
      quantity: '10.000',
      previousStock: '0.000',
      resultingStock: '10.000',
      unitCost: '82.50',
      reason: 'Compra inicial',
      createdByUserId: tenant.user.id,
    });

    const exit = await request<InventoryMovementResponse>('POST', '/inventory/movements', {
      token: tenant.accessToken,
      body: {
        productId: product.body.id,
        type: 'exit',
        quantity: 3,
        reason: 'Uso en orden de prueba',
      },
    });
    expect(exit.body).toMatchObject({
      type: 'exit',
      quantity: '-3.000',
      previousStock: '10.000',
      resultingStock: '7.000',
    });
    expect(
      (
        await request<unknown>('POST', '/inventory/movements', {
          token: tenant.accessToken,
          body: {
            productId: product.body.id,
            type: 'exit',
            quantity: 8,
            reason: 'Salida superior a existencia',
          },
        })
      ).status,
    ).toBe(422);
    expect(
      (
        await request<unknown>('POST', '/inventory/movements', {
          token: tenant.accessToken,
          body: {
            productId: product.body.id,
            type: 'entry',
            quantity: 0.5,
            reason: 'La pieza no acepta decimales',
          },
        })
      ).status,
    ).toBe(400);

    const adjustment = await request<InventoryMovementResponse>('POST', '/inventory/movements', {
      token: tenant.accessToken,
      body: {
        productId: product.body.id,
        type: 'adjustment',
        quantity: -2,
        reason: 'Diferencia detectada en conteo',
      },
    });
    expect(adjustment.body).toMatchObject({
      type: 'adjustment',
      quantity: '-2.000',
      previousStock: '7.000',
      resultingStock: '5.000',
    });

    const stock = await request<InventoryProductResponse>(
      'GET',
      `/inventory/products/${product.body.id}`,
      { token: tenant.accessToken },
    );
    expect(stock.body).toMatchObject({
      stock: '5.000',
      minimumStock: '6.000',
      lastCost: '82.50',
      averageCost: '82.50',
      isLowStock: true,
    });
    const lowStock = await request<{ totalItems: number; items: InventoryProductResponse[] }>(
      'GET',
      '/inventory/products?lowStock=true',
      { token: tenant.accessToken },
    );
    expect(lowStock.body.items.map(({ id }) => id)).toContain(product.body.id);

    const history = await request<{
      totalItems: number;
      items: InventoryMovementResponse[];
    }>('GET', `/inventory/movements?productId=${product.body.id}`, {
      token: tenant.accessToken,
    });
    expect(history.status).toBe(200);
    expect(history.body.totalItems).toBe(3);
    expect(history.body.items.map(({ type }) => type)).toEqual(['adjustment', 'exit', 'entry']);

    const secondEntry = await request<InventoryMovementResponse>('POST', '/inventory/movements', {
      token: tenant.accessToken,
      body: {
        productId: product.body.id,
        type: 'entry',
        quantity: 5,
        unitCost: 95,
        reason: 'Segunda compra',
      },
    });
    expect(secondEntry.status).toBe(201);
    const valuedStock = await request<InventoryProductResponse>(
      'GET',
      `/inventory/products/${product.body.id}`,
      { token: tenant.accessToken },
    );
    expect(valuedStock.body).toMatchObject({
      stock: '10.000',
      lastCost: '95.00',
      averageCost: '88.75',
    });
    const lots = await request<InventoryLotResponse[]>(
      'GET',
      `/inventory/products/${product.body.id}/lots`,
      { token: tenant.accessToken },
    );
    expect(lots.status).toBe(200);
    expect(lots.body).toHaveLength(2);
    expect(lots.body).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          receivedQuantity: '10.000',
          remainingQuantity: '5.000',
          unitCost: '82.50',
          sourceType: 'manual_entry',
          sourceReference: 'Compra inicial',
        }),
        expect.objectContaining({
          receivedQuantity: '5.000',
          remainingQuantity: '5.000',
          unitCost: '95.00',
          sourceType: 'manual_entry',
          sourceReference: 'Segunda compra',
        }),
      ]),
    );

    const positiveAdjustmentWithoutCost = await request<unknown>('POST', '/inventory/movements', {
      token: tenant.accessToken,
      body: {
        productId: product.body.id,
        type: 'adjustment',
        quantity: 2,
        reason: 'Sobrante sin costo',
      },
    });
    expect(positiveAdjustmentWithoutCost.status).toBe(400);

    const positiveAdjustment = await request<InventoryMovementResponse>(
      'POST',
      '/inventory/movements',
      {
        token: tenant.accessToken,
        body: {
          productId: product.body.id,
          type: 'adjustment',
          quantity: 2,
          unitCost: 90,
          reason: 'Sobrante confirmado',
        },
      },
    );
    expect(positiveAdjustment.body).toMatchObject({
      type: 'adjustment',
      quantity: '2.000',
      previousStock: '10.000',
      resultingStock: '12.000',
      unitCost: '90.00',
    });

    const negativeAdjustmentWithCost = await request<unknown>('POST', '/inventory/movements', {
      token: tenant.accessToken,
      body: {
        productId: product.body.id,
        type: 'adjustment',
        quantity: -1,
        unitCost: 90,
        reason: 'Faltante con costo improcedente',
      },
    });
    expect(negativeAdjustmentWithCost.status).toBe(400);

    const negativeAdjustment = await request<InventoryMovementResponse>(
      'POST',
      '/inventory/movements',
      {
        token: tenant.accessToken,
        body: {
          productId: product.body.id,
          type: 'adjustment',
          quantity: -6,
          reason: 'Conteo físico final',
        },
      },
    );
    expect(negativeAdjustment.body).toMatchObject({
      quantity: '-6.000',
      previousStock: '12.000',
      resultingStock: '6.000',
      unitCost: '84.58',
    });
    const adjustedLots = await request<InventoryLotResponse[]>(
      'GET',
      `/inventory/products/${product.body.id}/lots`,
      { token: tenant.accessToken },
    );
    expect(adjustedLots.body).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          receivedQuantity: '10.000',
          remainingQuantity: '0.000',
          unitCost: '82.50',
        }),
        expect.objectContaining({
          receivedQuantity: '5.000',
          remainingQuantity: '4.000',
          unitCost: '95.00',
        }),
        expect.objectContaining({
          receivedQuantity: '2.000',
          remainingQuantity: '2.000',
          unitCost: '90.00',
          sourceType: 'adjustment',
        }),
      ]),
    );

    const liquid = await request<ConceptResponse>('POST', '/catalogs/concepts', {
      token: tenant.accessToken,
      body: {
        kind: 'product',
        sku: 'INV-LIQ-001',
        name: 'Aceite a granel',
        unitId: liter.id,
        cost: 100,
        price: 160,
        tracksInventory: true,
      },
    });
    const decimalEntry = await request<InventoryMovementResponse>('POST', '/inventory/movements', {
      token: tenant.accessToken,
      body: {
        productId: liquid.body.id,
        type: 'entry',
        quantity: 2.5,
        unitCost: 100,
        reason: 'Compra a granel',
      },
    });
    expect(decimalEntry.status).toBe(201);
    expect(decimalEntry.body.resultingStock).toBe('2.500');
    const decimalAdjustment = await request<InventoryMovementResponse>(
      'POST',
      '/inventory/movements',
      {
        token: tenant.accessToken,
        body: {
          productId: liquid.body.id,
          type: 'adjustment',
          quantity: -0.75,
          reason: 'Diferencia de medición',
        },
      },
    );
    expect(decimalAdjustment.status).toBe(201);
    expect(decimalAdjustment.body.resultingStock).toBe('1.750');
  });

  it('administra un catálogo global de marcas y modelos sin duplicados', async () => {
    const alpha = await provisionAndLogin('Catalog Alpha', 'catalog.alpha@test.local');
    const brand = await request<VehicleBrandResponse>('POST', '/catalogs/vehicle-brands', {
      token: alpha.accessToken,
      body: { name: 'Toyota' },
    });
    expect(brand.status).toBe(201);
    expect(brand.body).toMatchObject({ name: 'Toyota', isActive: true });
    expect(brand.body.createdByUserId).toBe(alpha.user.id);

    const duplicateBrand = await request<unknown>('POST', '/catalogs/vehicle-brands', {
      token: alpha.accessToken,
      body: { name: '  toyota  ' },
    });
    expect(duplicateBrand.status).toBe(409);

    const model = await request<VehicleModelResponse>('POST', '/catalogs/vehicle-models', {
      token: alpha.accessToken,
      body: { brandId: brand.body.id, name: 'Corolla' },
    });
    expect(model.status).toBe(201);
    expect(model.body).toMatchObject({
      name: 'Corolla',
      brandId: brand.body.id,
      brandName: 'Toyota',
    });
    expect(
      (
        await request<unknown>('POST', '/catalogs/vehicle-models', {
          token: alpha.accessToken,
          body: { brandId: brand.body.id, name: 'corolla' },
        })
      ).status,
    ).toBe(409);

    const beta = await provisionAndLogin('Catalog Beta', 'catalog.beta@test.local');
    const sharedBrands = await request<PaginatedCatalog<VehicleBrandResponse>>(
      'GET',
      '/catalogs/vehicle-brands?search=toy&isActive=true',
      { token: beta.accessToken },
    );
    expect(sharedBrands.status).toBe(200);
    expect(sharedBrands.body.items.map(({ id }) => id)).toContain(brand.body.id);
    const sharedModels = await request<PaginatedCatalog<VehicleModelResponse>>(
      'GET',
      `/catalogs/vehicle-models?brandId=${brand.body.id}&isActive=true`,
      { token: beta.accessToken },
    );
    expect(sharedModels.status).toBe(200);
    expect(sharedModels.body.items.map(({ id }) => id)).toContain(model.body.id);

    const ordinary = await request<UserResponse>('POST', '/users', {
      token: beta.accessToken,
      body: {
        fullName: 'Consulta Catálogos',
        username: 'catalogos',
        phone: '+526671110099',
        password: USER_PASSWORD,
        timezoneCode: 'America/Mazatlan',
        role: 'user',
      },
    });
    expect(ordinary.status).toBe(201);
    const ordinaryLogin = await login(`catalogos@${beta.company.loginCode}`, USER_PASSWORD);
    expect(ordinaryLogin.status).toBe(200);
    const passwordChanged = await request<unknown>('PATCH', '/users/me/password', {
      token: ordinaryLogin.body.accessToken,
      body: { currentPassword: USER_PASSWORD, newPassword: PERMANENT_PASSWORD },
    });
    expect(passwordChanged.status).toBe(204);
    const ordinarySession = await login(`catalogos@${beta.company.loginCode}`, PERMANENT_PASSWORD);
    expect(
      (
        await request<unknown>('GET', '/catalogs/vehicle-brands', {
          token: ordinarySession.body.accessToken,
        })
      ).status,
    ).toBe(200);
    expect(
      (
        await request<unknown>('POST', '/catalogs/vehicle-brands', {
          token: ordinarySession.body.accessToken,
          body: { name: 'Sin permiso' },
        })
      ).status,
    ).toBe(403);
    expect(
      (
        await request<unknown>('POST', '/catalogs/vehicle-models', {
          token: ordinarySession.body.accessToken,
          body: { brandId: brand.body.id, name: 'Modelo sin permiso' },
        })
      ).status,
    ).toBe(403);

    const grantedCatalogManagement = await request<UserPermissionProfileResponse>(
      'PUT',
      `/permissions/users/${ordinary.body.id}`,
      {
        token: beta.accessToken,
        body: {
          templateCode: null,
          permissionCodes: ['vehicle_catalog.view', 'vehicle_catalog.manage'],
        },
      },
    );
    expect(grantedCatalogManagement.status).toBe(200);
    expect(grantedCatalogManagement.body.permissionCodes).toEqual([
      'vehicle_catalog.view',
      'vehicle_catalog.manage',
    ]);
    expect(
      (
        await request<unknown>('GET', '/auth/me', {
          token: ordinarySession.body.accessToken,
        })
      ).status,
    ).toBe(401);
    const ordinarySessionWithManagement = await login(
      `catalogos@${beta.company.loginCode}`,
      PERMANENT_PASSWORD,
    );
    expect(ordinarySessionWithManagement.status).toBe(200);

    const delegatedBrand = await request<VehicleBrandResponse>('POST', '/catalogs/vehicle-brands', {
      token: ordinarySessionWithManagement.body.accessToken,
      body: { name: 'Marca creada con permiso configurable' },
    });
    expect(delegatedBrand.status).toBe(201);
    expect(delegatedBrand.body.createdByUserId).toBe(ordinary.body.id);

    const delegatedModel = await request<VehicleModelResponse>('POST', '/catalogs/vehicle-models', {
      token: ordinarySessionWithManagement.body.accessToken,
      body: {
        brandId: delegatedBrand.body.id,
        name: 'Modelo creado con permiso configurable',
      },
    });
    expect(delegatedModel.status).toBe(201);
    expect(delegatedModel.body).toMatchObject({
      brandId: delegatedBrand.body.id,
      createdByUserId: ordinary.body.id,
    });

    const disabledModel = await request<VehicleModelResponse>(
      'DELETE',
      `/catalogs/vehicle-models/${model.body.id}`,
      { token: alpha.accessToken },
    );
    expect(disabledModel.status).toBe(200);
    expect(disabledModel.body.isActive).toBe(false);
    const activeModels = await request<PaginatedCatalog<VehicleModelResponse>>(
      'GET',
      `/catalogs/vehicle-models?brandId=${brand.body.id}&isActive=true`,
      { token: alpha.accessToken },
    );
    expect(activeModels.body.totalItems).toBe(0);
  });

  it('registra vehículos con los últimos 10 caracteres del VIN y campos obligatorios', async () => {
    const tenant = await provisionAndLogin('Vehicles Integration', 'vehicles.admin@test.local');
    const client = await request<ClientResponse>('POST', '/clients', {
      token: tenant.accessToken,
      body: { type: 'company', displayName: 'Flotilla con vehículo' },
    });
    expect(client.status).toBe(201);

    const brand = await request<VehicleBrandResponse>('POST', '/catalogs/vehicle-brands', {
      token: tenant.accessToken,
      body: { name: 'Mazda Integration' },
    });
    const model = await request<VehicleModelResponse>('POST', '/catalogs/vehicle-models', {
      token: tenant.accessToken,
      body: { brandId: brand.body.id, name: 'Mazda 3 Integration' },
    });

    const incomplete = await request<unknown>('POST', `/clients/${client.body.id}/vehicles`, {
      token: tenant.accessToken,
      body: { brandId: brand.body.id, modelId: model.body.id, year: 2025 },
    });
    expect(incomplete.status).toBe(400);

    const fullVin = await request<unknown>('POST', `/clients/${client.body.id}/vehicles`, {
      token: tenant.accessToken,
      body: {
        brandId: brand.body.id,
        modelId: model.body.id,
        year: 2025,
        color: 'Rojo',
        numeroSerie: '1HGBH41JXMN109186',
      },
    });
    expect(fullVin.status).toBe(400);

    const vehicle = await request<VehicleResponse>('POST', `/clients/${client.body.id}/vehicles`, {
      token: tenant.accessToken,
      body: {
        brandId: brand.body.id,
        modelId: model.body.id,
        year: 2025,
        color: 'Rojo',
        numeroSerie: 'jxmn109186',
      },
    });
    expect(vehicle.status).toBe(201);
    expect(vehicle.body).toMatchObject({
      customerId: client.body.id,
      brandName: 'Mazda Integration',
      modelName: 'Mazda 3 Integration',
      year: 2025,
      color: 'Rojo',
      numeroSerie: 'JXMN109186',
      licensePlate: null,
    });
    expect(vehicle.body).not.toHaveProperty('odometer');

    const secondClient = await request<ClientResponse>('POST', '/clients', {
      token: tenant.accessToken,
      body: { type: 'person', displayName: 'Segundo cliente con el mismo vehículo' },
    });
    const secondVehicle = await request<VehicleResponse>(
      'POST',
      `/clients/${secondClient.body.id}/vehicles`,
      {
        token: tenant.accessToken,
        body: {
          brandId: brand.body.id,
          modelId: model.body.id,
          year: 2025,
          color: 'Rojo',
          numeroSerie: 'JXMN109186',
          licensePlate: 'ABC-123-D',
        },
      },
    );
    expect(secondVehicle.status).toBe(201);

    const schema = quoteIdentifier(tenant.company.schemaName);
    await control.query(
      `INSERT INTO ${schema}.orders(
         customer_id, vehicle_id, status, created_by_user_id, updated_by_user_id
       ) VALUES ($1, $2, 'completed', $3, $3), ($4, $5, 'in_progress', $3, $3)`,
      [
        client.body.id,
        vehicle.body.id,
        tenant.user.id,
        secondClient.body.id,
        secondVehicle.body.id,
      ],
    );

    const history = await request<VehicleHistoryResponse>(
      'GET',
      `/vehicles/history?numeroSerie=JXMN109186&brandId=${brand.body.id}`,
      { token: tenant.accessToken },
    );
    expect(history.status).toBe(200);
    expect(history.body).toMatchObject({
      numeroSerie: 'JXMN109186',
      totalClients: 2,
      totalVehicles: 2,
      totalOrders: 2,
    });
    expect(history.body.matches.map(({ customerId }) => customerId)).toEqual(
      expect.arrayContaining([client.body.id, secondClient.body.id]),
    );
  });

  it('administra órdenes básicas con folio, conceptos libres, notas e historial', async () => {
    const tenant = await provisionAndLogin('Orders Integration', 'orders.admin@test.local');
    const customer = await request<ClientResponse>('POST', '/clients', {
      token: tenant.accessToken,
      body: { type: 'company', displayName: 'Flotilla Órdenes Integration' },
    });
    expect(customer.body.fiscalReadiness).toMatchObject({
      isFiscalProfileComplete: false,
      isReadyToInvoice: false,
    });
    const otherCustomer = await request<ClientResponse>('POST', '/clients', {
      token: tenant.accessToken,
      body: { type: 'person', displayName: 'Cliente ajeno a la unidad' },
    });
    const brand = await request<VehicleBrandResponse>('POST', '/catalogs/vehicle-brands', {
      token: tenant.accessToken,
      body: { name: 'Órdenes Marca Integration' },
    });
    const model = await request<VehicleModelResponse>('POST', '/catalogs/vehicle-models', {
      token: tenant.accessToken,
      body: { brandId: brand.body.id, name: 'Órdenes Modelo Integration' },
    });
    const vehicle = await request<VehicleResponse>(
      'POST',
      `/clients/${customer.body.id}/vehicles`,
      {
        token: tenant.accessToken,
        body: {
          brandId: brand.body.id,
          modelId: model.body.id,
          year: 2023,
          color: 'Azul',
          licensePlate: 'ORD-123-A',
        },
      },
    );

    const foreignRelation = await request<unknown>('POST', '/orders', {
      token: tenant.accessToken,
      body: {
        customerId: otherCustomer.body.id,
        vehicleId: vehicle.body.id,
        items: [{ description: 'No debe guardarse', quantity: 1 }],
      },
    });
    expect(foreignRelation.status).toBe(422);

    const missingPrice = await request<unknown>('POST', '/orders', {
      token: tenant.accessToken,
      body: {
        customerId: customer.body.id,
        vehicleId: vehicle.body.id,
        items: [{ kind: 'service', description: 'Sin precio', quantity: 1 }],
      },
    });
    expect(missingPrice.status).toBe(422);

    const externalFolioTooLong = await request<unknown>('POST', '/orders', {
      token: tenant.accessToken,
      body: {
        externalFolio: 'F'.repeat(51),
        customerId: customer.body.id,
        vehicleId: vehicle.body.id,
        items: [{ description: 'Validación de folio', quantity: 1, unitPrice: 0 }],
      },
    });
    expect(externalFolioTooLong.status).toBe(400);

    const created = await request<OrderResponse>('POST', '/orders', {
      token: tenant.accessToken,
      body: {
        externalFolio: '  EXCEL   2026-084  ',
        customerId: customer.body.id,
        vehicleId: vehicle.body.id,
        items: [
          { description: 'Diagnóstico general', quantity: 1, unitPrice: 0 },
          { description: 'Aceite sintético', quantity: 5, unitPrice: 180.5 },
        ],
      },
    });
    expect(created.status).toBe(201);
    expect(created.body).toMatchObject({
      folio: '1',
      externalFolio: 'EXCEL 2026-084',
      status: 'in_progress',
      isPaid: false,
      hasUnpricedItems: false,
      hasUnknownCosts: false,
      isFinanciallyComplete: true,
      subtotal: '902.50',
      total: '902.50',
      totalCost: '0.00',
      grossProfit: '902.50',
      customer: { id: customer.body.id, type: 'company' },
      vehicle: { id: vehicle.body.id },
    });
    expect(created.body.items).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          position: 1,
          kind: 'service',
          description: 'Diagnóstico general',
          unitPrice: '0.00',
          unitCost: null,
          costAmount: null,
          amount: '0.00',
        }),
        expect.objectContaining({
          position: 2,
          description: 'Aceite sintético',
          unitPrice: '180.50',
          amount: '902.50',
        }),
      ]),
    );
    expect(created.body.statusHistory).toEqual([
      expect.objectContaining({ previousStatus: null, newStatus: 'in_progress' }),
    ]);
    const updated = await request<OrderResponse>('PATCH', `/orders/${created.body.id}`, {
      token: tenant.accessToken,
      body: {
        externalFolio: '  EXCEL 2026-085  ',
        items: [
          { description: 'Mano de obra', quantity: 1, unitPrice: 1200 },
          { description: 'Aceite sintético', quantity: 5, unitPrice: 180 },
        ],
      },
    });
    expect(updated.status).toBe(200);
    expect(updated.body).toMatchObject({
      hasUnpricedItems: false,
      externalFolio: 'EXCEL 2026-085',
      hasUnknownCosts: false,
      isFinanciallyComplete: true,
      subtotal: '2100.00',
      total: '2100.00',
      totalCost: '0.00',
      grossProfit: '2100.00',
    });

    const note = await request<{ body: string; createdByUserId: string }>(
      'POST',
      `/orders/${created.body.id}/notes`,
      { token: tenant.accessToken, body: { body: 'Cliente autoriza los trabajos.' } },
    );
    expect(note.status).toBe(201);
    expect(note.body).toMatchObject({
      body: 'Cliente autoriza los trabajos.',
      createdByUserId: tenant.user.id,
    });

    for (const status of [
      'completed',
      'in_progress',
      'cancelled',
      'in_progress',
      'completed',
    ] as const) {
      const changed = await request<OrderResponse>('POST', `/orders/${created.body.id}/status`, {
        token: tenant.accessToken,
        body: { status },
      });
      expect(changed.status).toBe(200);
      expect(changed.body.status).toBe(status);
    }

    const completed = await request<OrderResponse>('GET', `/orders/${created.body.id}`, {
      token: tenant.accessToken,
    });
    expect(completed.status).toBe(200);
    expect(completed.body.notes).toEqual([
      expect.objectContaining({ body: 'Cliente autoriza los trabajos.' }),
    ]);
    expect(completed.body.statusHistory.map(({ newStatus }) => newStatus)).toEqual([
      'in_progress',
      'completed',
      'in_progress',
      'cancelled',
      'in_progress',
      'completed',
    ]);
    expect(
      (
        await request<unknown>('PATCH', `/orders/${created.body.id}`, {
          token: tenant.accessToken,
          body: { items: [{ description: 'Cambio tardío', quantity: 1 }] },
        })
      ).status,
    ).toBe(400);
    expect(
      (
        await request<unknown>('POST', `/orders/${created.body.id}/status`, {
          token: tenant.accessToken,
          body: { status: 'open' },
        })
      ).status,
    ).toBe(400);

    const second = await request<OrderResponse>('POST', '/orders', {
      token: tenant.accessToken,
      body: {
        customerId: customer.body.id,
        vehicleId: vehicle.body.id,
        items: [{ description: 'Segunda visita', quantity: 1, unitPrice: 0 }],
      },
    });
    expect(second.status).toBe(201);
    expect(second.body).toMatchObject({ folio: '2', externalFolio: null });

    const listedBySystemFolio = await request<{
      totalItems: number;
      items: OrderResponse[];
    }>('GET', '/orders?search=2&status=in_progress', { token: tenant.accessToken });
    expect(listedBySystemFolio.status).toBe(200);
    expect(listedBySystemFolio.body.items).toEqual([
      expect.objectContaining({ id: second.body.id, folio: '2', externalFolio: null }),
    ]);

    const duplicatedExternalFolio = await request<OrderResponse>(
      'PATCH',
      `/orders/${second.body.id}`,
      {
        token: tenant.accessToken,
        body: { externalFolio: 'EXCEL 2026-085' },
      },
    );
    expect(duplicatedExternalFolio.status).toBe(200);
    expect(duplicatedExternalFolio.body.externalFolio).toBe('EXCEL 2026-085');

    const repeatedInTenant = await request<{ totalItems: number; items: OrderResponse[] }>(
      'GET',
      '/orders?search=EXCEL%202026-085',
      { token: tenant.accessToken },
    );
    expect(repeatedInTenant.status).toBe(200);
    expect(repeatedInTenant.body.totalItems).toBe(2);
    expect(repeatedInTenant.body.items.map(({ id }) => id)).toEqual(
      expect.arrayContaining([created.body.id, second.body.id]),
    );

    const isolated = await provisionAndLogin(
      'Order Folio Isolated Integration',
      'order.folio.isolated@test.local',
    );
    const isolatedCustomer = await request<ClientResponse>('POST', '/clients', {
      token: isolated.accessToken,
      body: { type: 'person', displayName: 'Cliente de compañía aislada' },
    });
    const isolatedVehicle = await request<VehicleResponse>(
      'POST',
      `/clients/${isolatedCustomer.body.id}/vehicles`,
      {
        token: isolated.accessToken,
        body: {
          brandId: brand.body.id,
          modelId: model.body.id,
          year: 2024,
          color: 'Gris',
        },
      },
    );
    const isolatedOrder = await request<OrderResponse>('POST', '/orders', {
      token: isolated.accessToken,
      body: {
        externalFolio: 'EXCEL 2026-085',
        customerId: isolatedCustomer.body.id,
        vehicleId: isolatedVehicle.body.id,
        items: [{ description: 'Servicio aislado', quantity: 1, unitPrice: 500 }],
      },
    });
    expect(isolatedOrder.status).toBe(201);
    expect(isolatedOrder.body.externalFolio).toBe('EXCEL 2026-085');

    const isolatedSearch = await request<{ totalItems: number; items: OrderResponse[] }>(
      'GET',
      '/orders?search=EXCEL%202026-085',
      { token: isolated.accessToken },
    );
    expect(isolatedSearch.status).toBe(200);
    expect(isolatedSearch.body).toMatchObject({
      totalItems: 1,
      items: [expect.objectContaining({ id: isolatedOrder.body.id })],
    });
    const originalTenantSearch = await request<{
      totalItems: number;
      items: OrderResponse[];
    }>('GET', '/orders?search=EXCEL%202026-085', { token: tenant.accessToken });
    expect(originalTenantSearch.body.totalItems).toBe(2);
    expect(originalTenantSearch.body.items.map(({ id }) => id)).not.toContain(
      isolatedOrder.body.id,
    );

    const removedExternalFolio = await request<OrderResponse>(
      'PATCH',
      `/orders/${second.body.id}`,
      {
        token: tenant.accessToken,
        body: { externalFolio: '   ' },
      },
    );
    expect(removedExternalFolio.status).toBe(200);
    expect(removedExternalFolio.body.externalFolio).toBeNull();

    const afterRemoval = await request<{ totalItems: number; items: OrderResponse[] }>(
      'GET',
      '/orders?search=EXCEL%202026-085',
      { token: tenant.accessToken },
    );
    expect(afterRemoval.body.totalItems).toBe(1);
    expect(afterRemoval.body.items[0]?.id).toBe(created.body.id);

    const missingBillablePrice = await request<unknown>('POST', '/orders', {
      token: tenant.accessToken,
      body: {
        customerId: customer.body.id,
        vehicleId: vehicle.body.id,
        items: [
          {
            kind: 'product',
            description: 'Producto cobrable sin precio',
            quantity: 1,
            affectsOrderTotal: true,
          },
        ],
      },
    });
    expect(missingBillablePrice.status).toBe(422);

    const billingModes = await request<OrderResponse>('POST', '/orders', {
      token: tenant.accessToken,
      body: {
        customerId: customer.body.id,
        vehicleId: vehicle.body.id,
        items: [
          {
            kind: 'service',
            description: 'Afinación mayor',
            quantity: 1,
            unitPrice: 2100,
            unitCost: 0,
          },
          {
            kind: 'service',
            description: 'Diagnóstico electrónico',
            quantity: 1,
            unitPrice: 400,
            unitCost: 50,
          },
          { kind: 'product', description: 'Aceite incluido', quantity: 5, unitCost: 100 },
          {
            kind: 'product',
            description: 'Aditivo vendido',
            quantity: 1,
            unitPrice: 300,
            unitCost: 200,
            affectsOrderTotal: true,
          },
        ],
      },
    });
    expect(billingModes.status).toBe(201);
    expect(billingModes.body).toMatchObject({
      subtotal: '2800.00',
      total: '2800.00',
      totalCost: '750.00',
      grossProfit: '2050.00',
      hasUnpricedItems: false,
      hasUnknownCosts: false,
      isFinanciallyComplete: true,
    });
    expect(billingModes.body.items).toEqual([
      expect.objectContaining({
        kind: 'service',
        affectsOrderTotal: true,
        unitPrice: '2100.00',
        unitCost: '0.00',
        costAmount: '0.00',
        amount: '2100.00',
      }),
      expect.objectContaining({
        kind: 'service',
        affectsOrderTotal: true,
        unitPrice: '400.00',
        unitCost: '50.00',
        costAmount: '50.00',
        amount: '400.00',
      }),
      expect.objectContaining({
        kind: 'product',
        affectsOrderTotal: false,
        unitPrice: null,
        amount: '0.00',
      }),
      expect.objectContaining({
        kind: 'product',
        affectsOrderTotal: true,
        unitPrice: '300.00',
        amount: '300.00',
      }),
    ]);

    const listed = await request<{ totalItems: number; items: OrderResponse[] }>(
      'GET',
      '/orders?search=ORD-123-A&status=completed',
      { token: tenant.accessToken },
    );
    expect(listed.status).toBe(200);
    expect(listed.body.totalItems).toBe(1);
    expect(listed.body.items[0]?.id).toBe(created.body.id);

    const listedByExternalFolio = await request<{
      totalItems: number;
      items: OrderResponse[];
    }>('GET', '/orders?search=EXCEL%202026-085', { token: tenant.accessToken });
    expect(listedByExternalFolio.status).toBe(200);
    expect(listedByExternalFolio.body.totalItems).toBe(1);
    expect(listedByExternalFolio.body.items[0]).toMatchObject({
      id: created.body.id,
      folio: '1',
      externalFolio: 'EXCEL 2026-085',
    });

    const schema = quoteIdentifier(tenant.company.schemaName);
    const stored = await control.query<
      Array<{ tax: string; linked_catalog_items: string; history_count: string }>
    >(
      `SELECT service_order.tax,
              COUNT(item.product_service_id)::text AS linked_catalog_items,
              (SELECT COUNT(*)::text FROM ${schema}.order_status_history history
               WHERE history.order_id = service_order.id) AS history_count
       FROM ${schema}.orders service_order
       JOIN ${schema}.order_items item ON item.order_id = service_order.id
       WHERE service_order.id = $1 GROUP BY service_order.id`,
      [created.body.id],
    );
    expect(stored[0]).toEqual({ tax: '0.00', linked_catalog_items: '0', history_count: '6' });

    const legacyOrders = await control.query<Array<{ id: string }>>(
      `INSERT INTO ${schema}.orders(
         customer_id, vehicle_id, status, created_by_user_id, updated_by_user_id
       ) VALUES ($1, $2, 'in_progress', $3, $3) RETURNING id`,
      [customer.body.id, vehicle.body.id, tenant.user.id],
    );
    const legacyItems = await control.query<Array<{ id: string }>>(
      `INSERT INTO ${schema}.order_items(
         order_id, kind, description, quantity, unit_price, total,
         unit_name, unit_symbol, unit_cost, cost_total, tracks_inventory, position
       ) VALUES ($1, 'service', 'Concepto histórico sin precio', 1, NULL, NULL,
                 'Servicio', 'serv', NULL, NULL, false, 1) RETURNING id`,
      [legacyOrders[0]!.id],
    );
    const legacyUpdated = await request<OrderResponse>('PATCH', `/orders/${legacyOrders[0]!.id}`, {
      token: tenant.accessToken,
      body: {
        items: [
          {
            itemId: legacyItems[0]!.id,
            kind: 'service',
            description: 'Concepto histórico conservado',
            quantity: 1,
          },
        ],
      },
    });
    expect(legacyUpdated.status).toBe(200);
    expect(legacyUpdated.body.externalFolio).toBeNull();
    expect(legacyUpdated.body.items[0]).toMatchObject({
      description: 'Concepto histórico conservado',
      unitPrice: null,
      unitCost: null,
    });

    const manualCosts = await request<OrderResponse>('POST', '/orders', {
      token: tenant.accessToken,
      body: {
        customerId: customer.body.id,
        vehicleId: vehicle.body.id,
        items: [
          {
            kind: 'service',
            description: 'Servicio externo',
            quantity: 1,
            unitPrice: 300,
            unitCost: 25,
          },
          {
            kind: 'product',
            description: 'Producto libre sin inventario',
            quantity: 1,
            unitPrice: 150,
            unitCost: 75,
            affectsOrderTotal: true,
          },
        ],
      },
    });
    expect(manualCosts.status).toBe(201);
    expect(manualCosts.body).toMatchObject({
      total: '450.00',
      totalCost: '100.00',
      grossProfit: '350.00',
      hasUnknownCosts: false,
      isFinanciallyComplete: true,
    });
    const completedManualCosts = await request<OrderResponse>(
      'POST',
      `/orders/${manualCosts.body.id}/status`,
      { token: tenant.accessToken, body: { status: 'completed' } },
    );
    expect(completedManualCosts.body).toMatchObject({
      totalCost: '100.00',
      grossProfit: '350.00',
      inventoryAppliedAt: null,
    });
    const manualMovements = await control.query<Array<{ count: string }>>(
      `SELECT count(*)::text FROM ${schema}.inventory_movements WHERE order_id = $1`,
      [manualCosts.body.id],
    );
    expect(manualMovements[0]?.count).toBe('0');
  });

  it('integra catálogo, instantáneas, utilidad y devoluciones de inventario con órdenes', async () => {
    const tenant = await provisionAndLogin(
      'Order Catalog Integration',
      'order.catalog.admin@test.local',
    );
    await request<unknown>('PATCH', `/subscriptions/companies/${tenant.company.id}`, {
      token: platformToken,
      body: { planCode: 'control', status: 'active', reason: 'Órdenes con inventario' },
    });
    const units = await request<MeasurementUnitResponse[]>('GET', '/catalogs/units', {
      token: tenant.accessToken,
    });
    const piece = units.body.find(({ name }) => name === 'Pieza')!;
    const product = await request<ConceptResponse>('POST', '/catalogs/concepts', {
      token: tenant.accessToken,
      body: {
        kind: 'product',
        sku: 'ORD-INV-001',
        name: 'Filtro histórico',
        unitId: piece.id,
        cost: 80,
        price: 140,
        tracksInventory: true,
      },
    });
    await request<InventoryMovementResponse>('POST', '/inventory/movements', {
      token: tenant.accessToken,
      body: {
        productId: product.body.id,
        type: 'entry',
        quantity: 1,
        unitCost: 80,
        reason: 'Primer lote para órdenes',
      },
    });
    await request<InventoryMovementResponse>('POST', '/inventory/movements', {
      token: tenant.accessToken,
      body: {
        productId: product.body.id,
        type: 'entry',
        quantity: 9,
        unitCost: 100,
        reason: 'Segundo lote para órdenes',
      },
    });

    const customer = await request<ClientResponse>('POST', '/clients', {
      token: tenant.accessToken,
      body: { type: 'person', displayName: 'Cliente catálogo en orden' },
    });
    const brand = await request<VehicleBrandResponse>('POST', '/catalogs/vehicle-brands', {
      token: tenant.accessToken,
      body: { name: 'Marca Order Catalog Integration' },
    });
    const model = await request<VehicleModelResponse>('POST', '/catalogs/vehicle-models', {
      token: tenant.accessToken,
      body: { brandId: brand.body.id, name: 'Modelo Order Catalog Integration' },
    });
    const vehicle = await request<VehicleResponse>(
      'POST',
      `/clients/${customer.body.id}/vehicles`,
      {
        token: tenant.accessToken,
        body: {
          brandId: brand.body.id,
          modelId: model.body.id,
          year: 2025,
          color: 'Negro',
        },
      },
    );

    const created = await request<OrderResponse>('POST', '/orders', {
      token: tenant.accessToken,
      body: {
        customerId: customer.body.id,
        vehicleId: vehicle.body.id,
        items: [
          { productServiceId: product.body.id, quantity: 2, affectsOrderTotal: true },
          {
            description: 'Instalación libre',
            quantity: 1,
            unitPrice: 300,
            unitCost: 100,
          },
        ],
      },
    });
    expect(created.status).toBe(201);
    expect(created.body).toMatchObject({
      total: '580.00',
      totalCost: '300.00',
      grossProfit: '280.00',
      inventoryAppliedAt: null,
    });
    expect(created.body.items[0]).toMatchObject({
      productServiceId: product.body.id,
      description: 'Filtro histórico',
      unitName: 'Pieza',
      unitSymbol: 'pza',
      unitPrice: '140.00',
      unitCost: '100.00',
      tracksInventory: true,
    });

    await request<ConceptResponse>('PATCH', `/catalogs/concepts/${product.body.id}`, {
      token: tenant.accessToken,
      body: { cost: 95, price: 175 },
    });
    const unchanged = await request<OrderResponse>('GET', `/orders/${created.body.id}`, {
      token: tenant.accessToken,
    });
    expect(unchanged.body.items[0]).toMatchObject({
      unitPrice: '140.00',
      unitCost: '100.00',
    });

    const completed = await request<OrderResponse>('POST', `/orders/${created.body.id}/status`, {
      token: tenant.accessToken,
      body: { status: 'completed' },
    });
    expect(completed.status).toBe(200);
    expect(completed.body.inventoryAppliedAt).toBeTruthy();
    expect(completed.body).toMatchObject({
      totalCost: '280.00',
      grossProfit: '300.00',
    });
    expect(completed.body.items[0]).toMatchObject({
      unitCost: '90.00',
      costAmount: '180.00',
    });
    expect(completed.body.items[0]?.costLayers).toEqual([
      expect.objectContaining({ quantity: '1.000', unitCost: '80.00', costAmount: '80.00' }),
      expect.objectContaining({ quantity: '1.000', unitCost: '100.00', costAmount: '100.00' }),
    ]);
    expect(
      (
        await request<InventoryProductResponse>('GET', `/inventory/products/${product.body.id}`, {
          token: tenant.accessToken,
        })
      ).body.stock,
    ).toBe('8.000');

    const reopened = await request<OrderResponse>('POST', `/orders/${created.body.id}/status`, {
      token: tenant.accessToken,
      body: { status: 'in_progress' },
    });
    expect(reopened.body.inventoryAppliedAt).toBeNull();
    expect(
      (
        await request<InventoryProductResponse>('GET', `/inventory/products/${product.body.id}`, {
          token: tenant.accessToken,
        })
      ).body.stock,
    ).toBe('10.000');

    const edited = await request<OrderResponse>('PATCH', `/orders/${created.body.id}`, {
      token: tenant.accessToken,
      body: {
        items: [
          {
            itemId: reopened.body.items[0]!.id,
            productServiceId: product.body.id,
            description: 'Este texto no debe sustituir la instantánea',
            quantity: 3,
          },
          {
            itemId: reopened.body.items[1]!.id,
            description: 'Instalación libre',
            quantity: 1,
            unitPrice: 300,
            unitCost: 100,
          },
        ],
      },
    });
    expect(edited.body).toMatchObject({
      total: '720.00',
      totalCost: '370.00',
      grossProfit: '350.00',
    });
    expect(edited.body.items[0]).toMatchObject({
      description: 'Filtro histórico',
      unitPrice: '140.00',
      unitCost: '90.00',
    });

    const completedAgain = await request<OrderResponse>(
      'POST',
      `/orders/${created.body.id}/status`,
      {
        token: tenant.accessToken,
        body: { status: 'completed' },
      },
    );
    expect(completedAgain.body).toMatchObject({
      totalCost: '380.00',
      grossProfit: '340.00',
    });
    expect(completedAgain.body.items[0]).toMatchObject({
      unitCost: '93.33',
      costAmount: '280.00',
    });
    expect(
      (
        await request<InventoryProductResponse>('GET', `/inventory/products/${product.body.id}`, {
          token: tenant.accessToken,
        })
      ).body.stock,
    ).toBe('7.000');
    const cancelled = await request<OrderResponse>('POST', `/orders/${created.body.id}/status`, {
      token: tenant.accessToken,
      body: { status: 'cancelled' },
    });
    expect(cancelled.body.inventoryAppliedAt).toBeNull();
    expect(
      (
        await request<InventoryProductResponse>('GET', `/inventory/products/${product.body.id}`, {
          token: tenant.accessToken,
        })
      ).body.stock,
    ).toBe('10.000');

    const duplicateCancellation = await request<unknown>(
      'POST',
      `/orders/${created.body.id}/status`,
      { token: tenant.accessToken, body: { status: 'cancelled' } },
    );
    expect(duplicateCancellation.status).toBe(400);
    const restoredLots = await request<InventoryLotResponse[]>(
      'GET',
      `/inventory/products/${product.body.id}/lots`,
      { token: tenant.accessToken },
    );
    expect(
      restoredLots.body.map(({ receivedQuantity, remainingQuantity, unitCost }) => ({
        receivedQuantity,
        remainingQuantity,
        unitCost,
      })),
    ).toEqual(
      expect.arrayContaining([
        { receivedQuantity: '1.000', remainingQuantity: '1.000', unitCost: '80.00' },
        { receivedQuantity: '9.000', remainingQuantity: '9.000', unitCost: '100.00' },
      ]),
    );

    const schema = quoteIdentifier(tenant.company.schemaName);
    const movements = await control.query<
      Array<{
        id: string;
        movement_type: string;
        quantity: string;
        order_id: string;
        reverses_movement_id: string | null;
      }>
    >(
      `SELECT id, movement_type, quantity::text, order_id, reverses_movement_id
       FROM ${schema}.inventory_movements
       WHERE order_id = $1 ORDER BY created_at, id`,
      [created.body.id],
    );
    expect(movements).toHaveLength(4);
    expect(movements.map(({ movement_type, quantity }) => ({ movement_type, quantity }))).toEqual([
      { movement_type: 'exit', quantity: '-2.000' },
      { movement_type: 'entry', quantity: '2.000' },
      { movement_type: 'exit', quantity: '-3.000' },
      { movement_type: 'entry', quantity: '3.000' },
    ]);
    const exits = movements.filter(({ movement_type }) => movement_type === 'exit');
    const returns = movements.filter(({ movement_type }) => movement_type === 'entry');
    expect(returns.map(({ reverses_movement_id }) => reverses_movement_id)).toEqual(
      expect.arrayContaining(exits.map(({ id }) => id)),
    );
    const fifoAllocations = await control.query<
      Array<{ movement_id: string; lot_count: string; actual_cost: string }>
    >(
      `SELECT allocation.movement_id, count(*)::text AS lot_count,
              round(sum(allocation.quantity * allocation.unit_cost), 2)::text AS actual_cost
       FROM ${schema}.inventory_lot_allocations allocation
       JOIN ${schema}.inventory_movements movement ON movement.id = allocation.movement_id
       WHERE movement.order_id = $1 AND movement.movement_type = 'exit'
       GROUP BY allocation.movement_id ORDER BY min(movement.created_at)`,
      [created.body.id],
    );
    expect(
      fifoAllocations.map(({ lot_count, actual_cost }) => ({ lot_count, actual_cost })),
    ).toEqual([
      { lot_count: '2', actual_cost: '180.00' },
      { lot_count: '2', actual_cost: '280.00' },
    ]);

    const inputOrder = await request<OrderResponse>('POST', '/orders', {
      token: tenant.accessToken,
      body: {
        customerId: customer.body.id,
        vehicleId: vehicle.body.id,
        items: [
          { productServiceId: product.body.id, quantity: 2 },
          {
            kind: 'service',
            description: 'Afinación con insumos incluidos',
            quantity: 1,
            unitPrice: 300,
            unitCost: 0,
          },
        ],
      },
    });
    expect(inputOrder.status).toBe(201);
    expect(inputOrder.body).toMatchObject({
      total: '300.00',
      totalCost: '190.00',
      grossProfit: '110.00',
    });
    expect(inputOrder.body.items[0]).toMatchObject({
      kind: 'product',
      affectsOrderTotal: false,
      unitPrice: null,
      amount: '0.00',
      unitCost: '95.00',
      costAmount: '190.00',
      tracksInventory: true,
    });

    const completedInput = await request<OrderResponse>(
      'POST',
      `/orders/${inputOrder.body.id}/status`,
      { token: tenant.accessToken, body: { status: 'completed' } },
    );
    expect(completedInput.status).toBe(200);
    expect(completedInput.body).toMatchObject({
      total: '300.00',
      totalCost: '180.00',
      grossProfit: '120.00',
    });
    expect(completedInput.body.items[0]).toMatchObject({
      affectsOrderTotal: false,
      unitPrice: null,
      unitCost: '90.00',
      costAmount: '180.00',
    });
    expect(completedInput.body.items[0]?.costLayers).toEqual([
      expect.objectContaining({ quantity: '1.000', unitCost: '80.00', costAmount: '80.00' }),
      expect.objectContaining({ quantity: '1.000', unitCost: '100.00', costAmount: '100.00' }),
    ]);
    expect(
      (
        await request<InventoryProductResponse>('GET', `/inventory/products/${product.body.id}`, {
          token: tenant.accessToken,
        })
      ).body.stock,
    ).toBe('8.000');

    const reopenedInput = await request<OrderResponse>(
      'POST',
      `/orders/${inputOrder.body.id}/status`,
      { token: tenant.accessToken, body: { status: 'in_progress' } },
    );
    expect(reopenedInput.status).toBe(200);
    expect(reopenedInput.body.inventoryAppliedAt).toBeNull();
    expect(
      (
        await request<InventoryProductResponse>('GET', `/inventory/products/${product.body.id}`, {
          token: tenant.accessToken,
        })
      ).body.stock,
    ).toBe('10.000');
    expect(
      (
        await request<unknown>('POST', `/orders/${inputOrder.body.id}/status`, {
          token: tenant.accessToken,
          body: { status: 'in_progress' },
        })
      ).status,
    ).toBe(400);

    const completedInputAgain = await request<OrderResponse>(
      'POST',
      `/orders/${inputOrder.body.id}/status`,
      { token: tenant.accessToken, body: { status: 'completed' } },
    );
    expect(completedInputAgain.status).toBe(200);
    expect(completedInputAgain.body).toMatchObject({
      totalCost: '180.00',
      grossProfit: '120.00',
    });
    const cancelledInput = await request<OrderResponse>(
      'POST',
      `/orders/${inputOrder.body.id}/status`,
      { token: tenant.accessToken, body: { status: 'cancelled' } },
    );
    expect(cancelledInput.status).toBe(200);
    expect(cancelledInput.body.inventoryAppliedAt).toBeNull();
    expect(
      (
        await request<InventoryProductResponse>('GET', `/inventory/products/${product.body.id}`, {
          token: tenant.accessToken,
        })
      ).body.stock,
    ).toBe('10.000');
    expect(
      (
        await request<unknown>('POST', `/orders/${inputOrder.body.id}/status`, {
          token: tenant.accessToken,
          body: { status: 'cancelled' },
        })
      ).status,
    ).toBe(400);

    const inputMovements = await control.query<
      Array<{
        id: string;
        movement_type: string;
        quantity: string;
        reverses_movement_id: string | null;
      }>
    >(
      `SELECT id, movement_type, quantity::text, reverses_movement_id
       FROM ${schema}.inventory_movements
       WHERE order_id = $1 ORDER BY created_at, id`,
      [inputOrder.body.id],
    );
    expect(
      inputMovements.map(({ movement_type, quantity }) => ({ movement_type, quantity })),
    ).toEqual([
      { movement_type: 'exit', quantity: '-2.000' },
      { movement_type: 'entry', quantity: '2.000' },
      { movement_type: 'exit', quantity: '-2.000' },
      { movement_type: 'entry', quantity: '2.000' },
    ]);
    const inputExits = inputMovements.filter(({ movement_type }) => movement_type === 'exit');
    const inputReturns = inputMovements.filter(({ movement_type }) => movement_type === 'entry');
    expect(inputReturns.map(({ reverses_movement_id }) => reverses_movement_id)).toEqual(
      inputExits.map(({ id }) => id),
    );

    const orderWithoutStock = await request<OrderResponse>('POST', '/orders', {
      token: tenant.accessToken,
      body: {
        customerId: customer.body.id,
        vehicleId: vehicle.body.id,
        items: [{ productServiceId: product.body.id, quantity: 11 }],
      },
    });
    const rejectedCompletion = await request<unknown>(
      'POST',
      `/orders/${orderWithoutStock.body.id}/status`,
      { token: tenant.accessToken, body: { status: 'completed' } },
    );
    expect(rejectedCompletion.status).toBe(422);
    const unchangedOrder = await request<OrderResponse>(
      'GET',
      `/orders/${orderWithoutStock.body.id}`,
      { token: tenant.accessToken },
    );
    expect(unchangedOrder.body.status).toBe('in_progress');
    expect(
      (
        await request<InventoryProductResponse>('GET', `/inventory/products/${product.body.id}`, {
          token: tenant.accessToken,
        })
      ).body.stock,
    ).toBe('10.000');
  });

  it('cambia la contraseña del platform_admin, revoca sesiones y permite un nuevo login', async () => {
    const newPassword = 'PlatformChanged#2026';
    const authenticated = await login(PLATFORM_EMAIL, PLATFORM_PASSWORD);
    expect(authenticated.status).toBe(200);
    const cookie = cookiePair(authenticated.setCookie!);
    const payload = JSON.parse(
      Buffer.from(authenticated.body.accessToken.split('.')[1]!, 'base64url').toString('utf8'),
    ) as { jti: string };

    await changePlatformAdminPassword(control, PLATFORM_EMAIL, newPassword, 'local');

    const sessions = await control.query<
      Array<{ revoked_at: Date | null; token_revoked_at: Date | null }>
    >(
      `SELECT session.revoked_at, refresh.revoked_at AS token_revoked_at
       FROM public.auth_sessions session
       JOIN public.auth_refresh_tokens refresh ON refresh.session_id = session.id
       WHERE session.id = $1`,
      [payload.jti],
    );
    expect(sessions.length).toBeGreaterThan(0);
    expect(sessions.every(({ revoked_at }) => revoked_at !== null)).toBe(true);
    expect(sessions.every(({ token_revoked_at }) => token_revoked_at !== null)).toBe(true);
    expect(
      (await request<unknown>('GET', '/auth/me', { token: authenticated.body.accessToken })).status,
    ).toBe(401);
    expect((await request<unknown>('POST', '/auth/refresh', { cookie })).status).toBe(401);
    expect((await login(PLATFORM_EMAIL, PLATFORM_PASSWORD)).status).toBe(401);

    const renewed = await login(PLATFORM_EMAIL, newPassword);
    expect(renewed.status).toBe(200);
    expect(renewed.body.user.role).toBe('platform_admin');

    const events = await control.query<
      Array<{ event_type: string; source: string; environment: string }>
    >(
      `SELECT event_type, source, environment
       FROM public.platform_admin_security_events event
       JOIN public.users user_account ON user_account.id = event.target_user_id
       WHERE user_account.email = $1
       ORDER BY event.created_at DESC
       LIMIT 1`,
      [PLATFORM_EMAIL],
    );
    expect(events[0]).toEqual({
      event_type: 'password_changed',
      source: 'local_admin_command',
      environment: 'local',
    });
  });

  async function createCompany(
    name: string,
    adminEmail: string,
    planCode?: 'essential' | 'control' | 'invoicing',
  ): Promise<HttpResult<CompanyResponse>> {
    return request<CompanyResponse>('POST', '/companies', {
      token: platformToken,
      body: {
        name,
        loginCode: name.toLowerCase().replace(/[^a-z0-9]+/g, '_'),
        companyTypeCode: 'mul',
        personTypeCode: 'individual',
        withholdsIsr: false,
        withholdsIva: false,
        ...(planCode ? { planCode } : {}),
        admin: {
          fullName: `Administrador ${name}`,
          username: adminEmail.split('@')[0]!.replaceAll('.', '_'),
          email: adminEmail,
          phone: '+526671234567',
          password: TENANT_PASSWORD,
          timezoneCode: 'America/Mazatlan',
        },
      },
    });
  }

  async function provisionAndLogin(
    name: string,
    email: string,
    planCode?: 'essential' | 'control' | 'invoicing',
  ): Promise<ProvisionedTenant> {
    const company = await createCompany(name, email, planCode);
    expect(company.status).toBe(201);
    const authenticated = await login(company.body.admin.loginName, TENANT_PASSWORD);
    expect(authenticated.status).toBe(200);
    expect(authenticated.body.user.mustChangePassword).toBe(true);
    expect(authenticated.body.user.companyId).toBe(company.body.id);
    const changed = await request<unknown>('PATCH', '/users/me/password', {
      token: authenticated.body.accessToken,
      body: { currentPassword: TENANT_PASSWORD, newPassword: PERMANENT_PASSWORD },
    });
    expect(changed.status).toBe(204);
    expect(
      (await request<unknown>('GET', '/auth/me', { token: authenticated.body.accessToken })).status,
    ).toBe(401);
    expect(
      (
        await request<unknown>('POST', '/auth/refresh', {
          cookie: cookiePair(authenticated.setCookie!),
        })
      ).status,
    ).toBe(401);
    const permanent = await login(company.body.admin.loginName, PERMANENT_PASSWORD);
    expect(permanent.status).toBe(200);
    expect(permanent.body.user.mustChangePassword).toBe(false);
    return { ...permanent.body, company: company.body };
  }

  async function tenantSchemaNames(): Promise<string[]> {
    const rows = await control.query<Array<{ nspname: string }>>(
      "SELECT nspname FROM pg_namespace WHERE nspname LIKE '\\_%' ESCAPE '\\' ORDER BY nspname",
    );
    return rows.map(({ nspname }) => nspname);
  }

  function login(identifier: string, password: string): Promise<HttpResult<LoginResponse>> {
    return request<LoginResponse>('POST', '/auth/login', { body: { identifier, password } });
  }

  function listClients(token: string): Promise<HttpResult<PaginatedClients>> {
    return request<PaginatedClients>('GET', '/clients?page=1&limit=20&isActive=true', { token });
  }

  async function request<T>(
    method: string,
    path: string,
    options: { token?: string; cookie?: string; origin?: string | null; body?: unknown } = {},
  ): Promise<HttpResult<T>> {
    const origin = options.origin === undefined ? 'http://127.0.0.1:4200' : options.origin;
    const response = await fetch(`${baseUrl}${path}`, {
      method,
      headers: {
        Accept: 'application/json',
        ...(options.body === undefined ? {} : { 'Content-Type': 'application/json' }),
        ...(options.token ? { Authorization: `Bearer ${options.token}` } : {}),
        ...(options.cookie ? { Cookie: options.cookie } : {}),
        ...(origin ? { Origin: origin } : {}),
      },
      body: options.body === undefined ? undefined : JSON.stringify(options.body),
    });
    const text = await response.text();
    return {
      status: response.status,
      body: (text ? JSON.parse(text) : undefined) as T,
      setCookie: response.headers.get('set-cookie'),
    };
  }

  async function requestBinary(path: string, token: string): Promise<BinaryHttpResult> {
    const response = await fetch(`${baseUrl}${path}`, {
      headers: {
        Accept: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        Authorization: `Bearer ${token}`,
        Origin: 'http://127.0.0.1:4200',
      },
    });
    return {
      status: response.status,
      body: Buffer.from(await response.arrayBuffer()),
      contentType: response.headers.get('content-type'),
      contentDisposition: response.headers.get('content-disposition'),
    };
  }

  function cookiePair(setCookie: string): string {
    return setCookie.split(';', 1)[0]!;
  }
});

async function resetPublicSchema(dataSource: DataSource): Promise<void> {
  const tenantSchemas = await dataSource.query<Array<{ nspname: string }>>(
    `SELECT nspname FROM pg_namespace
     WHERE nspname <> 'public'
       AND nspname <> 'information_schema'
       AND left(nspname, 3) <> 'pg_'`,
  );
  for (const { nspname } of tenantSchemas) {
    await dataSource.query(`DROP SCHEMA ${quoteIdentifier(nspname)} CASCADE`);
  }
  await dataSource.query('DROP SCHEMA IF EXISTS public CASCADE');
  await dataSource.query('CREATE SCHEMA public AUTHORIZATION CURRENT_USER');
}
