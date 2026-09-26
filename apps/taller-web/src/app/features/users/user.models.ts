export type TenantRole = "company_admin" | "user";

export interface TenantUser {
  id: string;
  email: string;
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
  email: string;
  password: string;
  timezoneCode: string;
  role: TenantRole;
}

export interface UpdateUserInput {
  fullName?: string;
  email?: string;
  timezoneCode?: string;
  role?: TenantRole;
  isActive?: boolean;
}
