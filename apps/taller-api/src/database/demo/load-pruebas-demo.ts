import 'dotenv/config';
import { DataSource, QueryRunner } from 'typeorm';
import { quoteIdentifier } from '../schema-name';
import { TENANT_BASE_VERSION } from '../tenant/tenant-migrator';
import publicDataSource from '../public-data-source';
import { DemoOrder, DemoOrderItem, PRUEBAS_DEMO_DATASET } from './pruebas-demo.dataset';

const TARGET_COMPANY = PRUEBAS_DEMO_DATASET.targetCompanyLoginCode;
const PRODUCTION_CONFIRMATION = 'LOAD_PRUEBAS_DEMO';
const DEMO_CREATED_AT = '2026-08-01T08:00:00-07:00';

interface CompanyRow {
  id: string;
  name: string;
  schema_name: string;
  login_code: string;
  is_active: boolean;
}

interface SubscriptionRow {
  plan_code: string;
  status: string;
  features: string[];
}

interface ActorRow {
  id: string;
  full_name: string;
}

interface IdentifierRow {
  id: string;
}

interface DemoState {
  customerCount: number;
  orderCount: number;
  expenseCount: number;
}

export interface DemoLoadOptions {
  apply: boolean;
  confirmation?: string;
  productionConfirmation?: string;
  databaseUrl?: string;
  environment?: string;
}

export interface DemoLoadResult {
  status: 'preview' | 'loaded' | 'already_loaded';
  companyId: string;
  companyName: string;
  schemaName: string;
  planCode: string;
  actorName: string;
  customers: number;
  vehicles: number;
  orders: number;
  expenses: number;
}

function remoteDatabase(databaseUrl: string): boolean {
  const hostname = new URL(databaseUrl).hostname.toLowerCase();
  return !['localhost', '127.0.0.1', '::1'].includes(hostname);
}

export function assertDemoLoadAuthorization(options: DemoLoadOptions): void {
  if (!options.apply) return;
  if (options.confirmation !== TARGET_COMPANY) {
    throw new Error(`La carga requiere --confirm=${TARGET_COMPANY}`);
  }
  const databaseUrl = options.databaseUrl?.trim();
  if (!databaseUrl) throw new Error('DATABASE_URL es obligatoria');
  const productionTarget = options.environment === 'production' || remoteDatabase(databaseUrl);
  if (productionTarget && options.productionConfirmation !== PRODUCTION_CONFIRMATION) {
    throw new Error(
      `La carga contra una base remota requiere --production-confirm=${PRODUCTION_CONFIRMATION}`,
    );
  }
}

function amount(order: DemoOrder): number {
  return order.items.reduce(
    (total, item) => total + (item.affectsOrderTotal ? item.quantity * (item.unitPrice ?? 0) : 0),
    0,
  );
}

function cost(order: DemoOrder): number {
  return order.items.reduce((total, item) => total + item.quantity * (item.unitCost ?? 0), 0);
}

function itemAmount(item: DemoOrderItem): number {
  return item.affectsOrderTotal ? item.quantity * (item.unitPrice ?? 0) : 0;
}

function itemCost(item: DemoOrderItem): number | null {
  return item.unitCost === null ? null : item.quantity * item.unitCost;
}

function marker(kind: 'customer', key: string): string {
  return `[demo:${PRUEBAS_DEMO_DATASET.version}:${kind}:${key}]`;
}

