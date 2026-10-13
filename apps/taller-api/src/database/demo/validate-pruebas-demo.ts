import 'dotenv/config';
import { Workbook } from 'exceljs';
import { DataSource } from 'typeorm';
import { AuthenticatedUser } from '../../common/types/authenticated-user';
import { DashboardService } from '../../tenant/dashboard/dashboard.service';
import { ProfitabilityService } from '../../tenant/profitability/profitability.service';
import { ProfitabilityWorkbookService } from '../../tenant/profitability/profitability-workbook.service';
import { TenantSessionService } from '../../tenant/tenant-session.service';
import { PermissionsService } from '../../permissions/permissions.service';
import { PlatformRole } from '../../platform-users/entities/platform-user.entity';
import { SubscriptionsService } from '../../subscriptions/subscriptions.service';
import { quoteIdentifier } from '../schema-name';
import publicDataSource from '../public-data-source';
import { DemoOrder, PRUEBAS_DEMO_DATASET } from './pruebas-demo.dataset';

interface CompanyRow {
  id: string;
  name: string;
  schema_name: string;
  login_code: string;
}

interface UserRow {
  id: string;
  email: string | null;
  username: string | null;
  phone: string | null;
  phone_verified_at: Date | null;
  full_name: string;
  role: PlatformRole;
  must_change_password: boolean;
}

interface CustomerValidationRow {
  display_name: string;
  customer_type: 'person' | 'company';
  vehicle_count: number;
  order_count: number;
}

interface OrderValidationRow {
  external_folio: string;
  customer_name: string;
  vehicle_brand: string;
  vehicle_model: string;
  status: 'in_progress' | 'completed';
  is_paid: boolean;
  opened_at: string;
  closed_at: string | null;
  paid_at: string | null;
  total: string;
  total_cost: string;
  gross_profit: string;
  item_count: number;
  catalog_item_count: number;
  unknown_product_cost_count: number;
  status_event_count: number;
}

interface ExpenseValidationRow {
  reference: string;
  category_code: string;
  occurred_on: string;
  amount: string;
  status: string;
  recurrence_type: string;
}

export interface DemoValidationResult {
  companyName: string;
  schemaName: string;
  customers: number;
  vehicles: number;
  orders: number;
  expenses: number;
  dashboard: {
    inProgress: number;
    unpaid: number;
    completedPending: number;
    completedPaid: number;
    generated: string;
    collected: string;
    outstanding: string;
    receivable: string;
    directCost: string;
    operatingExpenses: string;
    operatingProfit: string;
  };
  months: Array<{
    period: string;
    completed: number;
    paid: number;
    pending: number;
    generated: string;
    collected: string;
    outstanding: string;
    directCost: string;
    expenses: string;
    netProfit: string;
    workbookBytes: number;
    additionalCompletedOrders: number;
    additionalExpenses: number;
  }>;
  otherCompaniesChecked: number;
}

const TARGET_CODE = PRUEBAS_DEMO_DATASET.targetCompanyLoginCode;
const CUSTOMER_MARKER = `%[demo:${PRUEBAS_DEMO_DATASET.version}:customer:%`;
const ORDER_FOLIOS = PRUEBAS_DEMO_DATASET.orders.map(({ externalFolio }) => externalFolio);
const EXPENSE_REFERENCES = PRUEBAS_DEMO_DATASET.expenses.map(({ reference }) => reference);

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

function assertEqual<T>(actual: T, expected: T, label: string): void {
  if (actual !== expected) {
    throw new Error(`${label}: se esperaba ${String(expected)} y se obtuvo ${String(actual)}`);
  }
}

function money(value: number): string {
  return value.toFixed(2);
}

function catalogName(value: string): string {
  return value.trim().toLocaleLowerCase('es-MX');
}

