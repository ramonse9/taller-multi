import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import {
  isTenantAccessAllowed,
  tenantSectionForUrl,
  TENANT_HOME_ACTIONS,
  TENANT_NAVIGATION,
} from "../src/app/core/navigation/tenant-navigation.config.ts";
import {
  orderBillingAction,
  orderBillingStatusName,
} from "../src/app/features/orders/order-billing-ui.ts";

const essentialFeatures = [
  "dashboard",
  "customer_history",
  "vehicle_history",
  "vehicle_catalog",
  "service_orders",
  "free_order_items",
  "expenses",
  "profitability",
  "user_management",
];

const controlFeatures = [
  ...essentialFeatures,
  "item_catalog",
  "suppliers",
  "purchases",
  "inventory",
];

const allPermissions = [
  "dashboard.view",
  "orders.view",
  "orders.create",
  "clients.view",
  "clients.create",
  "vehicles.view",
  "vehicle_catalog.view",
  "catalog.view",
  "catalog.view_costs",
  "inventory.view",
  "purchases.view",
  "purchases.create",
  "suppliers.view",
  "expenses.view",
  "expenses.create",
  "profitability.view",
  "invoices.view",
];

function context(planCode, features, permissions = allPermissions) {
  return {
    role: "user",
    planCode,
    subscriptionUsable: true,
    features,
    readOnlyFeatures: [],
    permissions,
  };
}

function visibleModules(accessContext) {
  return TENANT_NAVIGATION.filter(
    (item) =>
      item.link !== "/home" && isTenantAccessAllowed(item, accessContext),
  ).map((item) => item.label);
}

function visibleActions(accessContext) {
  return TENANT_HOME_ACTIONS.filter((item) =>
    isTenantAccessAllowed(item, accessContext),
  ).map((item) => item.label);
}

test("Esencial muestra operación, gastos y utilidad sin módulos de Control", () => {
  const accessContext = context("essential", essentialFeatures);
  assert.deepEqual(visibleModules(accessContext), [
    "Tablero",
    "Órdenes",
    "Clientes",
    "Gastos",
    "Utilidad",
    "Seguridad",
  ]);
  assert.deepEqual(visibleActions(accessContext), [
    "Nueva orden",
    "Nuevo cliente",
    "Nuevo gasto",
  ]);
});

test("Control agrega catálogo, inventario, compras y proveedores", () => {
  const accessContext = context("control", controlFeatures);
  assert.deepEqual(visibleModules(accessContext), [
    "Tablero",
    "Órdenes",
    "Clientes",
    "Productos y servicios",
    "Inventario",
    "Compras",
    "Proveedores",
    "Gastos",
    "Utilidad",
    "Marcas y modelos",
    "Seguridad",
  ]);
  assert.deepEqual(visibleActions(accessContext), [
    "Nueva orden",
    "Nuevo cliente",
    "Nuevo gasto",
    "Nueva compra",
  ]);
});

test("Facturación conserva Control y agrega su módulo", () => {
  const accessContext = context("invoicing", [...controlFeatures, "invoicing"]);
  assert.ok(visibleModules(accessContext).includes("Facturación"));
  assert.deepEqual(visibleActions(accessContext), [
    "Nueva orden",
    "Nuevo cliente",
    "Nuevo gasto",
    "Nueva compra",
  ]);
});

test("Contabilidad muestra sólo consulta operativa y facturación por permisos", () => {
  const accountingPermissions = [
    "orders.view",
    "clients.view",
    "clients.edit_fiscal",
    "invoices.view",
    "invoices.create",
    "invoices.edit",
    "invoices.simulate_issue",
    "invoices.cancel_simulation",
  ];
  const features = [...controlFeatures, "invoicing"];
  const userContext = context("invoicing", features, accountingPermissions);
  const adminContext = { ...userContext, role: "admin" };

  const expectedModules = ["Órdenes", "Clientes", "Facturación", "Seguridad"];
  assert.deepEqual(visibleModules(userContext), expectedModules);
  assert.deepEqual(visibleModules(adminContext), expectedModules);
  assert.deepEqual(visibleActions(userContext), []);
  assert.deepEqual(visibleActions(adminContext), []);
});

