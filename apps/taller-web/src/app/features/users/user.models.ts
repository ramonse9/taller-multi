export type TenantRole = "company_admin" | "admin" | "user";

export type PermissionTemplateCode =
  "reception" | "mechanic" | "warehouse" | "administration";

export interface PermissionCatalogItem {
  code: string;
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
  permissionCodes: string[];
}

export interface UserPermissionProfile {
  userId: string;
  role: TenantRole;
  templateCode: PermissionTemplateCode | null;
  isCustomized: boolean;
  automatic: boolean;
  permissionCodes: string[];
}

export interface UpdateUserPermissionsInput {
  templateCode: PermissionTemplateCode | null;
  permissionCodes: string[];
}

export interface TenantUser {
  id: string;
  email: string | null;
  username: string;
  loginName: string;
  phone: string | null;
  phoneVerifiedAt: string | null;
  fullName: string;
  role: TenantRole;
  companyId: string;
  timezoneCode: string;
  isActive: boolean;
  mustChangePassword: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface PaginatedUsers {
  page: number;
  limit: number;
  totalItems: number;
  totalPages: number;
  hasNextPage: boolean;
  items: TenantUser[];
}

export interface CreateUserInput {
  fullName: string;
  username: string;
  email: string | null;
  phone: string;
  password: string;
  timezoneCode: string;
  role: TenantRole;
}

export interface CreatePlatformCompanyUserInput extends CreateUserInput {
  templateCode?: PermissionTemplateCode | null;
  permissionCodes?: string[];
}

export interface PlatformCompanyUserResponse {
  user: TenantUser;
  templateCode: PermissionTemplateCode | null;
  isCustomized: boolean;
  automatic: boolean;
  permissionCodes: string[];
}

export interface UpdateUserInput {
  fullName?: string;
  username?: string;
  email?: string | null;
  phone?: string;
  timezoneCode?: string;
  role?: TenantRole;
  isActive?: boolean;
}
