import 'reflect-metadata';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import * as argon2 from 'argon2';
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
import { quoteIdentifier } from '../../src/database/schema-name';
import { seedPublicCatalogs } from '../../src/database/seeds/public-catalogs.seed';

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
    mustChangePassword: boolean;
    permissions: string[];
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
  createdByUserId: string;
  updatedByUserId: string;
}

interface PaginatedClients {
  totalItems: number;
  items: ClientResponse[];
}

interface HttpResult<T> {
  status: number;
  body: T;
  sessionToken: string | null;
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
    isComplete: boolean;
  }>;
}

interface DashboardSummaryResponse {
  period: { month: string; startsOn: string; endsOn: string };
  access: {
    planCode: 'basic' | 'control' | 'invoicing';
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
  status: string;
  isPaid: boolean;
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

  it('renueva el token al usarlo y rechaza sesiones inactivas por más de 14 días', async () => {
    const tenant = await provisionAndLogin('Session Integration', 'session.admin@test.local');
    const active = await listClients(tenant.accessToken);
    expect(active.status).toBe(200);
    expect(active.sessionToken).toBeTruthy();

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
      planCode: 'basic',
      status: 'trialing',
      limits: { max_users: 3 },
    });
    expect(initial.body.features).not.toContain('inventory');

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

    const client = await request<ClientResponse>('POST', '/clients', {
      token: tenant.accessToken,
      body: { type: 'person', displayName: 'Cliente conservado por suscripción' },
    });
    expect(client.status).toBe(201);

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
    expect(upgraded.body.features).toEqual(expect.arrayContaining(['inventory', 'expenses']));

    const suspended = await request<unknown>(
      'PATCH',
      `/subscriptions/companies/${tenant.company.id}`,
      {
        token: platformToken,
        body: { planCode: 'basic', status: 'suspended', reason: 'Prueba de suspensión' },
      },
    );
    expect(suspended.status).toBe(200);
    expect((await listClients(tenant.accessToken)).status).toBe(403);

    await request<unknown>('PATCH', `/subscriptions/companies/${tenant.company.id}`, {
      token: platformToken,
      body: { planCode: 'basic', status: 'active', reason: 'Reactivación' },
    });
    const restored = await listClients(tenant.accessToken);
    expect(restored.status).toBe(200);
    expect(restored.body.items.map(({ id }) => id)).toContain(client.body.id);
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
    expect(catalog.body).toHaveLength(40);
    expect(catalog.body).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ code: 'orders.create', module: 'orders', action: 'create' }),
        expect.objectContaining({ code: 'profitability.view' }),
        expect.objectContaining({ code: 'permissions.manage' }),
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
      body: { planCode: 'basic', status: 'active', reason: 'Regreso al plan original' },
    });
    const preserved = await request<UserPermissionProfileResponse>(
      'GET',
      `/permissions/users/${operator.body.id}`,
      { token: tenant.accessToken },
    );
    expect(preserved.status).toBe(200);
    expect(preserved.body.permissionCodes).toEqual(reception.permissionCodes);
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

    const dashboard = await request<{ financials: unknown }>('GET', '/dashboard/summary', {
      token: operatorLogin.body.accessToken,
    });
    expect(dashboard.status).toBe(200);
    expect(dashboard.body.financials).toBeNull();

    await request<unknown>('PATCH', `/subscriptions/companies/${tenant.company.id}`, {
      token: platformToken,
      body: { planCode: 'basic', status: 'active', reason: 'Validar intersección con plan' },
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
    expect((await listClients(userLogin.body.accessToken)).status).toBe(403);
    const passwordChanged = await request<unknown>('PATCH', '/users/me/password', {
      token: userLogin.body.accessToken,
      body: { currentPassword: USER_PASSWORD, newPassword: PERMANENT_PASSWORD },
    });
    expect(passwordChanged.status).toBe(204);
    const permanentLogin = await login(`operador@${tenant.company.loginCode}`, PERMANENT_PASSWORD);
    expect(permanentLogin.status).toBe(200);
    expect(permanentLogin.body.user.mustChangePassword).toBe(false);

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
    ).toBe(403);
    await request<unknown>('PATCH', `/subscriptions/companies/${tenant.company.id}`, {
      token: platformToken,
      body: { planCode: 'control', status: 'active', reason: 'Gastos de integración' },
    });

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
      status: 'draft',
      recurrenceType: 'recurring',
      occurredOn: '2026-10-01',
      description: 'Renta del taller',
      reference: 'REN-OCT-2026',
      amount: '12500.50',
      notes: 'Pago mensual',
      receiptFileKey: null,
      statusHistory: [
        { previousStatus: null, newStatus: 'draft', changedByUserId: tenant.user.id },
      ],
    });

    const edited = await request<ExpenseResponse>('PATCH', `/expenses/${created.body.id}`, {
      token: tenant.accessToken,
      body: { amount: 12750, reference: null, notes: 'Renta actualizada' },
    });
    expect(edited.body).toMatchObject({
      amount: '12750.00',
      reference: null,
      notes: 'Renta actualizada',
    });

    const confirmed = await request<ExpenseResponse>(
      'POST',
      `/expenses/${created.body.id}/status`,
      { token: tenant.accessToken, body: { status: 'confirmed' } },
    );
    expect(confirmed.body.status).toBe('confirmed');
    expect(confirmed.body.confirmedAt).not.toBeNull();
    expect(confirmed.body.statusHistory.map(({ newStatus }) => newStatus)).toEqual([
      'draft',
      'confirmed',
    ]);
    expect(
      (
        await request<unknown>('PATCH', `/expenses/${created.body.id}`, {
          token: tenant.accessToken,
          body: { amount: 1 },
        })
      ).status,
    ).toBe(400);
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
      'draft',
      'confirmed',
      'cancelled',
    ]);

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

    const draft = await request<ExpenseResponse>('POST', '/expenses', {
      token: tenant.accessToken,
      body: {
        categoryId: categories.body.find(({ code }) => code === 'other')!.id,
        occurredOn: '2026-10-02',
        description: 'Gasto único',
        amount: 250,
      },
    });
    expect(draft.body.recurrenceType).toBe('one_time');
    const draftCancelled = await request<ExpenseResponse>(
      'POST',
      `/expenses/${draft.body.id}/status`,
      { token: tenant.accessToken, body: { status: 'cancelled' } },
    );
    expect(draftCancelled.body.statusHistory.map(({ newStatus }) => newStatus)).toEqual([
      'draft',
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
    await request<ExpenseResponse>('POST', `/expenses/${previousMonthExpense.body.id}/status`, {
      token: tenant.accessToken,
      body: { status: 'confirmed' },
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
    await request<ExpenseResponse>('POST', `/expenses/${currentMonthExpense.body.id}/status`, {
      token: tenant.accessToken,
      body: { status: 'confirmed' },
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
      confirmedAmount: '1500.00',
      previousConfirmedCount: 1,
      previousConfirmedAmount: '1000.00',
      changeAmount: '500.00',
      changePercent: '50.00',
      direction: 'increase',
      draftCount: 0,
      draftAmount: '0.00',
    });
    expect(monthly.body.byCategory).toHaveLength(1);
    expect(monthly.body.byCategory[0]).toMatchObject({
      category: { code: 'utilities' },
      count: 1,
      amount: '1500.00',
    });
    expect(monthly.body.recentExpenses.map(({ id }) => id)).toEqual(
      expect.arrayContaining([previousMonthExpense.body.id, currentMonthExpense.body.id]),
    );

    const octoberFiltered = await request<{ totalItems: number; items: ExpenseResponse[] }>(
      'GET',
      `/expenses?occurredFrom=2026-10-01&occurredTo=2026-10-31&categoryId=${utilities.id}&status=confirmed`,
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
      'SELECT version FROM public.tenant_schema_versions WHERE company_id = $1 AND version = 19',
      [tenant.company.id],
    );
    expect(versions).toEqual([{ version: 19 }]);
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
    ).toBe(403);
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
        ],
      },
    });
    expect(order.status).toBe(201);
    expect(order.body.items.map(({ kind, unitCost }) => ({ kind, unitCost }))).toEqual([
      { kind: 'product', unitCost: '80.00' },
      { kind: 'service', unitCost: '50.00' },
      { kind: 'service', unitCost: '20.00' },
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
      grossProfit: null,
      hasUnknownCosts: true,
      isFinanciallyComplete: false,
    });
    const incompleteReport = await request<ProfitabilityReportResponse>(
      'GET',
      '/profitability?occurredFrom=2026-10-01&occurredTo=2026-10-31',
      { token: tenant.accessToken },
    );
    expect(incompleteReport.body.totals).toMatchObject({
      completedOrderCount: 1,
      incompleteOrderCount: 1,
      missingPriceOrderCount: 0,
      missingCostOrderCount: 1,
      income: '250.00',
      directCost: '0.00',
      grossProfit: '0.00',
      isComplete: false,
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
    await request<ExpenseResponse>('POST', `/expenses/${expense.body.id}/status`, {
      token: tenant.accessToken,
      body: { status: 'confirmed' },
    });

    const paid = await request<OrderResponse>('PATCH', `/orders/${order.body.id}/payment-status`, {
      token: tenant.accessToken,
      body: { isPaid: true },
    });
    expect(paid.status).toBe(200);
    expect(paid.body.isPaid).toBe(true);
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
      isComplete: true,
    });

    const pending = await request<OrderResponse>(
      'PATCH',
      `/orders/${order.body.id}/payment-status`,
      { token: tenant.accessToken, body: { isPaid: false } },
    );
    expect(pending.body.isPaid).toBe(false);
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
    expect(
      (
        await request<unknown>(
          'GET',
          '/profitability?occurredFrom=2026-10-31&occurredTo=2026-10-01',
          { token: tenant.accessToken },
        )
      ).status,
    ).toBe(400);
  });

  it('resume la operación y limita finanzas e inventario según el plan', async () => {
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

    const basic = await request<DashboardSummaryResponse>('GET', '/dashboard/summary', {
      token: tenant.accessToken,
    });
    expect(basic.status).toBe(200);
    expect(basic.body.period.month).toMatch(/^\d{4}-\d{2}$/);
    expect(basic.body.access).toEqual({
      planCode: 'basic',
      planName: 'Básico',
      includesFinancials: false,
      includesLowStock: false,
    });
    expect(basic.body.orders).toEqual({
      inProgressCount: 1,
      unpaidCount: 2,
      completedUnpaidCount: 1,
      completedPaidCount: 1,
    });
    expect(basic.body.revenue).toEqual({
      generated: '500.00',
      collected: '300.00',
      outstanding: '200.00',
      receivable: '300.00',
    });
    expect(basic.body.financials).toBeNull();
    expect(basic.body.lowStock).toBeNull();
    const basicActivity = await request<DashboardActivityResponse>('GET', '/dashboard/activity', {
      token: tenant.accessToken,
    });
    expect(basicActivity.status).toBe(200);
    expect(basicActivity.body.recentOrders).toHaveLength(3);
    expect(basicActivity.body.oldestInProgress).toEqual([
      expect.objectContaining({ id: inProgressOrder.body.id, daysOpen: 0 }),
    ]);
    expect(basicActivity.body.pendingCollection).toHaveLength(2);
    expect(basicActivity.body.pendingCollection).toEqual(
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
    expect(basicActivity.body.recentPurchases).toBeNull();
    expect(basicActivity.body.recentExpenses).toBeNull();
    expect(basicActivity.body.recentInventoryMovements).toBeNull();
    expect(basicActivity.body.lowStock).toBeNull();

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
        occurredOn: basic.body.period.startsOn,
        description: 'Gasto para resumen del tablero',
        amount: 120,
      },
    });
    await request<ExpenseResponse>('POST', `/expenses/${expense.body.id}/status`, {
      token: tenant.accessToken,
      body: { status: 'confirmed' },
    });

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

    const created = await request<OrderResponse>('POST', '/orders', {
      token: tenant.accessToken,
      body: {
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
      status: 'in_progress',
      isPaid: false,
      hasUnpricedItems: false,
      hasUnknownCosts: true,
      isFinanciallyComplete: false,
      subtotal: '902.50',
      total: '902.50',
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
        items: [
          { description: 'Mano de obra', quantity: 1, unitPrice: 1200 },
          { description: 'Aceite sintético', quantity: 5, unitPrice: 180 },
        ],
      },
    });
    expect(updated.status).toBe(200);
    expect(updated.body).toMatchObject({
      hasUnpricedItems: false,
      hasUnknownCosts: true,
      isFinanciallyComplete: false,
      subtotal: '2100.00',
      total: '2100.00',
      totalCost: '0.00',
      grossProfit: null,
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
    expect(second.body.folio).toBe('2');

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
      subtotal: '2400.00',
      total: '2400.00',
      totalCost: '700.00',
      grossProfit: '1700.00',
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

  async function createCompany(
    name: string,
    adminEmail: string,
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

  async function provisionAndLogin(name: string, email: string): Promise<ProvisionedTenant> {
    const company = await createCompany(name, email);
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
    options: { token?: string; body?: unknown } = {},
  ): Promise<HttpResult<T>> {
    const response = await fetch(`${baseUrl}${path}`, {
      method,
      headers: {
        Accept: 'application/json',
        ...(options.body === undefined ? {} : { 'Content-Type': 'application/json' }),
        ...(options.token ? { Authorization: `Bearer ${options.token}` } : {}),
      },
      body: options.body === undefined ? undefined : JSON.stringify(options.body),
    });
    const text = await response.text();
    return {
      status: response.status,
      body: (text ? JSON.parse(text) : undefined) as T,
      sessionToken: response.headers.get('x-session-token'),
    };
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
