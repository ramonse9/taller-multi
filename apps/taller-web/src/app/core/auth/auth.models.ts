import { SubscriptionSummary } from "../subscriptions/subscription.models";

export type UserRole = "platform_admin" | "company_admin" | "admin" | "user";

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
  subscription: SubscriptionSummary | null;
  permissions: string[];
}

export interface LoginResponse {
  accessToken: string;
  user: SessionUser;
}