async function companyContext(
  runner: QueryRunner,
  lock: boolean,
): Promise<{ company: CompanyRow; subscription: SubscriptionRow; actor: ActorRow }> {
  const companies = (await runner.query(
    `SELECT id, name, schema_name, login_code, is_active
     FROM public.companies
     WHERE login_code = $1
     ${lock ? 'FOR UPDATE' : ''}`,
    [TARGET_COMPANY],
  )) as CompanyRow[];
  const company = companies[0];
  if (!company || companies.length !== 1) {
    throw new Error(`Debe existir exactamente una compañía con código ${TARGET_COMPANY}`);
  }
  if (company.login_code !== TARGET_COMPANY) {
    throw new Error(`La compañía objetivo debe tener exactamente el código ${TARGET_COMPANY}`);
  }
  if (!company.is_active) throw new Error('La compañía pruebas está desactivada');

  const subscriptions = (await runner.query(
    `SELECT subscription.plan_code, subscription.status,
            COALESCE(array_agg(feature.feature_code ORDER BY feature.feature_code)
              FILTER (WHERE feature.feature_code IS NOT NULL), '{}') AS features
     FROM public.company_subscriptions subscription
     LEFT JOIN public.subscription_plan_features feature
       ON feature.plan_code = subscription.plan_code
     WHERE subscription.company_id = $1
     GROUP BY subscription.plan_code, subscription.status`,
    [company.id],
  )) as SubscriptionRow[];
  const subscription = subscriptions[0];
  if (!subscription || subscription.status !== 'active') {
    throw new Error('La compañía pruebas necesita una suscripción activa');
  }
  for (const feature of ['service_orders', 'free_order_items', 'expenses', 'profitability']) {
    if (!subscription.features.includes(feature)) {
      throw new Error(
        `El plan ${subscription.plan_code} no incluye ${feature}; utiliza Control o Facturación`,
      );
    }
  }

  const versions = (await runner.query(
    `SELECT COALESCE(MAX(version), 0)::int AS version
     FROM public.tenant_schema_versions WHERE company_id = $1`,
    [company.id],
  )) as Array<{ version: number }>;
  if (Number(versions[0]?.version ?? 0) < TENANT_BASE_VERSION) {
    throw new Error(
      `El schema de pruebas debe estar migrado a la versión ${TENANT_BASE_VERSION} antes de cargar datos`,
    );
  }

  const actors = (await runner.query(
    `SELECT id, full_name
     FROM public.users
     WHERE company_id = $1 AND role = 'company_admin' AND is_active = TRUE
     ORDER BY created_at, id
     LIMIT 1`,
    [company.id],
  )) as ActorRow[];
  const actor = actors[0];
  if (!actor) throw new Error('La compañía pruebas necesita un Administrador principal activo');
  return { company, subscription, actor };
}

async function demoState(runner: QueryRunner, schema: string): Promise<DemoState> {
  const rows = (await runner.query(
    `SELECT
       (SELECT COUNT(*)::int FROM ${schema}.customers
        WHERE notes LIKE $1) AS customer_count,
       (SELECT COUNT(*)::int FROM ${schema}.orders
        WHERE external_folio = ANY($2::varchar[])) AS order_count,
       (SELECT COUNT(*)::int FROM ${schema}.expenses
        WHERE reference = ANY($3::varchar[])) AS expense_count`,
    [
      `%[demo:${PRUEBAS_DEMO_DATASET.version}:customer:%`,
      PRUEBAS_DEMO_DATASET.orders.map(({ externalFolio }) => externalFolio),
      PRUEBAS_DEMO_DATASET.expenses.map(({ reference }) => reference),
    ],
  )) as Array<{
    customer_count: number;
    order_count: number;
    expense_count: number;
  }>;
  return {
    customerCount: Number(rows[0]?.customer_count ?? 0),
    orderCount: Number(rows[0]?.order_count ?? 0),
    expenseCount: Number(rows[0]?.expense_count ?? 0),
  };
}

function isComplete(state: DemoState): boolean {
  return (
    state.customerCount === PRUEBAS_DEMO_DATASET.customers.length &&
    state.orderCount === PRUEBAS_DEMO_DATASET.orders.length &&
    state.expenseCount === PRUEBAS_DEMO_DATASET.expenses.length
  );
}

function assertCleanOrComplete(state: DemoState): void {
  if (isComplete(state)) return;
  if (state.customerCount === 0 && state.orderCount === 0 && state.expenseCount === 0) return;
  throw new Error(
    'Se detectó una carga demostrativa parcial. No se insertó nada; revisa los marcadores antes de reintentar.',
  );
}

async function assertNoCustomerCollisions(runner: QueryRunner, schema: string): Promise<void> {
  const rows = (await runner.query(
    `SELECT COUNT(*)::int AS count
     FROM ${schema}.customers
     WHERE display_name = ANY($1::varchar[]) OR phone = ANY($2::varchar[])`,
    [
      PRUEBAS_DEMO_DATASET.customers.map(({ displayName }) => displayName),
      PRUEBAS_DEMO_DATASET.customers.map(({ phone }) => phone),
    ],
  )) as Array<{ count: number }>;
  if (Number(rows[0]?.count ?? 0) > 0) {
    throw new Error(
      'Ya existen clientes con nombres o teléfonos reservados para la demostración; no se crearán duplicados.',
    );
  }
}

