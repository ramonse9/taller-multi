export type UserRole = "platform_admin" | "company_admin" | "user";

export interface SessionUser {
  id: string;
  email: string | null;
  username: string | null;
  loginName: string;
  phone: string | null;
  fullName: string;
  role: UserRole;
  companyId: string | null;
  mustChangePassword: boolean;
}

export interface LoginResponse {
  accessToken: string;
  user: SessionUser;
}
