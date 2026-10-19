import * as argon2 from 'argon2';
import { randomBytes } from 'node:crypto';
import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { DataSource, QueryRunner } from 'typeorm';
import { buildTenantSchemaName, quoteIdentifier } from '../schema-name';
import { TENANT_BASE_NAME, TENANT_BASE_VERSION, TenantMigrator } from '../tenant/tenant-migrator';
import publicDataSource from '../public-data-source';
import {
  INVOICING_DEMO_DATASET,
  INVOICING_DEMO_ORDER_FOLIOS,
  InvoicingDemoOrder,
  InvoicingDemoOrderItem,
} from './invoicing-demo.dataset';

const TARGET = INVOICING_DEMO_DATASET.company.loginCode;
const LOCAL_HOSTS = new Set(['localhost', '127.0.0.1', '::1']);
const CREDENTIALS_PATH = resolve(
  __dirname,
  '../../../../../.local-backups/invoicing-demo-credentials.txt',
);

interface CompanyRow {
  id: string;
  name: string;
  schema_name: string;
  login_code: string;
}

interface UserRow {
  id: string;
  username: string;
  password_hash: string;
}

interface DemoContext {
  company: CompanyRow;
  adminId: string;
  operator: UserRow;
  accounting: UserRow;
}

export interface InvoicingDemoResult {
  status: 'preview' | 'loaded' | 'already_loaded';
  companyName: string;
  loginCode: string;
  schemaName: string;
  operatorLogin: string;
  accountingLogin: string;
  customers: number;
  orders: number;
  invoices: number;
  expenses: number;
  credentialsPath: string | null;
}

function password(name: 'DEMO_OPERATION_PASSWORD' | 'DEMO_ACCOUNTING_PASSWORD'): string {
  const value = process.env[name]?.trim() ?? '';
  if (!/^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{6,10}$/.test(value)) {
    throw new Error(`${name} debe contener de 6 a 10 caracteres, al menos una letra y un número`);
  }
  return value;
}

function assertLocalDatabase(): string {
  const databaseUrl = process.env.DATABASE_URL?.trim();
  if (!databaseUrl) throw new Error('DATABASE_URL es obligatoria');
  const url = new URL(databaseUrl);
  if (!LOCAL_HOSTS.has(url.hostname) || process.env.NODE_ENV === 'production') {
    throw new Error('La demostración de facturación solamente puede cargarse en PostgreSQL local');
  }
  return databaseUrl;
}

