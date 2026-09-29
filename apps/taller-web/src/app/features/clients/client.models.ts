export type CustomerType = "person" | "company";

export interface Client {
  id: string;
  type: CustomerType;
  displayName: string;
  legalName: string | null;
  contactName: string | null;
  taxId: string | null;
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
  email: string | null;
  phone: string | null;
  notes: string | null;
  isActive?: boolean;
}

export interface ClientListItem extends Client {
  vehicleCount: number;
}

export interface PaginatedClients {
  page: number;
  limit: number;
  totalItems: number;
  totalPages: number;
  hasNextPage: boolean;
  items: ClientListItem[];
}
