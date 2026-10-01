export type ConceptKind = "product" | "service";

export interface MeasurementUnit {
  id: string;
  name: string;
  symbol: string;
  satCode: string | null;
  allowsDecimals: boolean;
  isActive: boolean;
}

export interface CatalogConcept {
  id: string;
  kind: ConceptKind;
  sku: string | null;
  name: string;
  description: string | null;
  unit: MeasurementUnit;
  cost: string;
  price: string;
  tracksInventory: boolean;
  stock: string;
  minimumStock: string;
  isLowStock: boolean;
  satProductServiceCode: string | null;
  isActive: boolean;
}

export interface PaginatedConcepts {
  page: number;
  limit: number;
  totalItems: number;
  totalPages: number;
  hasNextPage: boolean;
  items: CatalogConcept[];
}
