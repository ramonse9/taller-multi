export interface Supplier {
  id: string;
  commercialName: string;
  legalName: string | null;
  taxId: string | null;
  phone: string | null;
  email: string | null;
  notes: string | null;
  isActive: boolean;
  isDefault: boolean;
  createdByUserId: string | null;
  updatedByUserId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface PaginatedSuppliers {
  page: number;
  limit: number;
  totalItems: number;
  totalPages: number;
  hasNextPage: boolean;
  items: Supplier[];
}

export interface SupplierInput {
  commercialName: string;
  legalName?: string | null;
  taxId?: string | null;
  phone?: string | null;
  email?: string | null;
  notes?: string | null;
  isActive?: boolean;
}