async function resolveVehicleCatalog(
  runner: QueryRunner,
  actorId: string,
): Promise<Map<string, { brandId: string; modelId: string }>> {
  const resolved = new Map<string, { brandId: string; modelId: string }>();
  for (const vehicle of PRUEBAS_DEMO_DATASET.vehicles) {
    const catalogKey = `${vehicle.brand}\u0000${vehicle.model}`;
    if (resolved.has(catalogKey)) continue;
    let brands = (await runner.query(
      `SELECT id, is_active FROM public.vehicle_brands WHERE name = $1`,
      [vehicle.brand],
    )) as Array<IdentifierRow & { is_active: boolean }>;
    if (brands[0] && !brands[0].is_active) {
      throw new Error(`La marca ${vehicle.brand} existe, pero está desactivada`);
    }
    if (!brands[0]) {
      brands = (await runner.query(
        `INSERT INTO public.vehicle_brands(name, created_by_user_id, updated_by_user_id)
         VALUES ($1, $2, $2) RETURNING id, is_active`,
        [vehicle.brand, actorId],
      )) as Array<IdentifierRow & { is_active: boolean }>;
    }
    const brandId = brands[0]!.id;
    let models = (await runner.query(
      `SELECT id, is_active FROM public.vehicle_models WHERE brand_id = $1 AND name = $2`,
      [brandId, vehicle.model],
    )) as Array<IdentifierRow & { is_active: boolean }>;
    if (models[0] && !models[0].is_active) {
      throw new Error(`El modelo ${vehicle.brand} ${vehicle.model} existe, pero está desactivado`);
    }
    if (!models[0]) {
      models = (await runner.query(
        `INSERT INTO public.vehicle_models(
           brand_id, name, created_by_user_id, updated_by_user_id
         ) VALUES ($1, $2, $3, $3) RETURNING id, is_active`,
        [brandId, vehicle.model, actorId],
      )) as Array<IdentifierRow & { is_active: boolean }>;
    }
    resolved.set(catalogKey, { brandId, modelId: models[0]!.id });
  }
  return resolved;
}

async function insertCustomers(
  runner: QueryRunner,
  schema: string,
  actorId: string,
): Promise<Map<string, string>> {
  const ids = new Map<string, string>();
  for (const customer of PRUEBAS_DEMO_DATASET.customers) {
    const rows = (await runner.query(
      `INSERT INTO ${schema}.customers(
         customer_type, display_name, legal_name, contact_name, tax_id,
         fiscal_name, fiscal_postal_code, fiscal_regime_code, preferred_cfdi_use_code,
         email, phone, notes, created_by_user_id, updated_by_user_id, created_at, updated_at
       ) VALUES ($1, $2, $3, $4, NULL, NULL, NULL, NULL, NULL, $5, $6, $7, $8, $8, $9, $9)
       RETURNING id`,
      [
        customer.type,
        customer.displayName,
        customer.legalName,
        customer.contactName,
        customer.email,
        customer.phone,
        `${customer.notes}\n${marker('customer', customer.key)}`,
        actorId,
        DEMO_CREATED_AT,
      ],
    )) as IdentifierRow[];
    ids.set(customer.key, rows[0]!.id);
  }
  return ids;
}

async function insertVehicles(
  runner: QueryRunner,
  schema: string,
  actorId: string,
  customerIds: Map<string, string>,
  catalog: Map<string, { brandId: string; modelId: string }>,
): Promise<Map<string, string>> {
  const ids = new Map<string, string>();
  for (const vehicle of PRUEBAS_DEMO_DATASET.vehicles) {
    const customerId = customerIds.get(vehicle.customerKey)!;
    const catalogEntry = catalog.get(`${vehicle.brand}\u0000${vehicle.model}`)!;
    const rows = (await runner.query(
      `INSERT INTO ${schema}.vehicles(
         customer_id, brand_id, model_id, serial_number, license_plate, model_year, color,
         created_by_user_id, updated_by_user_id, created_at, updated_at
       ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $8, $9, $9)
       RETURNING id`,
      [
        customerId,
        catalogEntry.brandId,
        catalogEntry.modelId,
        vehicle.numeroSerie,
        vehicle.licensePlate,
        vehicle.year,
        vehicle.color,
        actorId,
        DEMO_CREATED_AT,
      ],
    )) as IdentifierRow[];
    ids.set(vehicle.key, rows[0]!.id);
  }
  return ids;
}

