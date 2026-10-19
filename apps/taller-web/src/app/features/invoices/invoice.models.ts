export type InvoiceStatus = "draft" | "issued" | "cancelled";
export type InvoiceCollectionStatus = "pending" | "paid";

export const INVOICE_COLLECTION_STATUS_NAMES: Record<
  InvoiceCollectionStatus,
  string
> = {
  pending: "Pendiente",
  paid: "Pagada",
};

export interface FiscalCatalogEntry {
  code: string;
  description: string;
  isActive: boolean;
  simulationSupported: boolean;
}

export interface TaxRateCatalogEntry {
  id: string;
  taxCode: string;
  factorTypeCode: string;
  rate: string | null;
  description: string;
  isActive: boolean;
  simulationSupported: boolean;
}

export interface InvoiceCatalogs {
  cfdiUses: FiscalCatalogEntry[];
  taxObjects: FiscalCatalogEntry[];
  taxes: FiscalCatalogEntry[];
  factorTypes: FiscalCatalogEntry[];
  taxRates: TaxRateCatalogEntry[];
  paymentForms: FiscalCatalogEntry[];
  paymentMethods: FiscalCatalogEntry[];
  exportCodes: FiscalCatalogEntry[];
}

export interface SimulatedInvoiceItem {
  id: string;
  orderItemId: string | null;
  position: number;
  description: string;
  productServiceCode: string | null;
  unitCode: string | null;
  unitName: string;
  quantity: string;
  unitPrice: string;
  taxObjectCode: string;
  taxCode: string | null;
  factorTypeCode: string | null;
  taxRate: string | null;
  baseAmount: string;
  taxAmount: string;
  total: string;
}

export interface SimulatedInvoiceEvent {
  id: string;
  eventType: "created" | "updated" | "issued" | "cancelled";
  details: Record<string, unknown>;
  actorUserId: string;
  actorName: string;
  createdAt: string;
}

export interface SimulatedInvoice {
  id: string;
  orderId: string;
  orderFolio: string;
  status: InvoiceStatus;
  series: string | null;
  folio: number | null;
  documentLabel: "Simulación sin validez fiscal";
  collectionStatus: InvoiceCollectionStatus;
  orderPaidAt: string | null;
  issuerFiscalName: string;
  issuerTaxId: string;
  issuerFiscalRegimeCode: string;
  issuerPostalCode: string;
  receiverFiscalName: string;
  receiverTaxId: string;
  receiverFiscalRegimeCode: string;
  receiverPostalCode: string;
  cfdiUseCode: string;
  paymentFormCode: string;
  paymentMethodCode: string;
  exportCode: string;
  currencyCode: "MXN";
  pricesIncludeTax: boolean;
  subtotal: string;
  transferredTax: string;
  total: string;
  issuedAt: string | null;
  cancelledAt: string | null;
  createdAt: string;
  updatedAt: string;
  items: SimulatedInvoiceItem[];
  events: SimulatedInvoiceEvent[];
}

export interface PaginatedInvoices {
  page: number;
  limit: number;
  totalItems: number;
  totalPages: number;
  hasNextPage: boolean;
  items: SimulatedInvoice[];
}

export interface InvoiceSettings {
  mode: "disabled" | "simulation";
  issuerType: "person" | "company" | null;
  fiscalName: string | null;
  taxId: string | null;
  fiscalRegimeCode: string | null;
  fiscalRegimeName: string | null;
  fiscalPostalCode: string | null;
  defaultSeries: string;
  nextInternalFolio: number;
  pricesIncludeTax: boolean | null;
  currencyCode: "MXN";
  isActive: boolean;
  readiness: {
    isIssuerProfileComplete: boolean;
    missingFields: Array<{ code: string; field: string; message: string }>;
    validationIssues: Array<{ code: string; field: string; message: string }>;
  };
  updatedByUserId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface InvoiceTaxInput {
  orderItemId: string;
  taxObjectCode: "01" | "02";
  taxCode?: string | null;
  factorTypeCode?: "Tasa" | "Exento" | null;
  taxRate?: number | null;
}