function round(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

function orderTotal(order: InvoicingDemoOrder): number {
  return round(
    order.items.reduce(
      (sum, item) => sum + (item.affectsOrderTotal ? item.quantity * (item.unitPrice ?? 0) : 0),
      0,
    ),
  );
}

function orderCost(order: InvoicingDemoOrder): number {
  return round(order.items.reduce((sum, item) => sum + item.quantity * (item.unitCost ?? 0), 0));
}

function itemTotal(item: InvoicingDemoOrderItem): number {
  return round(item.affectsOrderTotal ? item.quantity * (item.unitPrice ?? 0) : 0);
}

async function hash(value: string): Promise<string> {
  return argon2.hash(value, { type: argon2.argon2id });
}

async function publicPrerequisites(runner: QueryRunner): Promise<void> {
  const rows = (await runner.query(
    `SELECT
       to_regclass('public.sat_cfdi_uses') IS NOT NULL AS fiscal_catalogs,
       to_regclass('public.permission_templates') IS NOT NULL AS permissions,
       EXISTS(SELECT 1 FROM public.subscription_plans WHERE code='invoicing' AND is_active) AS plan,
       EXISTS(SELECT 1 FROM public.permission_templates WHERE code='accounting' AND is_active) AS accounting`,
  )) as Array<{
    fiscal_catalogs: boolean;
    permissions: boolean;
    plan: boolean;
    accounting: boolean;
  }>;
  const state = rows[0];
  if (!state?.fiscal_catalogs || !state.permissions || !state.plan || !state.accounting) {
    throw new Error('Ejecuta primero las migraciones públicas y los catálogos de la API');
  }
}

async function existingCompany(runner: QueryRunner): Promise<CompanyRow | null> {
  const rows = (await runner.query(
    `SELECT id, name, schema_name, login_code
     FROM public.companies WHERE login_code=$1 FOR UPDATE`,
    [TARGET],
  )) as CompanyRow[];
  if (rows.length > 1) throw new Error(`Existe más de una compañía con código ${TARGET}`);
  return rows[0] ?? null;
}

async function createUser(
  runner: QueryRunner,
  companyId: string,
  username: string,
  fullName: string,
  phone: string,
  role: 'company_admin' | 'user',
  passwordHash: string,
): Promise<UserRow> {
  const rows = (await runner.query(
    `INSERT INTO public.users(
       email, username, phone, password_hash, full_name, role, company_id,
       timezone_code, must_change_password, is_active
     ) VALUES (NULL,$1,$2,$3,$4,$5,$6,$7,false,true)
     RETURNING id, username::text, password_hash`,
    [
      username,
      phone,
      passwordHash,
      fullName,
      role,
      companyId,
      INVOICING_DEMO_DATASET.company.timezone,
    ],
  )) as UserRow[];
  return rows[0]!;
}

async function assignPermissions(
  runner: QueryRunner,
  userId: string,
  grantedByUserId: string,
  permissionCodes: readonly string[],
  templateCode: string | null,
  customized: boolean,
): Promise<void> {
  const rows = (await runner.query(
    `SELECT code FROM public.permissions WHERE code=ANY($1::varchar[]) ORDER BY code`,
    [[...permissionCodes]],
  )) as Array<{ code: string }>;
  if (rows.length !== permissionCodes.length) {
    const found = new Set(rows.map(({ code }) => code));
    const missing = permissionCodes.filter((code) => !found.has(code));
    throw new Error(`No existen los permisos: ${missing.join(', ')}`);
  }
  await runner.query(
    `INSERT INTO public.user_permission_profiles(
       user_id, template_code, is_customized, updated_by_user_id
     ) VALUES ($1,$2,$3,$4)`,
    [userId, templateCode, customized, grantedByUserId],
  );
  await runner.query(
    `INSERT INTO public.user_permissions(user_id, permission_code, granted_by_user_id)
     SELECT $1, permission.code, $2
     FROM public.permissions permission WHERE permission.code=ANY($3::varchar[])`,
    [userId, grantedByUserId, [...permissionCodes]],
  );
}

async function createCompany(
  runner: QueryRunner,
  operatorPassword: string,
  accountingPassword: string,
): Promise<DemoContext> {
  const sequence = (await runner.query(
    `SELECT nextval('public.tenant_schema_number_seq')::text AS value`,
  )) as Array<{ value: string }>;
  const schemaName = buildTenantSchemaName(
    sequence[0]!.value,
    INVOICING_DEMO_DATASET.company.companyTypeCode,
    INVOICING_DEMO_DATASET.company.name,
  );
  const companies = (await runner.query(
    `INSERT INTO public.companies(
       name, schema_name, login_code, company_type_code, person_type_code,
       withholds_isr, withholds_iva
     ) VALUES ($1,$2,$3,$4,$5,false,false)
     RETURNING id, name, schema_name, login_code`,
    [
      INVOICING_DEMO_DATASET.company.name,
      schemaName,
      TARGET,
      INVOICING_DEMO_DATASET.company.companyTypeCode,
      INVOICING_DEMO_DATASET.company.personTypeCode,
    ],
  )) as CompanyRow[];
  const company = companies[0]!;
  await runner.query(
    `INSERT INTO public.company_subscriptions(company_id,plan_code,status)
     VALUES ($1,'invoicing','active')`,
    [company.id],
  );
  await runner.query(
    `INSERT INTO public.company_subscription_history(
       company_id,new_plan_code,new_status,reason
     ) VALUES ($1,'invoicing','active',$2)`,
    [company.id, `Carga local ${INVOICING_DEMO_DATASET.version}`],
  );
  await runner.query(`CREATE SCHEMA ${quoteIdentifier(schemaName)}`);
  await new TenantMigrator().migrateBase(runner, schemaName);
  await runner.query(
    `INSERT INTO public.tenant_schema_versions(company_id,version,migration_name)
     VALUES ($1,$2,$3)`,
    [company.id, TENANT_BASE_VERSION, TENANT_BASE_NAME],
  );

  const adminSecret = `Ad${randomBytes(4).toString('hex').slice(0, 6)}`;
  const admin = await createUser(
    runner,
    company.id,
    'demo_admin',
    'Administrador interno de la demo',
    '+526670000100',
    'company_admin',
    await hash(adminSecret),
  );
  const operator = await createUser(
    runner,
    company.id,
    INVOICING_DEMO_DATASET.users.operator.username,
    INVOICING_DEMO_DATASET.users.operator.fullName,
    INVOICING_DEMO_DATASET.users.operator.phone,
    'user',
    await hash(operatorPassword),
  );
  const accounting = await createUser(
    runner,
    company.id,
    INVOICING_DEMO_DATASET.users.accounting.username,
    INVOICING_DEMO_DATASET.users.accounting.fullName,
    INVOICING_DEMO_DATASET.users.accounting.phone,
    'user',
    await hash(accountingPassword),
  );
  await assignPermissions(
    runner,
    operator.id,
    admin.id,
    INVOICING_DEMO_DATASET.users.operator.permissions,
    null,
    true,
  );
  await assignPermissions(
    runner,
    accounting.id,
    admin.id,
    INVOICING_DEMO_DATASET.users.accounting.permissions,
    INVOICING_DEMO_DATASET.users.accounting.templateCode,
    false,
  );
  return { company, adminId: admin.id, operator, accounting };
}

async function loadExistingContext(runner: QueryRunner, company: CompanyRow): Promise<DemoContext> {
  if (company.name !== INVOICING_DEMO_DATASET.company.name) {
    throw new Error(`El código ${TARGET} pertenece a otra compañía; no se modificó ningún dato`);
  }
  const subscriptions = (await runner.query(
    `SELECT plan_code,status FROM public.company_subscriptions WHERE company_id=$1`,
    [company.id],
  )) as Array<{ plan_code: string; status: string }>;
  if (subscriptions[0]?.plan_code !== 'invoicing' || subscriptions[0]?.status !== 'active') {
    throw new Error('La compañía demostrativa existente no tiene Facturación activa');
  }
  const users = (await runner.query(
    `SELECT id, username::text, password_hash FROM public.users
     WHERE company_id=$1 AND username=ANY($2::citext[])`,
    [company.id, ['demo_admin', 'operador', 'contabilidad']],
  )) as UserRow[];
  const byUsername = new Map(users.map((user) => [user.username, user]));
  if (
    !byUsername.get('demo_admin') ||
    !byUsername.get('operador') ||
    !byUsername.get('contabilidad')
  ) {
    throw new Error('La compañía demostrativa existe, pero su carga está incompleta');
  }
  return {
    company,
    adminId: byUsername.get('demo_admin')!.id,
    operator: byUsername.get('operador')!,
    accounting: byUsername.get('contabilidad')!,
  };
}

async function configureIssuer(
  runner: QueryRunner,
  schema: string,
  adminId: string,
): Promise<void> {
  const issuer = INVOICING_DEMO_DATASET.issuer;
  await runner.query(
    `UPDATE ${schema}.invoice_settings SET
       mode='simulation', fiscal_name=$1, tax_id=$2, fiscal_regime_code=$3,
       fiscal_postal_code=$4, default_series=$5, next_internal_folio=$6,
       prices_include_tax=true, currency_code='MXN', is_active=true,
       updated_by_user_id=$7, updated_at=now()
     WHERE id=1`,
    [
      issuer.fiscalName,
      issuer.taxId,
      issuer.fiscalRegimeCode,
      issuer.fiscalPostalCode,
      issuer.series,
      issuer.nextFolio,
      adminId,
    ],
  );
  await runner.query(
    `INSERT INTO ${schema}.invoice_settings_events(
       event_type,changed_fields,previous_values,new_values,actor_user_id
     ) VALUES ('profile_updated',$1,'{}'::jsonb,$2::jsonb,$3)`,
    [
      ['mode', 'fiscal_name', 'tax_id', 'fiscal_regime_code', 'fiscal_postal_code'],
      JSON.stringify({ mode: 'simulation', demo: true }),
      adminId,
    ],
  );
}

async function vehicleCatalog(
  runner: QueryRunner,
  actorId: string,
): Promise<{
  brandId: string;
  modelId: string;
}> {
  const current = (await runner.query(
    `SELECT brand.id AS brand_id, model.id AS model_id
     FROM public.vehicle_brands brand
     JOIN public.vehicle_models model ON model.brand_id=brand.id
     WHERE brand.is_active=true AND model.is_active=true
     ORDER BY brand.name,model.name LIMIT 1`,
  )) as Array<{ brand_id: string; model_id: string }>;
  if (current[0]) return { brandId: current[0].brand_id, modelId: current[0].model_id };
  const brands = (await runner.query(
    `INSERT INTO public.vehicle_brands(name,created_by_user_id,updated_by_user_id)
     VALUES ('Marca Demostrativa',$1,$1) RETURNING id`,
    [actorId],
  )) as Array<{ id: string }>;
  const models = (await runner.query(
    `INSERT INTO public.vehicle_models(brand_id,name,created_by_user_id,updated_by_user_id)
     VALUES ($1,'Modelo Demostrativo',$2,$2) RETURNING id`,
    [brands[0]!.id, actorId],
  )) as Array<{ id: string }>;
  return { brandId: brands[0]!.id, modelId: models[0]!.id };
}

async function seedCustomersAndVehicles(
  runner: QueryRunner,
  schema: string,
  actorId: string,
): Promise<{ customers: Map<string, string>; vehicles: Map<string, string> }> {
  const catalog = await vehicleCatalog(runner, actorId);
  const customers = new Map<string, string>();
  const vehicles = new Map<string, string>();
  for (const [index, customer] of INVOICING_DEMO_DATASET.customers.entries()) {
    const inserted = (await runner.query(
      `INSERT INTO ${schema}.customers(
         customer_type,display_name,legal_name,contact_name,tax_id,fiscal_name,
         fiscal_postal_code,fiscal_regime_code,preferred_cfdi_use_code,phone,notes,
         created_by_user_id,updated_by_user_id
       ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$12) RETURNING id`,
      [
        customer.type,
        customer.displayName,
        customer.legalName,
        customer.contactName,
        customer.taxId,
        customer.fiscalName,
        customer.fiscalPostalCode,
        customer.fiscalRegimeCode,
        customer.preferredCfdiUseCode,
        customer.phone,
        `DATOS FICTICIOS · ${INVOICING_DEMO_DATASET.version} · ${customer.key}`,
        actorId,
      ],
    )) as Array<{ id: string }>;
    customers.set(customer.key, inserted[0]!.id);
    const vehicle = (await runner.query(
      `INSERT INTO ${schema}.vehicles(
         customer_id,brand_id,model_id,serial_number,license_plate,model_year,color,
         created_by_user_id,updated_by_user_id
       ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$8) RETURNING id`,
      [
        inserted[0]!.id,
        catalog.brandId,
        catalog.modelId,
        `DMV26A${String(index + 1).padStart(4, '0')}`,
        `DMO-${String(index + 1).padStart(3, '0')}`,
        2022 - index,
        ['Azul', 'Blanco', 'Gris'][index],
        actorId,
      ],
    )) as Array<{ id: string }>;
    vehicles.set(customer.key, vehicle[0]!.id);
  }
  return { customers, vehicles };
}

async function seedOrders(
  runner: QueryRunner,
  schema: string,
  actorId: string,
  customerIds: Map<string, string>,
  vehicleIds: Map<string, string>,
): Promise<Map<string, { id: string; itemIds: string[] }>> {
  const orders = new Map<string, { id: string; itemIds: string[] }>();
  for (const order of INVOICING_DEMO_DATASET.orders) {
    const total = orderTotal(order);
    const cost = orderCost(order);
    const inserted = (await runner.query(
      `INSERT INTO ${schema}.orders(
         external_folio,customer_id,vehicle_id,status,opened_at,closed_at,
         subtotal,tax,total,is_paid,paid_at,total_cost,gross_profit,
         created_by_user_id,updated_by_user_id,created_at,updated_at
       ) VALUES (
         $1,$2,$3,$4,$5::timestamptz,$6::timestamptz,$7,0,$7,$8,$9::timestamptz,
         $10,$11,$12,$12,$5::timestamptz,
         COALESCE($6::timestamptz,$5::timestamptz)
       )
       RETURNING id`,
      [
        order.externalFolio,
        customerIds.get(order.customerKey),
        vehicleIds.get(order.customerKey),
        order.status,
        order.openedAt,
        order.closedAt,
        total.toFixed(2),
        order.isPaid,
        order.paidAt,
        cost.toFixed(2),
        (total - cost).toFixed(2),
        actorId,
      ],
    )) as Array<{ id: string }>;
    const orderId = inserted[0]!.id;
    const itemIds: string[] = [];
    for (const [position, item] of order.items.entries()) {
      const itemCost = item.unitCost === null ? null : round(item.quantity * item.unitCost);
      const rows = (await runner.query(
        `INSERT INTO ${schema}.order_items(
           order_id,kind,description,quantity,unit_price,total,affects_order_total,
           unit_name,unit_symbol,unit_cost,cost_total,tracks_inventory,position,created_at
         ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,false,$12,$13) RETURNING id`,
        [
          orderId,
          item.kind,
          item.description,
          item.quantity.toFixed(3),
          item.unitPrice?.toFixed(2) ?? null,
          itemTotal(item).toFixed(2),
          item.affectsOrderTotal,
          item.kind === 'service' ? 'Servicio' : 'Pieza',
          item.kind === 'service' ? 'serv' : 'pza',
          item.unitCost?.toFixed(2) ?? null,
          itemCost?.toFixed(2) ?? null,
          position + 1,
          order.openedAt,
        ],
      )) as Array<{ id: string }>;
      itemIds.push(rows[0]!.id);
    }
    await runner.query(
      `INSERT INTO ${schema}.order_status_history(
         order_id,previous_status,new_status,changed_by_user_id,changed_at
       ) VALUES ($1,NULL,'in_progress',$2,$3)`,
      [orderId, actorId, order.openedAt],
    );
    if (order.status === 'completed') {
      await runner.query(
        `INSERT INTO ${schema}.order_status_history(
           order_id,previous_status,new_status,changed_by_user_id,changed_at
         ) VALUES ($1,'in_progress','completed',$2,$3)`,
        [orderId, actorId, order.closedAt],
      );
    }
    orders.set(order.key, { id: orderId, itemIds });
  }
  return orders;
}

async function seedInvoices(
  runner: QueryRunner,
  schema: string,
  accountingId: string,
  customerIds: Map<string, string>,
  orderIds: Map<string, { id: string; itemIds: string[] }>,
): Promise<void> {
  const issuer = INVOICING_DEMO_DATASET.issuer;
  for (const order of INVOICING_DEMO_DATASET.orders.filter(({ invoice }) => invoice)) {
    const invoice = order.invoice!;
    const customer = INVOICING_DEMO_DATASET.customers.find(({ key }) => key === order.customerKey)!;
    if (
      !customer.taxId ||
      !customer.fiscalName ||
      !customer.fiscalPostalCode ||
      !customer.fiscalRegimeCode ||
      !customer.preferredCfdiUseCode
    ) {
      throw new Error(`El receptor de ${order.externalFolio} no está listo para facturar`);
    }
    const status = invoice.status;
    const rows = (await runner.query(
      `INSERT INTO ${schema}.simulated_invoices(
         order_id,status,series,folio,issuer_fiscal_name,issuer_tax_id,
         issuer_fiscal_regime_code,issuer_postal_code,receiver_fiscal_name,
         receiver_tax_id,receiver_fiscal_regime_code,receiver_postal_code,
         cfdi_use_code,payment_form_code,payment_method_code,export_code,
         currency_code,prices_include_tax,issued_at,cancelled_at,
         created_by_user_id,updated_by_user_id,issued_by_user_id,cancelled_by_user_id,
         created_at,updated_at
       ) VALUES (
         $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,
         $13,$14,$15,'01','MXN',true,$16::timestamptz,$17::timestamptz,
         $18,$18,$19,$20,$21::timestamptz,
         COALESCE($17::timestamptz,$16::timestamptz,$21::timestamptz)
       ) RETURNING id`,
      [
        orderIds.get(order.key)!.id,
        status,
        invoice.series ?? null,
        invoice.folio ?? null,
        issuer.fiscalName,
        issuer.taxId,
        issuer.fiscalRegimeCode,
        issuer.fiscalPostalCode,
        customer.fiscalName,
        customer.taxId,
        customer.fiscalRegimeCode,
        customer.fiscalPostalCode,
        customer.preferredCfdiUseCode,
        invoice.paymentFormCode,
        invoice.paymentMethodCode,
        invoice.issuedAt ?? null,
        invoice.cancelledAt ?? null,
        accountingId,
        status === 'draft' ? null : accountingId,
        status === 'cancelled' ? accountingId : null,
        order.closedAt,
      ],
    )) as Array<{ id: string }>;
    const invoiceId = rows[0]!.id;
    let subtotal = 0;
    let tax = 0;
    let total = 0;
    for (const [position, item] of order.items.entries()) {
      if (!item.affectsOrderTotal || item.unitPrice === null) continue;
      const amount = round(item.quantity * item.unitPrice);
      const base = round(amount / 1.16);
      const taxAmount = round(amount - base);
      subtotal += base;
      tax += taxAmount;
      total += amount;
      await runner.query(
        `INSERT INTO ${schema}.simulated_invoice_items(
           invoice_id,order_item_id,position,description,product_service_code,
           unit_code,unit_name,quantity,unit_price,tax_object_code,tax_code,
           factor_type_code,tax_rate,base_amount,tax_amount,total
         ) VALUES ($1,$2,$3,$4,NULL,NULL,$5,$6,$7,'02','002','Tasa',0.16,$8,$9,$10)`,
        [
          invoiceId,
          orderIds.get(order.key)!.itemIds[position],
          position + 1,
          item.description,
          item.kind === 'service' ? 'Servicio' : 'Pieza',
          item.quantity.toFixed(3),
          item.unitPrice.toFixed(2),
          base.toFixed(2),
          taxAmount.toFixed(2),
          amount.toFixed(2),
        ],
      );
    }
    await runner.query(
      `UPDATE ${schema}.simulated_invoices
       SET subtotal=$2,transferred_tax=$3,total=$4 WHERE id=$1`,
      [invoiceId, round(subtotal).toFixed(2), round(tax).toFixed(2), round(total).toFixed(2)],
    );
    await runner.query(
      `INSERT INTO ${schema}.simulated_invoice_events(
         invoice_id,event_type,details,actor_user_id,created_at
       ) VALUES ($1,'created',$2::jsonb,$3,$4)`,
      [
        invoiceId,
        JSON.stringify({ demo: true, orderId: orderIds.get(order.key)!.id }),
        accountingId,
        order.closedAt,
      ],
    );
    if (status !== 'draft') {
      await runner.query(
        `INSERT INTO ${schema}.simulated_invoice_events(
           invoice_id,event_type,details,actor_user_id,created_at
         ) VALUES ($1,'issued',$2::jsonb,$3,$4)`,
        [
          invoiceId,
          JSON.stringify({ demo: true, series: invoice.series, folio: invoice.folio }),
          accountingId,
          invoice.issuedAt,
        ],
      );
    }
    if (status === 'cancelled') {
      await runner.query(
        `INSERT INTO ${schema}.simulated_invoice_events(
           invoice_id,event_type,details,actor_user_id,created_at
         ) VALUES ($1,'cancelled',$2::jsonb,$3,$4)`,
        [
          invoiceId,
          JSON.stringify({ demo: true, reason: 'Cancelación demostrativa' }),
          accountingId,
          invoice.cancelledAt,
        ],
      );
    }
  }
  void customerIds;
}

async function seedExpenses(
  runner: QueryRunner,
  schema: string,
  operatorId: string,
): Promise<void> {
  const suppliers = (await runner.query(
    `SELECT id FROM ${schema}.suppliers WHERE is_system=true AND is_active=true`,
  )) as Array<{ id: string }>;
  for (const expense of INVOICING_DEMO_DATASET.expenses) {
    const rows = (await runner.query(
      `INSERT INTO ${schema}.expenses(
         category_id,description,amount,occurred_on,supplier_id,reference,notes,
         status,recurrence_type,confirmed_at,created_by_user_id,updated_by_user_id
       ) SELECT category.id,$1,$2,$3,$4,$5,$6,'confirmed',$7,$8,$9,$9
         FROM ${schema}.expense_categories category WHERE category.code=$10
       RETURNING id`,
      [
        expense.description,
        expense.amount.toFixed(2),
        expense.occurredOn,
        suppliers[0]!.id,
        expense.reference,
        `DATOS FICTICIOS · ${INVOICING_DEMO_DATASET.version}`,
        expense.recurrenceType,
        `${expense.occurredOn}T12:00:00-07:00`,
        operatorId,
        expense.categoryCode,
      ],
    )) as Array<{ id: string }>;
    if (!rows[0]) throw new Error(`No existe la categoría ${expense.categoryCode}`);
    await runner.query(
      `INSERT INTO ${schema}.expense_status_history(
         expense_id,previous_status,new_status,changed_by_user_id,changed_at
       ) VALUES ($1,NULL,'confirmed',$2,$3)`,
      [rows[0].id, operatorId, `${expense.occurredOn}T12:00:00-07:00`],
    );
  }
}

async function state(
  runner: QueryRunner,
  context: DemoContext,
): Promise<{
  customers: number;
  orders: number;
  invoices: number;
  expenses: number;
}> {
  const schema = quoteIdentifier(context.company.schema_name);
  const rows = (await runner.query(
    `SELECT
       (SELECT count(*)::int FROM ${schema}.customers WHERE notes LIKE $1) AS customers,
       (SELECT count(*)::int FROM ${schema}.orders WHERE external_folio=ANY($2::varchar[])) AS orders,
       (SELECT count(*)::int FROM ${schema}.simulated_invoices invoice
          JOIN ${schema}.orders service_order ON service_order.id=invoice.order_id
          WHERE service_order.external_folio=ANY($2::varchar[])) AS invoices,
       (SELECT count(*)::int FROM ${schema}.expenses WHERE reference LIKE 'DEMO-GASTO-%') AS expenses`,
    [`%${INVOICING_DEMO_DATASET.version}%`, INVOICING_DEMO_ORDER_FOLIOS],
  )) as Array<{ customers: number; orders: number; invoices: number; expenses: number }>;
  return rows[0]!;
}

function isComplete(value: Awaited<ReturnType<typeof state>>): boolean {
  return (
    Number(value.customers) === INVOICING_DEMO_DATASET.customers.length &&
    Number(value.orders) === INVOICING_DEMO_DATASET.orders.length &&
    Number(value.invoices) ===
      INVOICING_DEMO_DATASET.orders.filter(({ invoice }) => invoice).length &&
    Number(value.expenses) === INVOICING_DEMO_DATASET.expenses.length
  );
}

async function stage<T>(label: string, work: () => Promise<T>): Promise<T> {
  try {
    return await work();
  } catch (error: unknown) {
    const detail = error instanceof Error ? error.message : String(error);
    throw new Error(`${label}: ${detail}`, { cause: error });
  }
}

async function writeCredentials(
  operatorPassword: string,
  accountingPassword: string,
): Promise<void> {
  await mkdir(dirname(CREDENTIALS_PATH), { recursive: true });
  const body = [
    'DEMO LOCAL · NO USAR EN PRODUCCIÓN',
    `Compañía: ${INVOICING_DEMO_DATASET.company.name}`,
    '',
    `Operación: ${INVOICING_DEMO_DATASET.users.operator.username}@${TARGET}`,
    `Contraseña: ${operatorPassword}`,
    '',
    `Contabilidad: ${INVOICING_DEMO_DATASET.users.accounting.username}@${TARGET}`,
    `Contraseña: ${accountingPassword}`,
    '',
    'Los datos y RFC de esta compañía son ficticios y las facturas son simulaciones sin validez fiscal.',
    '',
  ].join('\n');
  await writeFile(CREDENTIALS_PATH, body, { encoding: 'utf8', mode: 0o600 });
}

function result(
  status: InvoicingDemoResult['status'],
  context: DemoContext,
  credentialsPath: string | null,
): InvoicingDemoResult {
  return {
    status,
    companyName: context.company.name,
    loginCode: TARGET,
    schemaName: context.company.schema_name,
    operatorLogin: `${context.operator.username}@${TARGET}`,
    accountingLogin: `${context.accounting.username}@${TARGET}`,
    customers: INVOICING_DEMO_DATASET.customers.length,
    orders: INVOICING_DEMO_DATASET.orders.length,
    invoices: INVOICING_DEMO_DATASET.orders.filter(({ invoice }) => invoice).length,
    expenses: INVOICING_DEMO_DATASET.expenses.length,
    credentialsPath,
  };
}

export async function loadInvoicingDemo(
  apply: boolean,
  confirmation?: string,
  dataSource: DataSource = publicDataSource,
): Promise<InvoicingDemoResult> {
  assertLocalDatabase();
  if (apply && confirmation !== TARGET) throw new Error(`La carga requiere --confirm=${TARGET}`);
  const operatorPassword = apply ? password('DEMO_OPERATION_PASSWORD') : '';
  const accountingPassword = apply ? password('DEMO_ACCOUNTING_PASSWORD') : '';
  const ownsConnection = !dataSource.isInitialized;
  if (ownsConnection) await dataSource.initialize();
  const runner = dataSource.createQueryRunner();
  await runner.connect();
  try {
    await runner.startTransaction('SERIALIZABLE');
    await runner.query(`SELECT pg_advisory_xact_lock(hashtext($1))`, [`taller-demo:${TARGET}`]);
    await publicPrerequisites(runner);
    const current = await existingCompany(runner);
    if (!current && !apply) {
      await runner.rollbackTransaction();
      return {
        status: 'preview',
        companyName: INVOICING_DEMO_DATASET.company.name,
        loginCode: TARGET,
        schemaName: 'Se generará durante la carga',
        operatorLogin: `${INVOICING_DEMO_DATASET.users.operator.username}@${TARGET}`,
        accountingLogin: `${INVOICING_DEMO_DATASET.users.accounting.username}@${TARGET}`,
        customers: INVOICING_DEMO_DATASET.customers.length,
        orders: INVOICING_DEMO_DATASET.orders.length,
        invoices: INVOICING_DEMO_DATASET.orders.filter(({ invoice }) => invoice).length,
        expenses: INVOICING_DEMO_DATASET.expenses.length,
        credentialsPath: null,
      };
    }
    let context: DemoContext;
    if (current) {
      context = await loadExistingContext(runner, current);
      const currentState = await state(runner, context);
      if (!isComplete(currentState)) {
        throw new Error('La compañía demostrativa existe, pero sus datos están incompletos');
      }
      if (apply) {
        if (!(await argon2.verify(context.operator.password_hash, operatorPassword))) {
          throw new Error('DEMO_OPERATION_PASSWORD no coincide con la carga existente');
        }
        if (!(await argon2.verify(context.accounting.password_hash, accountingPassword))) {
          throw new Error('DEMO_ACCOUNTING_PASSWORD no coincide con la carga existente');
        }
        await writeCredentials(operatorPassword, accountingPassword);
      }
      await runner.commitTransaction();
      return result('already_loaded', context, apply ? CREDENTIALS_PATH : null);
    }

    context = await stage('Crear compañía y usuarios', () =>
      createCompany(runner, operatorPassword, accountingPassword),
    );
    const schema = quoteIdentifier(context.company.schema_name);
    await stage('Configurar emisor', () => configureIssuer(runner, schema, context.adminId));
    const entities = await stage('Crear clientes y vehículos', () =>
      seedCustomersAndVehicles(runner, schema, context.operator.id),
    );
    const orders = await stage('Crear órdenes', () =>
      seedOrders(runner, schema, context.operator.id, entities.customers, entities.vehicles),
    );
    await stage('Crear simulaciones', () =>
      seedInvoices(runner, schema, context.accounting.id, entities.customers, orders),
    );
    await stage('Crear gastos', () => seedExpenses(runner, schema, context.operator.id));
    if (!isComplete(await state(runner, context))) throw new Error('La carga quedó incompleta');
    await runner.commitTransaction();
    await writeCredentials(operatorPassword, accountingPassword);
    return result('loaded', context, CREDENTIALS_PATH);
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
  const loaded = await loadInvoicingDemo(process.argv.includes('--apply'), argument('--confirm'));
  process.stdout.write(`${JSON.stringify(loaded, null, 2)}\n`);
}

if (require.main === module) {
  void main().catch((error: unknown) => {
    process.stderr.write(
      `${error instanceof Error ? error.message : 'Falló la carga demostrativa'}\n`,
    );
    process.exitCode = 1;
  });
}
