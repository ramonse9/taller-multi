import * as argon2 from 'argon2';
import { DataSource } from 'typeorm';
import { quoteIdentifier } from '../schema-name';
import publicDataSource from '../public-data-source';
import { INVOICING_DEMO_DATASET, INVOICING_DEMO_ORDER_FOLIOS } from './invoicing-demo.dataset';

const TARGET = INVOICING_DEMO_DATASET.company.loginCode;
const LOCAL_HOSTS = new Set(['localhost', '127.0.0.1', '::1']);

interface CompanyRow {
  id: string;
  name: string;
  schema_name: string;
  plan_code: string;
  status: string;
}

interface UserRow {
  id: string;
  username: string;
  role: string;
  is_active: boolean;
  must_change_password: boolean;
  password_hash: string;
  template_code: string | null;
  is_customized: boolean | null;
  permissions: string[];
}

interface OrderRow {
  external_folio: string;
  status: string;
  is_paid: boolean;
  billing_status: string;
  payment_method_code: string | null;
  item_count: number;
  status_events: number;
  invoice_events: number;
}

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

function equalSet(actual: readonly string[], expected: readonly string[], label: string): void {
  const left = [...actual].sort();
  const right = [...expected].sort();
  assert(JSON.stringify(left) === JSON.stringify(right), `${label}: ${left.join(', ')}`);
}

function assertLocalDatabase(): void {
  const databaseUrl = process.env.DATABASE_URL?.trim();
  if (!databaseUrl) throw new Error('DATABASE_URL es obligatoria');
  const url = new URL(databaseUrl);
  assert(
    LOCAL_HOSTS.has(url.hostname) && process.env.NODE_ENV !== 'production',
    'La validación demostrativa solamente puede ejecutarse contra PostgreSQL local',
  );
}

async function company(dataSource: DataSource): Promise<CompanyRow> {
  const rows = await dataSource.query<CompanyRow[]>(
    `SELECT company.id,company.name,company.schema_name,
            subscription.plan_code,subscription.status
     FROM public.companies company
     JOIN public.company_subscriptions subscription ON subscription.company_id=company.id
     WHERE company.login_code=$1`,
    [TARGET],
  );
  assert(rows.length === 1, `Debe existir exactamente una compañía ${TARGET}`);
  assert(rows[0]!.name === INVOICING_DEMO_DATASET.company.name, 'Nombre de compañía inesperado');
  assert(rows[0]!.plan_code === 'invoicing', 'La compañía no tiene plan Facturación');
  assert(rows[0]!.status === 'active', 'La suscripción demostrativa no está activa');
  return rows[0]!;
}

async function users(dataSource: DataSource, companyId: string): Promise<UserRow[]> {
  return dataSource.query<UserRow[]>(
    `SELECT platform_user.id,platform_user.username::text,platform_user.role,
            platform_user.is_active,platform_user.must_change_password,
            platform_user.password_hash,profile.template_code,profile.is_customized,
            COALESCE(array_agg(permission.permission_code ORDER BY permission.permission_code)
              FILTER (WHERE permission.permission_code IS NOT NULL),'{}') AS permissions
     FROM public.users platform_user
     LEFT JOIN public.user_permission_profiles profile ON profile.user_id=platform_user.id
     LEFT JOIN public.user_permissions permission ON permission.user_id=platform_user.id
     WHERE platform_user.company_id=$1
       AND platform_user.username=ANY($2::citext[])
     GROUP BY platform_user.id,profile.template_code,profile.is_customized
     ORDER BY platform_user.username`,
    [companyId, ['operador', 'contabilidad']],
  );
}

