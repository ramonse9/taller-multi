import { HttpClient, HttpParams } from "@angular/common/http";
import { inject, Injectable } from "@angular/core";
import { Observable } from "rxjs";
import { environment } from "../../../environments/environment";
import {
  Expense,
  ExpenseCategory,
  ExpenseInput,
  ExpenseMonthlySummary,
  ExpenseRecurrenceType,
  ExpenseStatus,
  PaginatedExpenses,
} from "./expense.models";

@Injectable({ providedIn: "root" })
export class ExpensesService {
  private readonly http = inject(HttpClient);
  private readonly url = `${environment.apiUrl}/expenses`;

  categories(): Observable<ExpenseCategory[]> {
    return this.http.get<ExpenseCategory[]>(`${this.url}/categories`);
  }

  list(options: {
    page: number;
    limit: number;
    search?: string;
    status?: ExpenseStatus | "";
    recurrenceType?: ExpenseRecurrenceType | "";
    categoryId?: string;
    supplierId?: string;
    occurredFrom?: string;
    occurredTo?: string;
  }): Observable<PaginatedExpenses> {
    let params = new HttpParams()
      .set("page", options.page)
      .set("limit", options.limit);
    if (options.search?.trim())
      params = params.set("search", options.search.trim());
    if (options.status) params = params.set("status", options.status);
    if (options.recurrenceType)
      params = params.set("recurrenceType", options.recurrenceType);
    if (options.categoryId)
      params = params.set("categoryId", options.categoryId);
    if (options.supplierId)
      params = params.set("supplierId", options.supplierId);
    if (options.occurredFrom)
      params = params.set("occurredFrom", options.occurredFrom);
    if (options.occurredTo)
      params = params.set("occurredTo", options.occurredTo);
    return this.http.get<PaginatedExpenses>(this.url, { params });
  }

  monthlySummary(month?: string): Observable<ExpenseMonthlySummary> {
    const params = month ? new HttpParams().set("month", month) : undefined;
    return this.http.get<ExpenseMonthlySummary>(`${this.url}/summary`, {
      params,
    });
  }

  create(input: ExpenseInput): Observable<Expense> {
    return this.http.post<Expense>(this.url, input);
  }

  getOne(id: string): Observable<Expense> {
    return this.http.get<Expense>(`${this.url}/${id}`);
  }

  update(id: string, input: Partial<ExpenseInput>): Observable<Expense> {
    return this.http.patch<Expense>(`${this.url}/${id}`, input);
  }

  changeStatus(id: string, status: ExpenseStatus): Observable<Expense> {
    return this.http.post<Expense>(`${this.url}/${id}/status`, { status });
  }
}