test("Contabilidad no recibe accesos operativos aunque el plan los incluya", () => {
  const accessContext = context(
    "invoicing",
    [...controlFeatures, "invoicing"],
    ["orders.view", "clients.view", "clients.edit_fiscal", "invoices.view"],
  );

  assert.equal(
    isTenantAccessAllowed(
      TENANT_HOME_ACTIONS.find(({ link }) => link === "/orders/new"),
      accessContext,
    ),
    false,
  );
  assert.ok(!visibleModules(accessContext).includes("Gastos"));
  assert.ok(!visibleModules(accessContext).includes("Inventario"));
  assert.ok(!visibleModules(accessContext).includes("Utilidad"));
});

test("las acciones rápidas exigen todos los permisos de su ruta", () => {
  const accessContext = context("control", controlFeatures, [
    "orders.create",
    "clients.view",
    "vehicles.view",
    "vehicle_catalog.view",
    "expenses.view",
    "expenses.create",
    "purchases.create",
    "catalog.view",
    "catalog.view_costs",
  ]);
  assert.deepEqual(visibleActions(accessContext), [
    "Nueva orden",
    "Nuevo gasto",
  ]);
});

test("company_admin conserva acceso total dentro de las capacidades del plan", () => {
  const accessContext = {
    ...context("essential", essentialFeatures, []),
    role: "company_admin",
  };
  assert.deepEqual(visibleActions(accessContext), [
    "Nueva orden",
    "Nuevo cliente",
    "Nuevo gasto",
  ]);
});

