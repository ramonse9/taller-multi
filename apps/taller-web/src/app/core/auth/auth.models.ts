export type UserRole = "platform_admin" | "company_admin" | "user";

export interface SessionUser {
  id: string;
  email: string | null;
  username: string | null;
  loginName: string;
  phone: string | null;
  phoneVerifiedAt: string | null;
  fullName: string;
  role: UserRole;
  companyId: string | null;
  mustChangePassword: boolean;
}

export interface LoginResponse {
  accessToken: string;
  user: SessionUser;
}

export interface PasswordRecoveryRequestResponse {
  accepted: boolean;
  message: string;
  developmentCode?: string;
}

export interface PasswordRecoveryVerifyResponse {
  resetToken: string;
  expiresInSeconds: number;
}
