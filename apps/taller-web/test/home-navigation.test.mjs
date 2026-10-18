import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import {
  isTenantAccessAllowed,
  TENANT_HOME_ACTIONS,
  TENANT_NAVIGATION,
} from "../src/app/core/navigation/tenant-navigation.config.ts";

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
