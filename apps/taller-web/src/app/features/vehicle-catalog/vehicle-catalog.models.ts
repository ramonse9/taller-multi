export interface VehicleBrand {
  id: string;
  name: string;
  isActive: boolean;
  createdByUserId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface VehicleModel extends VehicleBrand {
  brandId: string;
  brandName: string;
}

export interface PaginatedCatalog<T> {
  page: number;
  limit: number;
  totalItems: number;
  totalPages: number;
  hasNextPage: boolean;
  items: T[];
}

export interface CatalogListOptions {
  page: number;
  limit: number;
  search: string;
  isActive: boolean;
}
