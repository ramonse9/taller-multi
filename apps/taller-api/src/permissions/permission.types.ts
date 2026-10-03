export const PERMISSION_CODES = [
  'dashboard.view',
  'clients.view',
  'clients.create',
  'clients.edit',
  'clients.deactivate',
  'vehicles.view',
  'vehicles.create',
  'vehicles.edit',
  'vehicles.deactivate',
  'orders.view',
  'orders.create',
  'orders.edit',
  'orders.change_status',
  'orders.manage_payment',
  'orders.add_notes',
  'catalog.view',
  'catalog.manage',
  'catalog.view_costs',
  'inventory.view',
  'inventory.move',
  'inventory.adjust',
  'suppliers.view',
  'suppliers.manage',
  'purchases.view',
  'purchases.create',
  'purchases.confirm',
  'purchases.cancel',
  'expenses.view',
  'expenses.create',
  'expenses.confirm',
  'expenses.cancel',
  'profitability.view',
  'vehicle_catalog.view',
  'vehicle_catalog.manage',
  'users.view',
  'users.manage',
  'permissions.manage',
] as const;

export type PermissionCode = (typeof PERMISSION_CODES)[number];

export const PERMISSION_TEMPLATE_CODES = [
  'reception',
  'mechanic',
  'warehouse',
  'administration',
] as const;

export type PermissionTemplateCode = (typeof PERMISSION_TEMPLATE_CODES)[number];

export interface PermissionCatalogItem {
  code: PermissionCode;
  module: string;
  action: string;
  name: string;
  description: string;
  sortOrder: number;
}

export interface PermissionTemplate {
  code: PermissionTemplateCode;
  name: string;
  description: string;
  sortOrder: number;
  permissionCodes: PermissionCode[];
}

export interface UserPermissionProfile {
  userId: string;
  role: string;
  templateCode: PermissionTemplateCode | null;
  isCustomized: boolean;
  automatic: boolean;
  permissionCodes: PermissionCode[];
}
