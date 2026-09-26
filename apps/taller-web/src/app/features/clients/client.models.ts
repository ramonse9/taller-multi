export interface Client {
  id: string;
  fullName: string;
  corporateCustomerId: string | null;
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
  fullName: string;
  taxId: string | null;
  email: string | null;
  phone: string | null;
  notes: string | null;
  isActive?: boolean;
}

export interface PaginatedClients {
  page: number;
  limit: number;
  totalItems: number;
  totalPages: number;
  hasNextPage: boolean;
  items: Client[];
}