async function verifyUsers(rows: UserRow[]): Promise<void> {
  assert(rows.length === 2, 'Deben existir los usuarios Operación y Contabilidad');
  const byName = new Map(rows.map((row) => [row.username, row]));
  const operator = byName.get('operador');
  const accounting = byName.get('contabilidad');
  assert(operator && accounting, 'No se encontraron ambos usuarios demostrativos');
  for (const user of rows) {
    assert(user.role === 'user', `${user.username} debe conservar el rol user`);
    assert(user.is_active, `${user.username} debe estar activo`);
    assert(
      !user.must_change_password,
      `${user.username} no debe interrumpir la demo con cambio de clave`,
    );
  }
  assert(
    operator.template_code === null && operator.is_customized === true,
    'Operación debe usar permisos personalizados',
  );
  equalSet(
    operator.permissions,
    INVOICING_DEMO_DATASET.users.operator.permissions,
    'Permisos de Operación',
  );
  assert(
    accounting.template_code === 'accounting' && accounting.is_customized === false,
    'Contabilidad debe utilizar la plantilla accounting sin personalización',
  );
  equalSet(
    accounting.permissions,
    INVOICING_DEMO_DATASET.users.accounting.permissions,
    'Permisos de Contabilidad',
  );
  const operatorPassword = process.env.DEMO_OPERATION_PASSWORD?.trim();
  const accountingPassword = process.env.DEMO_ACCOUNTING_PASSWORD?.trim();
  if (operatorPassword) {
    assert(
      await argon2.verify(operator.password_hash, operatorPassword),
      'La contraseña local de Operación no coincide',
    );
  }
  if (accountingPassword) {
    assert(
      await argon2.verify(accounting.password_hash, accountingPassword),
      'La contraseña local de Contabilidad no coincide',
    );
  }
}

async function verifyIssuer(dataSource: DataSource, schema: string): Promise<void> {
  const rows = await dataSource.query<Array<Record<string, unknown>>>(
    `SELECT mode,fiscal_name,tax_id,fiscal_regime_code,fiscal_postal_code,
            default_series,next_internal_folio::int,prices_include_tax,
            currency_code,is_active
     FROM ${schema}.invoice_settings WHERE id=1`,
  );
  const settings = rows[0];
  assert(settings?.mode === 'simulation', 'El modo del emisor debe ser simulation');
  assert(settings.is_active === true, 'La configuración del emisor debe estar activa');
  assert(
    settings.fiscal_name === INVOICING_DEMO_DATASET.issuer.fiscalName,
    'Nombre fiscal del emisor inesperado',
  );
  assert(settings.tax_id === INVOICING_DEMO_DATASET.issuer.taxId, 'RFC del emisor inesperado');
  assert(settings.fiscal_regime_code === '601', 'El emisor debe usar el régimen demostrativo 601');
  assert(settings.currency_code === 'MXN', 'La moneda debe ser MXN');
  assert(settings.prices_include_tax === true, 'Los precios demostrativos deben incluir impuestos');
}

async function verifyCustomers(dataSource: DataSource, schema: string): Promise<void> {
  const rows = await dataSource.query<
    Array<{
      display_name: string;
      tax_id: string | null;
      fiscal_name: string | null;
      fiscal_postal_code: string | null;
      fiscal_regime_code: string | null;
      preferred_cfdi_use_code: string | null;
      use_compatible: boolean;
    }>
  >(
    `SELECT customer.display_name,customer.tax_id,customer.fiscal_name,
            customer.fiscal_postal_code,customer.fiscal_regime_code,
            customer.preferred_cfdi_use_code,
            CASE WHEN customer.preferred_cfdi_use_code IS NULL THEN false ELSE EXISTS(
              SELECT 1 FROM public.sat_cfdi_use_fiscal_regimes compatibility
              WHERE compatibility.cfdi_use_code=customer.preferred_cfdi_use_code
                AND compatibility.fiscal_regime_code=customer.fiscal_regime_code
            ) END AS use_compatible
     FROM ${schema}.customers customer
     WHERE customer.notes LIKE $1 ORDER BY customer.display_name`,
    [`%${INVOICING_DEMO_DATASET.version}%`],
  );
  assert(
    rows.length === INVOICING_DEMO_DATASET.customers.length,
    'Cantidad de clientes incorrecta',
  );
  const complete = rows.filter(
    (row) =>
      row.tax_id &&
      row.fiscal_name &&
      row.fiscal_postal_code &&
      row.fiscal_regime_code &&
      row.preferred_cfdi_use_code &&
      row.use_compatible,
  );
  const incomplete = rows.filter((row) => !row.tax_id && !row.fiscal_name);
  assert(complete.length === 2, 'Deben existir dos perfiles fiscales completos');
  assert(incomplete.length === 1, 'Debe existir un perfil fiscal incompleto');
}