async function insertOrders(
  runner: QueryRunner,
  schema: string,
  actorId: string,
  customerIds: Map<string, string>,
  vehicleIds: Map<string, string>,
): Promise<void> {
  for (const order of PRUEBAS_DEMO_DATASET.orders) {
    const orderTotal = amount(order);
    const orderCost = cost(order);
    const updatedAt = order.closedAt ?? order.openedAt;
    const rows = (await runner.query(
      `INSERT INTO ${schema}.orders(
         external_folio, customer_id, vehicle_id, status, opened_at, closed_at,
         subtotal, tax, total, is_paid, paid_at, total_cost, gross_profit,
         inventory_applied_at, created_by_user_id, updated_by_user_id, created_at, updated_at
       ) VALUES (
         $1, $2, $3, $4, $5, $6,
         $7, 0, $7, $8, $9, $10, $11,
         NULL, $12, $12, $5, $13
       ) RETURNING id`,
      [
        order.externalFolio,
        customerIds.get(order.customerKey),
        vehicleIds.get(order.vehicleKey),
        order.status,
        order.openedAt,
        order.closedAt,
        orderTotal.toFixed(2),
        order.isPaid,
        order.paidAt,
        orderCost.toFixed(2),
        (orderTotal - orderCost).toFixed(2),
        actorId,
        updatedAt,
      ],
    )) as IdentifierRow[];
    const orderId = rows[0]!.id;
    for (const [position, item] of order.items.entries()) {
      await runner.query(
        `INSERT INTO ${schema}.order_items(
           order_id, product_service_id, kind, description, quantity, unit_price, total,
           affects_order_total, unit_name, unit_symbol, unit_cost, cost_total,
           tracks_inventory, position, created_at
         ) VALUES ($1, NULL, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, FALSE, $12, $13)`,
        [
          orderId,
          item.kind,
          item.description,
          item.quantity.toFixed(3),
          item.unitPrice === null ? null : item.unitPrice.toFixed(2),
          itemAmount(item).toFixed(2),
          item.affectsOrderTotal,
          item.kind === 'service' ? 'Servicio' : 'Unidad',
          item.kind === 'service' ? 'serv' : 'u',
          item.unitCost === null ? null : item.unitCost.toFixed(2),
          itemCost(item)?.toFixed(2) ?? null,
          position + 1,
          order.openedAt,
        ],
      );
    }
    await runner.query(
      `INSERT INTO ${schema}.order_status_history(
         order_id, previous_status, new_status, changed_by_user_id, changed_at
       ) VALUES ($1, NULL, 'in_progress', $2, $3)`,
      [orderId, actorId, order.openedAt],
    );
    if (order.status === 'completed') {
      await runner.query(
        `INSERT INTO ${schema}.order_status_history(
           order_id, previous_status, new_status, changed_by_user_id, changed_at
         ) VALUES ($1, 'in_progress', 'completed', $2, $3)`,
        [orderId, actorId, order.closedAt],
      );
    }
    for (const note of order.notes) {
      await runner.query(
        `INSERT INTO ${schema}.order_notes(order_id, body, created_by_user_id, created_at)
         VALUES ($1, $2, $3, $4)`,
        [orderId, note, actorId, updatedAt],
      );
    }
  }
}

async function insertExpenses(runner: QueryRunner, schema: string, actorId: string): Promise<void> {
  const categories = (await runner.query(
    `SELECT id, code FROM ${schema}.expense_categories
     WHERE is_active = TRUE AND code = ANY($1::varchar[])`,
    [[...new Set(PRUEBAS_DEMO_DATASET.expenses.map(({ categoryCode }) => categoryCode))]],
  )) as Array<IdentifierRow & { code: string }>;
  const categoryIds = new Map(categories.map(({ id, code }) => [code, id]));
  for (const expense of PRUEBAS_DEMO_DATASET.expenses) {
    if (!categoryIds.has(expense.categoryCode)) {
      throw new Error(`No existe la categoría activa ${expense.categoryCode}`);
    }
  }
  const suppliers = (await runner.query(
    `SELECT id FROM ${schema}.suppliers WHERE is_system = TRUE AND is_active = TRUE`,
  )) as IdentifierRow[];
  if (suppliers.length !== 1) throw new Error('Debe existir exactamente un Proveedor general');
  const supplierId = suppliers[0]!.id;

  for (const expense of PRUEBAS_DEMO_DATASET.expenses) {
    const eventAt = `${expense.occurredOn}T12:00:00-07:00`;
    const rows = (await runner.query(
      `INSERT INTO ${schema}.expenses(
         category_id, description, amount, occurred_on, supplier_id, reference, notes,
         status, recurrence_type, confirmed_at, cancelled_at,
         created_by_user_id, updated_by_user_id, created_at, updated_at
       ) VALUES (
         $1, $2, $3, $4, $5, $6, $7,
         'confirmed', $8, $9, NULL,
         $10, $10, $9, $9
       ) RETURNING id`,
      [
        categoryIds.get(expense.categoryCode),
        expense.description,
        expense.amount.toFixed(2),
        expense.occurredOn,
        supplierId,
        expense.reference,
        expense.notes,
        expense.recurrenceType,
        eventAt,
        actorId,
      ],
    )) as IdentifierRow[];
    await runner.query(
      `INSERT INTO ${schema}.expense_status_history(
         expense_id, previous_status, new_status, changed_by_user_id, changed_at
       ) VALUES ($1, NULL, 'confirmed', $2, $3)`,
      [rows[0]!.id, actorId, eventAt],
    );
  }
}