function slug(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

function orderTotal(order: DemoOrder): number {
  return order.items.reduce(
    (total, item) =>
      total + (item.affectsOrderTotal ? item.quantity * (item.unitPrice ?? 0) : 0),
    0,
  );
}

function orderCost(order: DemoOrder): number {
  return order.items.reduce((total, item) => total + item.quantity * (item.unitCost ?? 0), 0);
}

function localTimestamp(value: string | null): string | null {
  if (!value) return null;
  return value.slice(0, 19);
}

async function resolveContext(dataSource: DataSource): Promise<{
  company: CompanyRow;
  user: AuthenticatedUser;
}> {
  const companies = await dataSource.query<CompanyRow[]>(
    `SELECT id, name, schema_name, login_code
     FROM public.companies WHERE login_code = $1 AND is_active = TRUE`,
    [TARGET_CODE],
  );
  assertEqual(companies.length, 1, `Compañía activa con código ${TARGET_CODE}`);
  const company = companies[0]!;
  const users = await dataSource.query<UserRow[]>(
    `SELECT id, email, username, phone, phone_verified_at, full_name, role,
            must_change_password
     FROM public.users
     WHERE company_id = $1 AND role = 'company_admin' AND is_active = TRUE
     ORDER BY created_at, id LIMIT 1`,
    [company.id],
  );
  const actor = users[0];
  assert(actor, 'La compañía pruebas no tiene un Administrador principal activo');
  const subscriptions = new SubscriptionsService(dataSource);
  const permissions = new PermissionsService(dataSource);
  const subscription = await subscriptions.getByCompanyId(company.id);
  subscriptions.assertUsable(subscription);
  return {
    company,
    user: {
      id: actor.id,
      email: actor.email,
      username: actor.username,
      loginName: actor.username ? `${actor.username}@${company.login_code}` : (actor.email ?? ''),
      phone: actor.phone,
      phoneVerifiedAt: actor.phone_verified_at,
      fullName: actor.full_name,
      role: actor.role,
      companyId: company.id,
      companyName: company.name,
      companySchema: company.schema_name,
      companyLoginCode: company.login_code,
      mustChangePassword: actor.must_change_password,
      sessionId: 'demo-read-only-validation',
      subscription,
      permissions: await permissions.forUser(actor.id, actor.role),
    },
  };
}

async function validateCustomersAndVehicles(
  dataSource: DataSource,
  schema: string,
): Promise<void> {
  const rows = await dataSource.query<CustomerValidationRow[]>(
    `SELECT customer.display_name, customer.customer_type,
            count(DISTINCT vehicle.id)::int AS vehicle_count,
            count(DISTINCT service_order.id)::int AS order_count
     FROM ${schema}.customers customer
     LEFT JOIN ${schema}.vehicles vehicle ON vehicle.customer_id = customer.id
     LEFT JOIN ${schema}.orders service_order ON service_order.customer_id = customer.id
       AND service_order.external_folio = ANY($2::varchar[])
     WHERE customer.notes LIKE $1
     GROUP BY customer.id, customer.display_name, customer.customer_type`,
    [CUSTOMER_MARKER, ORDER_FOLIOS],
  );
  assertEqual(rows.length, PRUEBAS_DEMO_DATASET.customers.length, 'Clientes demostrativos');
  const actualByName = new Map(rows.map((row) => [row.display_name, row]));
  for (const customer of PRUEBAS_DEMO_DATASET.customers) {
    const actual = actualByName.get(customer.displayName);
    assert(actual, `No se encontró el cliente ${customer.displayName}`);
    assertEqual(actual.customer_type, customer.type, `Tipo de ${customer.displayName}`);
    const vehicleCount = PRUEBAS_DEMO_DATASET.vehicles.filter(
      ({ customerKey }) => customerKey === customer.key,
    ).length;
    const orderCount = PRUEBAS_DEMO_DATASET.orders.filter(
      ({ customerKey }) => customerKey === customer.key,
    ).length;
    assertEqual(actual.vehicle_count, vehicleCount, `Vehículos de ${customer.displayName}`);
    assertEqual(actual.order_count, orderCount, `Órdenes de ${customer.displayName}`);
    assert(vehicleCount >= 1 && vehicleCount <= 3, `${customer.displayName} debe tener de 1 a 3 vehículos`);
    assert(orderCount >= 1 && orderCount <= 2, `${customer.displayName} debe tener 1 o 2 órdenes`);
  }
}

async function validateOrders(dataSource: DataSource, schema: string): Promise<void> {
  const rows = await dataSource.query<OrderValidationRow[]>(
    `SELECT service_order.external_folio, customer.display_name AS customer_name,
            brand.name AS vehicle_brand, model.name AS vehicle_model,
            service_order.status, service_order.is_paid,
            to_char(service_order.opened_at AT TIME ZONE $2, 'YYYY-MM-DD"T"HH24:MI:SS') AS opened_at,
            CASE WHEN service_order.closed_at IS NULL THEN NULL ELSE
              to_char(service_order.closed_at AT TIME ZONE $2, 'YYYY-MM-DD"T"HH24:MI:SS') END AS closed_at,
            CASE WHEN service_order.paid_at IS NULL THEN NULL ELSE
              to_char(service_order.paid_at AT TIME ZONE $2, 'YYYY-MM-DD"T"HH24:MI:SS') END AS paid_at,
            service_order.total::numeric(14,2)::text,
            service_order.total_cost::numeric(14,2)::text,
            service_order.gross_profit::numeric(14,2)::text,
            count(DISTINCT item.id)::int AS item_count,
            count(DISTINCT item.id) FILTER (WHERE item.product_service_id IS NOT NULL)::int
              AS catalog_item_count,
            count(DISTINCT item.id) FILTER (
              WHERE item.kind = 'product' AND item.unit_cost IS NULL
            )::int AS unknown_product_cost_count,
            count(DISTINCT history.id)::int AS status_event_count
     FROM ${schema}.orders service_order
     JOIN ${schema}.customers customer ON customer.id = service_order.customer_id
     JOIN ${schema}.vehicles vehicle ON vehicle.id = service_order.vehicle_id
       AND vehicle.customer_id = service_order.customer_id
     JOIN public.vehicle_brands brand ON brand.id = vehicle.brand_id
     JOIN public.vehicle_models model ON model.id = vehicle.model_id
     LEFT JOIN ${schema}.order_items item ON item.order_id = service_order.id
     LEFT JOIN ${schema}.order_status_history history ON history.order_id = service_order.id
     WHERE service_order.external_folio = ANY($1::varchar[])
     GROUP BY service_order.id, customer.display_name, brand.name, model.name`,
    [ORDER_FOLIOS, PRUEBAS_DEMO_DATASET.timezone],
  );
  assertEqual(rows.length, PRUEBAS_DEMO_DATASET.orders.length, 'Órdenes demostrativas');
  const actualByFolio = new Map(rows.map((row) => [row.external_folio, row]));
  for (const expected of PRUEBAS_DEMO_DATASET.orders) {
    const actual = actualByFolio.get(expected.externalFolio);
    assert(actual, `No se encontró la orden ${expected.externalFolio}`);
    const customer = PRUEBAS_DEMO_DATASET.customers.find(({ key }) => key === expected.customerKey)!;
    const vehicle = PRUEBAS_DEMO_DATASET.vehicles.find(({ key }) => key === expected.vehicleKey)!;
    const expectedCost = orderCost(expected);
    assertEqual(actual.customer_name, customer.displayName, `Cliente de ${expected.externalFolio}`);
    assertEqual(
      catalogName(actual.vehicle_brand),
      catalogName(vehicle.brand),
      `Marca de ${expected.externalFolio}`,
    );
    assertEqual(
      catalogName(actual.vehicle_model),
      catalogName(vehicle.model),
      `Modelo de ${expected.externalFolio}`,
    );
    assertEqual(actual.status, expected.status, `Estatus de ${expected.externalFolio}`);
    assertEqual(actual.is_paid, expected.isPaid, `Pago de ${expected.externalFolio}`);
    assertEqual(actual.opened_at, localTimestamp(expected.openedAt), `Apertura de ${expected.externalFolio}`);
    assertEqual(actual.closed_at, localTimestamp(expected.closedAt), `Terminación de ${expected.externalFolio}`);
    assertEqual(actual.paid_at, localTimestamp(expected.paidAt), `Pago fechado de ${expected.externalFolio}`);
    assertEqual(actual.total, money(orderTotal(expected)), `Total de ${expected.externalFolio}`);
    assertEqual(actual.total_cost, money(expectedCost), `Costo de ${expected.externalFolio}`);
    assertEqual(
      actual.gross_profit,
      money(orderTotal(expected) - expectedCost),
      `Utilidad de ${expected.externalFolio}`,
    );
    assertEqual(actual.item_count, expected.items.length, `Conceptos de ${expected.externalFolio}`);
    assertEqual(actual.catalog_item_count, 0, `Conceptos de catálogo de ${expected.externalFolio}`);
    assertEqual(actual.unknown_product_cost_count, 0, `Productos sin costo de ${expected.externalFolio}`);
    assertEqual(
      actual.status_event_count,
      expected.status === 'completed' ? 2 : 1,
      `Historial de estatus de ${expected.externalFolio}`,
    );
  }
}

async function validateExpenses(dataSource: DataSource, schema: string): Promise<void> {
  const rows = await dataSource.query<ExpenseValidationRow[]>(
    `SELECT expense.reference, category.code AS category_code, expense.occurred_on::text,
            expense.amount::numeric(14,2)::text, expense.status, expense.recurrence_type
     FROM ${schema}.expenses expense
     JOIN ${schema}.expense_categories category ON category.id = expense.category_id
     WHERE expense.reference = ANY($1::varchar[])
     ORDER BY expense.occurred_on, expense.reference`,
    [EXPENSE_REFERENCES],
  );
  assertEqual(rows.length, PRUEBAS_DEMO_DATASET.expenses.length, 'Gastos demostrativos');
  const actualByReference = new Map(rows.map((row) => [row.reference, row]));
  for (const expected of PRUEBAS_DEMO_DATASET.expenses) {
    const actual = actualByReference.get(expected.reference);
    assert(actual, `No se encontró el gasto ${expected.reference}`);
    assertEqual(actual.category_code, expected.categoryCode, `Categoría de ${expected.reference}`);
    assertEqual(actual.occurred_on, expected.occurredOn, `Fecha de ${expected.reference}`);
    assertEqual(actual.amount, money(expected.amount), `Importe de ${expected.reference}`);
    assertEqual(actual.status, 'confirmed', `Estatus de ${expected.reference}`);
    assertEqual(actual.recurrence_type, expected.recurrenceType, `Recurrencia de ${expected.reference}`);
  }
}

async function validateOtherCompanies(
  dataSource: DataSource,
  targetCompanyId: string,
): Promise<number> {
  const companies = await dataSource.query<CompanyRow[]>(
    `SELECT id, name, schema_name, login_code FROM public.companies WHERE id <> $1`,
    [targetCompanyId],
  );
  for (const company of companies) {
    const schema = quoteIdentifier(company.schema_name);
    const rows = await dataSource.query<
      Array<{ customer_count: number; order_count: number; expense_count: number }>
    >(
      `SELECT
         (SELECT count(*)::int FROM ${schema}.customers WHERE notes LIKE $1) AS customer_count,
         (SELECT count(*)::int FROM ${schema}.orders
          WHERE external_folio = ANY($2::varchar[])) AS order_count,
         (SELECT count(*)::int FROM ${schema}.expenses
          WHERE reference = ANY($3::varchar[])) AS expense_count`,
      [CUSTOMER_MARKER, ORDER_FOLIOS, EXPENSE_REFERENCES],
    );
    const counts = rows[0]!;
    assertEqual(counts.customer_count, 0, `Clientes demo en ${company.login_code}`);
    assertEqual(counts.order_count, 0, `Órdenes demo en ${company.login_code}`);
    assertEqual(counts.expense_count, 0, `Gastos demo en ${company.login_code}`);
  }
  return companies.length;
}

async function validateWorkbook(
  report: Awaited<ReturnType<ProfitabilityService['monthlyReport']>>,
  companyName: string,
  expectedExternalFolios: string[],
): Promise<number> {
  const file = await new ProfitabilityWorkbookService().build(report, companyName);
  assert(file.buffer.length > 0, `El Excel de ${report.label} está vacío`);
  assertEqual(
    file.filename,
    `reporte-ordenes-utilidad-${slug(report.label)}.xlsx`,
    `Archivo de ${report.label}`,
  );
  const workbook = new Workbook();
  await workbook.xlsx.load(Uint8Array.from(file.buffer).buffer);
  const summary = workbook.getWorksheet(`Resumen ${report.label}`);
  const orders = workbook.getWorksheet(`Órdenes ${report.label}`);
  assert(summary, `Falta la pestaña Resumen ${report.label}`);
  assert(orders, `Falta la pestaña Órdenes ${report.label}`);
  assertEqual(workbook.worksheets.length, 2, `Pestañas de ${report.label}`);
  assertEqual(summary.getCell('B6').value, Number(report.summary.generatedIncome), `Ingreso en Excel ${report.label}`);
  assertEqual(summary.getCell('D6').value, Number(report.summary.collectedIncome), `Cobrado en Excel ${report.label}`);
  assertEqual(summary.getCell('F6').value, Number(report.summary.outstandingIncome), `Pendiente en Excel ${report.label}`);
  assertEqual(summary.getCell('H6').value, Number(report.summary.directCost), `Costo en Excel ${report.label}`);
  assertEqual(summary.getCell('D7').value, Number(report.summary.operatingExpenses), `Gastos en Excel ${report.label}`);
  assertEqual(summary.getCell('F7').value, Number(report.summary.netProfit), `Utilidad neta en Excel ${report.label}`);
  assertEqual(orders.rowCount, 5 + report.orders.length, `Filas de órdenes en Excel ${report.label}`);
  assertEqual(orders.views[0]?.state, 'frozen', `Encabezado congelado de ${report.label}`);
  const exportedFolios = new Set<string>();
  for (let rowNumber = 6; rowNumber <= orders.rowCount; rowNumber += 1) {
    const externalFolio = orders.getCell(`B${rowNumber}`).value;
    if (typeof externalFolio === 'string' && externalFolio) exportedFolios.add(externalFolio);
  }
  for (const externalFolio of expectedExternalFolios) {
    assert(exportedFolios.has(externalFolio), `Falta ${externalFolio} en el Excel`);
  }
  return file.buffer.length;
}

async function additionalMonthlyRecords(
  dataSource: DataSource,
  schema: string,
  year: number,
  month: number,
  timezone: string,
): Promise<{ completedOrders: number; expenses: number }> {
  const rows = await dataSource.query<Array<{ completed_orders: number; expenses: number }>>(
    `WITH period AS (
       SELECT make_date($1, $2, 1) AS starts_on,
              (make_date($1, $2, 1) + interval '1 month')::date AS ends_on
     )
     SELECT
       (SELECT count(*)::int FROM ${schema}.orders service_order, period
        WHERE service_order.status = 'completed'
          AND service_order.closed_at >= period.starts_on::timestamp AT TIME ZONE $3
          AND service_order.closed_at < period.ends_on::timestamp AT TIME ZONE $3
          AND (service_order.external_folio IS NULL
            OR service_order.external_folio <> ALL($4::varchar[]))) AS completed_orders,
       (SELECT count(*)::int FROM ${schema}.expenses expense, period
        WHERE expense.status = 'confirmed'
          AND expense.occurred_on >= period.starts_on
          AND expense.occurred_on < period.ends_on
          AND (expense.reference IS NULL OR expense.reference <> ALL($5::varchar[]))) AS expenses`,
    [year, month, timezone, ORDER_FOLIOS, EXPENSE_REFERENCES],
  );
  return {
    completedOrders: Number(rows[0]?.completed_orders ?? 0),
    expenses: Number(rows[0]?.expenses ?? 0),
  };
}

export async function validatePruebasDemo(
  dataSource: DataSource = publicDataSource,
): Promise<DemoValidationResult> {
  const ownsConnection = !dataSource.isInitialized;
  if (ownsConnection) await dataSource.initialize();
  try {
    const { company, user } = await resolveContext(dataSource);
    const schema = quoteIdentifier(company.schema_name);
    await validateCustomersAndVehicles(dataSource, schema);
    await validateOrders(dataSource, schema);
    await validateExpenses(dataSource, schema);

    const tenant = new TenantSessionService(dataSource);
    const permissions = new PermissionsService(dataSource);
    const dashboardService = new DashboardService(tenant, permissions);
    const profitabilityService = new ProfitabilityService(tenant);
    const [dashboard, activity, analytics] = await Promise.all([
      dashboardService.summary(user),
      dashboardService.activity(user),
      profitabilityService.analytics(user, { months: 6, endingMonth: '2026-10' }),
    ]);
    assertEqual(dashboard.period.month, '2026-10', 'Periodo del tablero');
    assert(activity.oldestInProgress.length >= 3, 'El tablero no muestra las órdenes demo en proceso');
    assert(activity.pendingCollection.length > 0, 'El tablero no muestra pendientes de cobro');
    assert(activity.pendingCollection.length <= 5, 'El tablero excedió el límite de pendientes');
    assert(dashboard.financials, 'El plan de pruebas no expone utilidad en el tablero');
    assertEqual(analytics.series.length, 6, 'Meses en la gráfica histórica');

    const months: DemoValidationResult['months'] = [];
    for (const [period, expected] of Object.entries(PRUEBAS_DEMO_DATASET.expectedMonthlyResults)) {
      const year = Number(period.slice(0, 4));
      const month = Number(period.slice(5, 7));
      const report = await profitabilityService.monthlyReport(user, { year, month });
      const additional = await additionalMonthlyRecords(
        dataSource,
        schema,
        year,
        month,
        PRUEBAS_DEMO_DATASET.timezone,
      );
      if (additional.completedOrders === 0 && additional.expenses === 0) {
        assertEqual(report.summary.completedOrderCount, expected.completedOrderCount, `Órdenes terminadas ${period}`);
        assertEqual(report.summary.paidOrderCount, expected.paidOrderCount, `Órdenes pagadas ${period}`);
        assertEqual(
          report.summary.pendingOrderCount,
          expected.completedOrderCount - expected.paidOrderCount,
          `Órdenes pendientes ${period}`,
        );
        assertEqual(report.summary.generatedIncome, money(expected.generatedRevenue), `Ingreso ${period}`);
        assertEqual(report.summary.collectedIncome, money(expected.collectedRevenue), `Cobrado ${period}`);
        assertEqual(report.summary.outstandingIncome, money(expected.outstandingRevenue), `Pendiente ${period}`);
        assertEqual(report.summary.directCost, money(expected.directCost), `Costo directo ${period}`);
        assertEqual(report.summary.grossProfit, money(expected.grossProfit), `Utilidad bruta ${period}`);
        assertEqual(report.summary.operatingExpenses, money(expected.operatingExpenses), `Gastos ${period}`);
        assertEqual(report.summary.netProfit, money(expected.netProfit), `Utilidad neta ${period}`);
      } else {
        assert(
          report.summary.completedOrderCount >= expected.completedOrderCount,
          `Faltan órdenes demostrativas terminadas en ${period}`,
        );
      }
      if (additional.completedOrders === 0) {
        assertEqual(report.summary.incompleteCostOrderCount, 0, `Costos incompletos ${period}`);
      }
      assertEqual(report.orders.length, report.summary.completedOrderCount, `Detalle de órdenes ${period}`);

      const graphMonth = analytics.series.find((entry) => entry.period === period);
      assert(graphMonth, `La gráfica no contiene ${period}`);
      assertEqual(graphMonth.generatedIncome, report.summary.generatedIncome, `Ingreso en gráfica ${period}`);
      assertEqual(graphMonth.generatedDirectCost, report.summary.directCost, `Costo en gráfica ${period}`);
      assertEqual(graphMonth.operatingExpenses, report.summary.operatingExpenses, `Gastos en gráfica ${period}`);
      assertEqual(graphMonth.generatedNetProfit, report.summary.netProfit, `Utilidad en gráfica ${period}`);

      const expectedFolios = PRUEBAS_DEMO_DATASET.orders
        .filter((order) => order.status === 'completed' && order.closedAt?.startsWith(period))
        .map(({ externalFolio }) => externalFolio);

      months.push({
        period,
        completed: report.summary.completedOrderCount,
        paid: report.summary.paidOrderCount,
        pending: report.summary.pendingOrderCount,
        generated: report.summary.generatedIncome,
        collected: report.summary.collectedIncome,
        outstanding: report.summary.outstandingIncome,
        directCost: report.summary.directCost,
        expenses: report.summary.operatingExpenses,
        netProfit: report.summary.netProfit,
        workbookBytes: await validateWorkbook(report, company.name, expectedFolios),
        additionalCompletedOrders: additional.completedOrders,
        additionalExpenses: additional.expenses,
      });
    }

    const october = PRUEBAS_DEMO_DATASET.expectedMonthlyResults['2026-10'];
    assert(analytics.collection.paidOrderCount >= october.paidOrderCount, 'Faltan pagadas en dona de octubre');
    assert(
      analytics.collection.pendingOrderCount >= october.completedOrderCount - october.paidOrderCount,
      'Faltan pendientes en dona de octubre',
    );
    assertEqual(
      analytics.expensesByCategory.reduce((total, category) => total + Number(category.amount), 0),
      Number(analytics.summary.operatingExpenses),
      'Gastos en dona de octubre',
    );

    const otherCompaniesChecked = await validateOtherCompanies(dataSource, company.id);
    return {
      companyName: company.name,
      schemaName: company.schema_name,
      customers: PRUEBAS_DEMO_DATASET.customers.length,
      vehicles: PRUEBAS_DEMO_DATASET.vehicles.length,
      orders: PRUEBAS_DEMO_DATASET.orders.length,
      expenses: PRUEBAS_DEMO_DATASET.expenses.length,
      dashboard: {
        inProgress: dashboard.orders.inProgressCount,
        unpaid: dashboard.orders.unpaidCount,
        completedPending: dashboard.orders.completedUnpaidCount,
        completedPaid: dashboard.orders.completedPaidCount,
        generated: dashboard.revenue.generated,
        collected: dashboard.revenue.collected,
        outstanding: dashboard.revenue.outstanding,
        receivable: dashboard.revenue.receivable,
        directCost: dashboard.financials.directCost,
        operatingExpenses: dashboard.financials.operatingExpenses,
        operatingProfit: dashboard.financials.operatingProfit,
      },
      months,
      otherCompaniesChecked,
    };
  } finally {
    if (ownsConnection && dataSource.isInitialized) await dataSource.destroy();
  }
}

async function main(): Promise<void> {
  const result = await validatePruebasDemo();
  process.stdout.write(
    `Validación demostrativa correcta y de solo lectura.\n` +
      `Compañía: ${result.companyName} (${TARGET_CODE}). Schema: ${result.schemaName}.\n` +
      `${result.customers} clientes, ${result.vehicles} vehículos, ${result.orders} órdenes y ${result.expenses} gastos.\n` +
      `Tablero octubre: ${result.dashboard.inProgress} en proceso, ` +
      `${result.dashboard.completedPending} terminadas pendientes y ` +
      `${result.dashboard.completedPaid} terminadas pagadas.\n` +
      `Ingresos ${result.dashboard.generated}; cobrados ${result.dashboard.collected}; ` +
      `pendientes del mes ${result.dashboard.outstanding}; cartera total ` +
      `${result.dashboard.receivable} en ${result.dashboard.unpaid} orden(es); ` +
      `costo ${result.dashboard.directCost}; ` +
      `gastos ${result.dashboard.operatingExpenses}; utilidad operativa ${result.dashboard.operatingProfit}.\n` +
      result.months
        .map(
          (month) =>
            `${month.period}: ${month.completed} terminadas, ${month.paid} pagadas, ` +
            `${month.pending} pendientes; generado ${month.generated}, cobrado ` +
            `${month.collected}, pendiente ${month.outstanding}, costo ${month.directCost}, ` +
            `gastos ${month.expenses}, utilidad neta ${month.netProfit}; ` +
            `Excel ${month.workbookBytes} bytes` +
            (month.additionalCompletedOrders || month.additionalExpenses
              ? `; además existen ${month.additionalCompletedOrders} orden(es) terminada(s) y ` +
                `${month.additionalExpenses} gasto(s) ajenos a la carga demo.`
              : '.'),
        )
        .join('\n') +
      `\nAislamiento: ${result.otherCompaniesChecked} compañía(s) adicionales sin marcadores de la demostración.\n`,
  );
}

if (require.main === module) {
  void main().catch((error: unknown) => {
    process.stderr.write(
      `${error instanceof Error ? error.message : 'Falló la validación demostrativa'}\n`,
    );
    process.exitCode = 1;
  });
}