async function verifyOrders(dataSource: DataSource, schema: string): Promise<OrderRow[]> {
  const rows = await dataSource.query<OrderRow[]>(
    `SELECT service_order.external_folio,service_order.status,service_order.is_paid,
            COALESCE(invoice.status,'not_invoiced') AS billing_status,
            invoice.payment_method_code,
            count(DISTINCT item.id)::int AS item_count,
            count(DISTINCT order_event.id)::int AS status_events,
            count(DISTINCT invoice_event.id)::int AS invoice_events
     FROM ${schema}.orders service_order
     LEFT JOIN LATERAL (
       SELECT document.id,document.status,document.payment_method_code
       FROM ${schema}.simulated_invoices document
       WHERE document.order_id=service_order.id
       ORDER BY document.created_at DESC,document.id DESC LIMIT 1
     ) invoice ON true
     LEFT JOIN ${schema}.order_items item ON item.order_id=service_order.id
     LEFT JOIN ${schema}.order_status_history order_event ON order_event.order_id=service_order.id
     LEFT JOIN ${schema}.simulated_invoice_events invoice_event ON invoice_event.invoice_id=invoice.id
     WHERE service_order.external_folio=ANY($1::varchar[])
     GROUP BY service_order.id,invoice.id,invoice.status,invoice.payment_method_code
     ORDER BY service_order.external_folio`,
    [INVOICING_DEMO_ORDER_FOLIOS],
  );
  assert(rows.length === INVOICING_DEMO_DATASET.orders.length, 'Cantidad de órdenes incorrecta');
  const actual = new Map(rows.map((row) => [row.external_folio, row]));
  for (const expected of INVOICING_DEMO_DATASET.orders) {
    const row = actual.get(expected.externalFolio);
    assert(row, `No existe ${expected.externalFolio}`);
    assert(
      row.status === expected.status,
      `Estatus operativo incorrecto en ${expected.externalFolio}`,
    );
    assert(row.is_paid === expected.isPaid, `Cobro incorrecto en ${expected.externalFolio}`);
    assert(
      row.item_count === expected.items.length,
      `Conceptos incorrectos en ${expected.externalFolio}`,
    );
    assert(
      row.status_events === (expected.status === 'completed' ? 2 : 1),
      `Historial operativo incorrecto en ${expected.externalFolio}`,
    );
    assert(
      row.billing_status === (expected.invoice?.status ?? 'not_invoiced'),
      `Facturación incorrecta en ${expected.externalFolio}`,
    );
    assert(
      row.payment_method_code === (expected.invoice?.paymentMethodCode ?? null),
      `Método de pago incorrecto en ${expected.externalFolio}`,
    );
    if (expected.invoice?.status === 'draft')
      assert(row.invoice_events === 1, 'El borrador debe tener un evento');
    if (expected.invoice?.status === 'issued')
      assert(row.invoice_events === 2, 'La emisión debe tener dos eventos');
    if (expected.invoice?.status === 'cancelled')
      assert(row.invoice_events === 3, 'La cancelación debe tener tres eventos');
  }
  const pueIssued = rows.find(
    (row) => row.billing_status === 'issued' && row.payment_method_code === 'PUE',
  );
  const ppdIssued = rows.find(
    (row) => row.billing_status === 'issued' && row.payment_method_code === 'PPD',
  );
  const blockedPueDraft = rows.find(
    (row) => row.billing_status === 'draft' && row.payment_method_code === 'PUE',
  );
  assert(
    pueIssued?.is_paid === true,
    'La simulación PUE emitida debe corresponder a una orden pagada',
  );
  assert(ppdIssued?.is_paid === false, 'La simulación PPD emitida debe demostrar cobro pendiente');
  assert(
    blockedPueDraft?.is_paid === false,
    'Debe existir un borrador PUE bloqueable por cobro pendiente',
  );
  return rows;
}