function result(
  status: DemoLoadResult['status'],
  context: { company: CompanyRow; subscription: SubscriptionRow; actor: ActorRow },
): DemoLoadResult {
  return {
    status,
    companyId: context.company.id,
    companyName: context.company.name,
    schemaName: context.company.schema_name,
    planCode: context.subscription.plan_code,
    actorName: context.actor.full_name,
    customers: PRUEBAS_DEMO_DATASET.customers.length,
    vehicles: PRUEBAS_DEMO_DATASET.vehicles.length,
    orders: PRUEBAS_DEMO_DATASET.orders.length,
    expenses: PRUEBAS_DEMO_DATASET.expenses.length,
  };
}

export async function loadPruebasDemo(
  options: DemoLoadOptions,
  dataSource: DataSource = publicDataSource,
): Promise<DemoLoadResult> {
  assertDemoLoadAuthorization(options);
  const ownsConnection = !dataSource.isInitialized;
  if (ownsConnection) await dataSource.initialize();
  const runner = dataSource.createQueryRunner();
  await runner.connect();
  try {
    if (options.apply) await runner.startTransaction('SERIALIZABLE');
    if (options.apply) {
      await runner.query(`SELECT pg_advisory_xact_lock(hashtext($1))`, [
        `taller-demo:${TARGET_COMPANY}`,
      ]);
    }
    const context = await companyContext(runner, options.apply);
    const schema = quoteIdentifier(context.company.schema_name);
    const state = await demoState(runner, schema);
    assertCleanOrComplete(state);
    if (isComplete(state)) {
      if (runner.isTransactionActive) await runner.commitTransaction();
      return result('already_loaded', context);
    }
    await assertNoCustomerCollisions(runner, schema);
    if (!options.apply) return result('preview', context);

    const catalog = await resolveVehicleCatalog(runner, context.actor.id);
    const customerIds = await insertCustomers(runner, schema, context.actor.id);
    const vehicleIds = await insertVehicles(runner, schema, context.actor.id, customerIds, catalog);
    await insertOrders(runner, schema, context.actor.id, customerIds, vehicleIds);
    await insertExpenses(runner, schema, context.actor.id);
    const finalState = await demoState(runner, schema);
    if (!isComplete(finalState)) throw new Error('La carga no produjo el conjunto completo');
    await runner.commitTransaction();
    return result('loaded', context);
  } catch (error: unknown) {
    if (runner.isTransactionActive) await runner.rollbackTransaction();
    throw error;
  } finally {
    await runner.release();
    if (ownsConnection && dataSource.isInitialized) await dataSource.destroy();
  }
}

function argument(name: string): string | undefined {
  return process.argv.find((value) => value.startsWith(`${name}=`))?.slice(name.length + 1);
}

async function main(): Promise<void> {
  const apply = process.argv.includes('--apply');
  const loaded = await loadPruebasDemo({
    apply,
    confirmation: argument('--confirm'),
    productionConfirmation: argument('--production-confirm'),
    databaseUrl: process.env.DATABASE_URL,
    environment: process.env.NODE_ENV,
  });
  const action =
    loaded.status === 'preview'
      ? 'Previsualización correcta; no se insertaron datos.'
      : loaded.status === 'already_loaded'
        ? 'La demostración ya estaba completa; no se duplicaron datos.'
        : 'Datos demostrativos cargados correctamente.';
  process.stdout.write(
    `${action}\n` +
      `Compañía: ${loaded.companyName} (${TARGET_COMPANY})\n` +
      `Plan: ${loaded.planCode}. Autor: ${loaded.actorName}.\n` +
      `${loaded.customers} clientes, ${loaded.vehicles} vehículos, ${loaded.orders} órdenes y ${loaded.expenses} gastos.\n`,
  );
}

if (require.main === module) {
  void main().catch((error: unknown) => {
    process.stderr.write(
      `${error instanceof Error ? error.message : 'Falló la carga demostrativa'}\n`,
    );
    process.exitCode = 1;
  });
}
