import { SessionUser } from "../../core/auth/auth.models";

export interface CreateCompanyInput {
  name: string;
  companyTypeCode: string;
  personTypeCode: string;
  withholdsIsr: boolean;
  withholdsIva: boolean;
  admin: {
    fullName: string;
    username: string;
    email: string | null;
    phone: string | null;
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
