import { PermissionCode } from './permission.types';

export const ORDER_PAYMENT_PERMISSIONS = [
  'orders.edit',
  'orders.manage_payment',
] as const satisfies readonly PermissionCode[];

export const ORDER_MANUAL_COST_PERMISSIONS = [
  'orders.create',
  'orders.edit',
] as const satisfies readonly PermissionCode[];