async function verifyAmounts(dataSource: DataSource, schema: string): Promise<void> {
  const rows = await dataSource.query<
    Array<{
      external_folio: string;
      order_total: string;
      invoice_subtotal: string;
      invoice_tax: string;
      invoice_total: string;
      calculated_invoice_total: string;
    }>
  >(
    `SELECT service_order.external_folio,service_order.total::numeric(14,2)::text AS order_total,
            invoice.subtotal::numeric(14,2)::text AS invoice_subtotal,
            invoice.transferred_tax::numeric(14,2)::text AS invoice_tax,
            invoice.total::numeric(14,2)::text AS invoice_total,
            (invoice.subtotal+invoice.transferred_tax)::numeric(14,2)::text AS calculated_invoice_total
     FROM ${schema}.simulated_invoices invoice
     JOIN ${schema}.orders service_order ON service_order.id=invoice.order_id
     WHERE service_order.external_folio=ANY($1::varchar[])`,
    [INVOICING_DEMO_ORDER_FOLIOS],
  );
  for (const row of rows) {
    assert(
      row.invoice_total === row.order_total,
      `Total distinto a la orden en ${row.external_folio}`,
    );
    assert(
      row.invoice_total === row.calculated_invoice_total,
      `Subtotal e impuesto no cuadran en ${row.external_folio}`,
    );
  }
}

async function verifyIsolation(dataSource: DataSource, demoCompanyId: string): Promise<number> {
  const companies = await dataSource.query<Array<{ schema_name: string }>>(
    `SELECT schema_name FROM public.companies WHERE id<>$1`,
    [demoCompanyId],
  );
  for (const company of companies) {
    const schema = quoteIdentifier(company.schema_name);
    const rows = await dataSource.query<Array<{ count: number }>>(
      `SELECT count(*)::int AS count FROM ${schema}.orders
       WHERE external_folio=ANY($1::varchar[])`,
      [INVOICING_DEMO_ORDER_FOLIOS],
    );
    assert(rows[0]?.count === 0, `Se encontraron datos demo dentro de ${company.schema_name}`);
  }
  return companies.length;
}

export async function validateInvoicingDemo(
  dataSource: DataSource = publicDataSource,
): Promise<Record<string, unknown>> {
  assertLocalDatabase();
  const ownsConnection = !dataSource.isInitialized;
  if (ownsConnection) await dataSource.initialize();
  try {
    const currentCompany = await company(dataSource);
    const schema = quoteIdentifier(currentCompany.schema_name);
    const demoUsers = await users(dataSource, currentCompany.id);
    await verifyUsers(demoUsers);
    await verifyIssuer(dataSource, schema);
    await verifyCustomers(dataSource, schema);
    const orders = await verifyOrders(dataSource, schema);
    await verifyAmounts(dataSource, schema);
    const otherCompaniesChecked = await verifyIsolation(dataSource, currentCompany.id);
    return {
      company: currentCompany.name,
      plan: currentCompany.plan_code,
      users: demoUsers.map(({ username, template_code, permissions }) => ({
        login: `${username}@${TARGET}`,
        templateCode: template_code,
        permissions,
      })),
      orderStates: orders.map(
        ({ external_folio, status, is_paid, billing_status, payment_method_code }) => ({
          externalFolio: external_folio,
          operation: status,
          collection: is_paid ? 'paid' : 'pending',
          billing: billing_status,
          paymentMethod: payment_method_code,
        }),
      ),
      customers: INVOICING_DEMO_DATASET.customers.length,
      expenses: INVOICING_DEMO_DATASET.expenses.length,
      otherCompaniesChecked,
      simulationOnly: true,
    };
  } finally {
    if (ownsConnection && dataSource.isInitialized) await dataSource.destroy();
  }
}

if (require.main === module) {
  void validateInvoicingDemo()
    .then((result) => process.stdout.write(`${JSON.stringify(result, null, 2)}\n`))
    .catch((error: unknown) => {
      process.stderr.write(
        `${error instanceof Error ? error.message : 'Falló la validación demostrativa'}\n`,
      );
      process.exitCode = 1;
    });
}
