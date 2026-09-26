export type UserRole = "platform_admin" | "company_admin" | "user";

export interface SessionUser {
  id: string;
  email: string;
  fullName: string;
  role: UserRole;
  companyId: string | null;
}

export interface LoginResponse {
  accessToken: string;
  user: SessionUser;
}
