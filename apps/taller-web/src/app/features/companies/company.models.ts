import { SessionUser } from "../../core/auth/auth.models";

export interface CreateCompanyInput {
  name: string;
  schemaName: string;
  companyTypeCode: string;
  personTypeCode: string;
  withholdsIsr: boolean;
  withholdsIva: boolean;
  admin: {
    fullName: string;
    email: string;
    password: string;
    timezoneCode: string;
  };
}

export interface CompanyResponse {
  id: string;
  name: string;
  schemaName: string;
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
