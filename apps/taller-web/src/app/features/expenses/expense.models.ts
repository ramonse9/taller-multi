export type ExpenseStatus = "draft" | "confirmed" | "cancelled";
export type ExpenseRecurrenceType = "one_time" | "recurring";

export const EXPENSE_STATUS_NAMES: Record<ExpenseStatus, string> = {
  draft: "Borrador",
  confirmed: "Confirmado",
  cancelled: "Cancelado",
};

export interface ExpenseCategory {
  id: string;
  code: string;
  name: string;
  isActive: boolean;
  isSystem: boolean;
}

export interface ExpenseSupplier {
  id: string;
  commercialName: string;
  isDefault: boolean;
}

export interface ExpenseSummary {
  id: string;
  category: ExpenseCategory;
  supplier: ExpenseSupplier;
  status: ExpenseStatus;
  recurrenceType: ExpenseRecurrenceType;
  occurredOn: string;
  description: string;
  reference: string | null;
  amount: string;
  notes: string | null;
  receiptFileKey: string | null;
  confirmedAt: string | null;
  cancelledAt: string | null;
  createdByUserId: string;
  updatedByUserId: string;
  createdAt: string;
  updatedAt: string;
}

export interface ExpenseStatusHistory {
  id: string;
  previousStatus: ExpenseStatus | null;
  newStatus: ExpenseStatus;
  changedByUserId: string;
  changedByName: string;
  changedAt: string;
}

export interface ExpenseChangeHistory {
  id: string;
  changedFields: string[];
  previousValues: Record<string, string | null>;
  newValues: Record<string, string | null>;
  changedByUserId: string;
  changedByName: string;
  changedAt: string;
}

export interface Expense extends ExpenseSummary {
  statusHistory: ExpenseStatusHistory[];
  changeHistory: ExpenseChangeHistory[];
}

export interface PaginatedExpenses {
  page: number;
  limit: number;
  totalItems: number;
  totalPages: number;
  hasNextPage: boolean;
  items: ExpenseSummary[];
}

export interface ExpenseInput {
  categoryId: string;
  supplierId?: string;
  occurredOn: string;
  description: string;
  reference?: string | null;
  amount: number;
  notes?: string | null;
  recurrenceType?: ExpenseRecurrenceType;
}

export interface ExpenseCategoryAmount {
  category: ExpenseCategory;
  count: number;
  amount: string;
}

export interface ExpenseMonthlySummary {
  month: string;
  previousMonth: string;
  confirmedCount: number;
  confirmedAmount: string;
  previousConfirmedCount: number;
  previousConfirmedAmount: string;
  changeAmount: string;
  changePercent: string | null;
  direction: "increase" | "decrease" | "same";
  draftCount: number;
  draftAmount: string;
  byCategory: ExpenseCategoryAmount[];
  recentExpenses: ExpenseSummary[];
}
