export type CustomerType = "person" | "company";

export interface FiscalReadinessItem {
  code: string;
  field: string;
  message: string;
}

export interface FiscalReadiness {
  isFiscalProfileComplete: boolean;
  isReadyToInvoice: boolean;
  missingFields: FiscalReadinessItem[];
  validationIssues: FiscalReadinessItem[];
}

export interface Client {
  id: string;
  type: CustomerType;
  displayName: string;
  legalName: string | null;
  contactName: string | null;
  taxId: string | null;
  fiscalName: string | null;
  fiscalPostalCode: string | null;
  fiscalRegimeCode: string | null;
  preferredCfdiUseCode: string | null;
  fiscalReadiness: FiscalReadiness;
  email: string | null;
  phone: string | null;
  notes: string | null;
  isActive: boolean;
  createdByUserId: string;
  updatedByUserId: string;
  createdAt: string;
  updatedAt: string;
}

export interface ClientInput {
  type: CustomerType;
  displayName: string;
  legalName: string | null;
  contactName: string | null;
  taxId: string | null;
  fiscalName?: string | null;
  fiscalPostalCode?: string | null;
  fiscalRegimeCode?: string | null;
  preferredCfdiUseCode?: string | null;
  email: string | null;
  phone: string | null;
  notes: string | null;
  isActive?: boolean;
}

export type ClientFiscalInput = Pick<
  ClientInput,
  | "taxId"
  | "fiscalName"
  | "fiscalPostalCode"
  | "fiscalRegimeCode"
  | "preferredCfdiUseCode"
>;

export interface FiscalRegime {
  code: string;
  name: string;
  supportsPerson: boolean;
  supportsCompany: boolean;
}

export interface CfdiUse {
  code: string;
  description: string;
  supportsPerson: boolean;
  supportsCompany: boolean;
  validFrom: string;
  validTo: string | null;
  isActive: boolean;
}

export interface ClientListItem extends Client {
  vehicleCount: number;
  orderCount: number;
}

export interface PaginatedClients {
  page: number;
  limit: number;
  totalItems: number;
  totalPages: number;
  hasNextPage: boolean;
  items: ClientListItem[];
}
