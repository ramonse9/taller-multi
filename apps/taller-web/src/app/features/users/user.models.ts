export type TenantRole = "company_admin" | "admin" | "user";

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

export interface UpdateUserInput {
  fullName?: string;
  username?: string;
  email?: string | null;
  phone?: string;
  timezoneCode?: string;
  role?: TenantRole;
  isActive?: boolean;
}