test("Inicio no importa ni ejecuta consultas del Tablero", () => {
  const source = readFileSync(
    new URL("../src/app/features/home/home.page.ts", import.meta.url),
    "utf8",
  );
  assert.doesNotMatch(
    source,
    /DashboardService|DashboardSummary|HttpClient|\.summary\(|\.activity\(|\.analytics\(/,
  );
  assert.doesNotMatch(source, /OnInit|ngOnInit/);
});

test("Inicio permite cambiar el tema con un control accesible", () => {
  const source = readFileSync(
    new URL("../src/app/features/home/home.page.ts", import.meta.url),
    "utf8",
  );
  const template = readFileSync(
    new URL("../src/app/features/home/home.page.html", import.meta.url),
    "utf8",
  );

  assert.match(source, /ThemeService/);
  assert.match(template, /\(click\)="theme\.toggle\(\)"/);
  assert.match(template, /theme\.isDark\(\)/);
  assert.match(template, /Cambiar a tema claro/);
  assert.match(template, /Cambiar a tema oscuro/);
});

test("Facturación consume el resumen de conciliación sin campos de utilidad", () => {
  const serviceSource = readFileSync(
    new URL(
      "../src/app/features/invoices/invoices.service.ts",
      import.meta.url,
    ),
    "utf8",
  );
  const modelSource = readFileSync(
    new URL("../src/app/features/invoices/invoice.models.ts", import.meta.url),
    "utf8",
  );
  const summaryModel = modelSource.match(
    /export interface InvoiceReconciliationSummary \{[\s\S]*?\n\}/,
  )?.[0];

  assert.match(serviceSource, /`\$\{this\.url\}\/summary`/);
  assert.ok(summaryModel);
  assert.doesNotMatch(
    summaryModel,
    /directCost|operatingExpenses|profit|margin/i,
  );
});

test("las tarjetas de conciliación navegan a órdenes y documentos filtrados", () => {
  const invoiceTemplate = readFileSync(
    new URL("../src/app/features/invoices/invoices.page.html", import.meta.url),
    "utf8",
  );
  const ordersSource = readFileSync(
    new URL("../src/app/features/orders/orders.page.ts", import.meta.url),
    "utf8",
  );

  assert.match(invoiceTemplate, /pendingInvoicing: true/);
  assert.match(invoiceTemplate, /status: 'draft'/);
  assert.match(invoiceTemplate, /status: 'issued'/);
  assert.match(invoiceTemplate, /status: 'cancelled'/);
  assert.match(ordersSource, /queryParamMap\.get\("pendingInvoicing"\)/);
});

test("Facturación identifica la orden de origen por su folio y datos operativos", () => {
  const source = readFileSync(
    new URL("../src/app/features/invoices/invoices.page.ts", import.meta.url),
    "utf8",
  );
  const template = readFileSync(
    new URL("../src/app/features/invoices/invoices.page.html", import.meta.url),
    "utf8",
  );

  assert.match(source, /OrdersService/);
  assert.match(source, /getOne\(this\.orderId\)/);
  assert.match(template, /Orden #\{\{ currentOrder\.folio \}\}/);
  assert.match(template, /currentOrder\.externalFolio/);
  assert.match(template, /currentOrder\.customer\.displayName/);
  assert.match(template, /currentOrder\.vehicle\.brandName/);
  assert.match(template, /currentOrder\.total/);
  assert.match(template, /Ver orden completa/);
  assert.doesNotMatch(template, /orderId\.slice/);
});

test("el detalle de la orden oculta Inventario fuera de los planes que lo incluyen", () => {
  const template = readFileSync(
    new URL(
      "../src/app/features/orders/order-detail.page.html",
      import.meta.url,
    ),
    "utf8",
  );

  assert.match(
    template,
    /@if \(auth\.hasFeature\('inventory'\)\) \{[\s\S]*?<span class="detail-label">INVENTARIO<\/span>/,
  );
  assert.match(
    template,
    /\[class\.sm:grid-cols-2\]="!auth\.hasFeature\('inventory'\)"/,
  );
});

test("la confirmación de una orden muestra cantidades sin sufijos de unidad", () => {
  const template = readFileSync(
    new URL(
      "../src/app/features/orders/order-wizard.page.html",
      import.meta.url,
    ),
    "utf8",
  );

  assert.match(template, />× \{\{ item\.value\.quantity \}\}<\/small/);
  assert.doesNotMatch(
    template,
    />× \{\{ item\.value\.quantity \}\}@if \(item\.value\.unitSymbol/,
  );
});

test("Utilidad oculta completamente la conciliación sin plan y permisos", () => {
  const source = readFileSync(
    new URL(
      "../src/app/features/profitability/profitability.page.ts",
      import.meta.url,
    ),
    "utf8",
  );
  const template = readFileSync(
    new URL(
      "../src/app/features/profitability/profitability.page.html",
      import.meta.url,
    ),
    "utf8",
  );

  assert.match(source, /hasFeatureReadAccess\("invoicing"\)/);
  assert.match(source, /hasPermission\("profitability\.view"\)/);
  assert.match(source, /hasPermission\("invoices\.view"\)/);
  assert.match(template, /@if \(canViewBillingReconciliation\(\)\)/);
});

test("Utilidad separa importes operativos de impuestos documentales", () => {
  const serviceSource = readFileSync(
    new URL(
      "../src/app/features/profitability/profitability.service.ts",
      import.meta.url,
    ),
    "utf8",
  );
  const modelSource = readFileSync(
    new URL(
      "../src/app/features/profitability/profitability.models.ts",
      import.meta.url,
    ),
    "utf8",
  );
  const reconciliationModel = modelSource.match(
    /export interface ProfitabilityBillingReconciliation \{[\s\S]*?\n\}/,
  )?.[0];

  assert.match(serviceSource, /`\$\{this\.url\}\/billing-reconciliation`/);
  assert.ok(reconciliationModel);
  assert.match(reconciliationModel, /generatedOperationalAmount/);
  assert.match(reconciliationModel, /issuedSimulationTax/);
  assert.doesNotMatch(
    reconciliationModel,
    /directCost|operatingExpenses|grossProfit|netProfit|margin/i,
  );
});

test("la conciliación de Utilidad conserva estados y diseño responsivo en ambos temas", () => {
  const template = readFileSync(
    new URL(
      "../src/app/features/profitability/profitability.page.html",
      import.meta.url,
    ),
    "utf8",
  );

  assert.match(template, /billingReconciliationLoading\(\)/);
  assert.match(template, /billingReconciliationError\(\)/);
  assert.match(template, /billingReconciliationEmpty\(\)/);
  assert.match(template, /sm:grid-cols-2/);
  assert.match(template, /xl:grid-cols-2/);
  assert.match(template, /dark:bg-\[/);
  assert.match(template, /focus-visible:outline/);
  assert.match(template, /IMPUESTOS SIMULADOS/);
});

test("la navegación contextual reconoce listados, detalles y formularios", () => {
  assert.equal(tenantSectionForUrl("/home", TENANT_NAVIGATION), null);
  assert.equal(
    tenantSectionForUrl("/orders", TENANT_NAVIGATION)?.label,
    "Órdenes",
  );
  assert.equal(
    tenantSectionForUrl(
      "/orders/6f3b1aa1-480c-4821-96fe-d4a989a88a10/edit?step=3",
      TENANT_NAVIGATION,
    )?.label,
    "Órdenes",
  );
  assert.equal(
    tenantSectionForUrl("/clients/customer-id", TENANT_NAVIGATION)?.label,
    "Clientes",
  );
  assert.equal(
    tenantSectionForUrl("/purchases/new", TENANT_NAVIGATION)?.label,
    "Compras",
  );
});

const billingAccess = {
  canView: true,
  canCreate: true,
  canEdit: true,
};

function billingOrder(overrides = {}) {
  return {
    id: "order-id",
    status: "completed",
    billingStatus: "not_invoiced",
    activeInvoiceId: null,
    ...overrides,
  };
}

test("las acciones de facturación siguen el estado independiente de la orden", () => {
  assert.deepEqual(orderBillingAction(billingOrder(), billingAccess), {
    label: "Preparar factura simulada",
    link: ["/invoices"],
    queryParams: { orderId: "order-id" },
  });
  assert.deepEqual(
    orderBillingAction(
      billingOrder({ billingStatus: "draft", activeInvoiceId: "draft-id" }),
      billingAccess,
    ),
    {
      label: "Continuar borrador",
      link: ["/invoices", "draft-id"],
      queryParams: null,
    },
  );
  assert.deepEqual(
    orderBillingAction(
      billingOrder({ billingStatus: "issued", activeInvoiceId: "invoice-id" }),
      billingAccess,
    ),
    {
      label: "Ver simulación",
      link: ["/invoices", "invoice-id"],
      queryParams: null,
    },
  );
  assert.equal(
    orderBillingAction(billingOrder({ status: "in_progress" }), billingAccess),
    null,
  );
  assert.equal(
    orderBillingAction(billingOrder({ status: "cancelled" }), billingAccess),
    null,
  );
});

test("una simulación cancelada permite preparar otra sin ocultar su historial", () => {
  assert.equal(orderBillingStatusName("cancelled"), "Simulación cancelada");
  assert.equal(orderBillingStatusName("discarded"), "Sin factura");
  assert.deepEqual(
    orderBillingAction(
      billingOrder({ billingStatus: "cancelled" }),
      billingAccess,
    ),
    {
      label: "Preparar nueva simulación",
      link: ["/invoices"],
      queryParams: { orderId: "order-id" },
    },
  );
});

test("facturación respeta permisos de consulta, creación y edición", () => {
  assert.equal(
    orderBillingAction(billingOrder(), {
      canView: true,
      canCreate: false,
      canEdit: false,
    }),
    null,
  );
  assert.deepEqual(
    orderBillingAction(
      billingOrder({ billingStatus: "draft", activeInvoiceId: "draft-id" }),
      { canView: true, canCreate: false, canEdit: false },
    )?.label,
    "Ver borrador",
  );
  assert.equal(
    orderBillingAction(billingOrder(), {
      canView: false,
      canCreate: true,
      canEdit: true,
    }),
    null,
  );
});
