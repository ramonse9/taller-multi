import { SessionUser } from "../../core/auth/auth.models";
import { SubscriptionPlanCode } from "../../core/subscriptions/subscription.models";

export interface CreateCompanyInput {
  name: string;
  loginCode: string;
  companyTypeCode: string;
  personTypeCode: string;
  withholdsIsr: boolean;
  withholdsIva: boolean;
  planCode: SubscriptionPlanCode;
  trialDays: number;
  admin: {
    fullName: string;
    username: string;
    email: string | null;
    phone: string;
    password: string;
    timezoneCode: string;
  };
}

export interface CompanyResponse {
  id: string;
  name: string;
  schemaName: string;
  loginCode: string;
  companyTypeCode: string;
  personTypeCode: string;
  isActive: boolean;
  withholdsIsr: boolean;
  withholdsIva: boolean;
  createdAt: string;
  admin: SessionUser & {
    timezoneCode: string;
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
  };
}
