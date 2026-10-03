import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  OnInit,
  inject,
  signal,
} from "@angular/core";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import {
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from "@angular/forms";
import {
  debounceTime,
  distinctUntilChanged,
  finalize,
  forkJoin,
  merge,
} from "rxjs";
import { ActivatedRoute } from "@angular/router";
import { formatShortDate } from "../../core/dates/date-format";
import { apiErrorMessage } from "../../core/http/api-error";
import { ThemeService } from "../../core/theme/theme.service";
import { Supplier } from "../suppliers/supplier.models";
import { SuppliersService } from "../suppliers/suppliers.service";
import {
  EXPENSE_STATUS_NAMES,
  ExpenseCategory,
  ExpenseInput,
  ExpenseMonthlySummary,
  ExpenseRecurrenceType,
  ExpenseStatus,
  ExpenseSummary,
  PaginatedExpenses,
} from "./expense.models";
import { ExpensesService } from "./expenses.service";

const emptyExpenses = (): PaginatedExpenses => ({
  page: 1,
  limit: 20,
  totalItems: 0,
  totalPages: 0,
  hasNextPage: false,
  items: [],
});

const currentMonth = (): string => {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
};

const today = (): string => {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
};

const emptySummary = (): ExpenseMonthlySummary => ({
  month: currentMonth(),
  previousMonth: "",
  confirmedCount: 0,
  confirmedAmount: "0.00",
  previousConfirmedCount: 0,
  previousConfirmedAmount: "0.00",
  changeAmount: "0.00",
  changePercent: null,
  direction: "same",
  draftCount: 0,
  draftAmount: "0.00",
  byCategory: [],
  recentExpenses: [],
});

@Component({
  selector: "app-expenses-page",
  imports: [ReactiveFormsModule],
  templateUrl: "./expenses.page.html",
  host: { class: "block min-h-screen", "[class.dark]": "theme.isDark()" },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ExpensesPage implements OnInit {
  private readonly expensesService = inject(ExpensesService);
  private readonly route = inject(ActivatedRoute);
  private readonly suppliersService = inject(SuppliersService);
  private readonly destroyRef = inject(DestroyRef);
  readonly theme = inject(ThemeService);
  readonly formatShortDate = formatShortDate;

  readonly data = signal<PaginatedExpenses>(emptyExpenses());
  readonly summary = signal<ExpenseMonthlySummary>(emptySummary());
  readonly categories = signal<ExpenseCategory[]>([]);
  readonly suppliers = signal<Supplier[]>([]);
  readonly loading = signal(true);
  readonly summaryLoading = signal(true);
  readonly saving = signal(false);
  readonly editorOpen = signal(false);
  readonly editing = signal<ExpenseSummary | null>(null);
  readonly error = signal("");
  readonly notice = signal("");

  readonly search = new FormControl(this.route.snapshot.queryParamMap.get("search") ?? "", {
    nonNullable: true,
  });
  readonly status = new FormControl<ExpenseStatus | "">("", { nonNullable: true });
  readonly categoryId = new FormControl("", { nonNullable: true });
  readonly supplierId = new FormControl("", { nonNullable: true });
  readonly occurredFrom = new FormControl("", { nonNullable: true });
  readonly occurredTo = new FormControl("", { nonNullable: true });
  readonly recurrenceType = new FormControl<ExpenseRecurrenceType | "">("", {
    nonNullable: true,
  });
  readonly summaryMonth = new FormControl(currentMonth(), { nonNullable: true });

  readonly form = new FormGroup({
    categoryId: new FormControl("", {
      nonNullable: true,
      validators: [Validators.required],
    }),
    supplierId: new FormControl("", { nonNullable: true }),
    occurredOn: new FormControl(today(), {
      nonNullable: true,
      validators: [Validators.required],
    }),
    description: new FormControl("", {
      nonNullable: true,
      validators: [Validators.required, Validators.maxLength(250)],
    }),
    reference: new FormControl("", {
      nonNullable: true,
      validators: [Validators.maxLength(120)],
    }),
    amount: new FormControl("", {
      nonNullable: true,
      validators: [
        Validators.required,
        Validators.pattern(/^\d{1,12}(\.\d{1,2})?$/),
      ],
    }),
    notes: new FormControl("", {
      nonNullable: true,
      validators: [Validators.maxLength(2000)],
    }),
    recurrenceType: new FormControl<ExpenseRecurrenceType>("one_time", {
      nonNullable: true,
      validators: [Validators.required],
    }),
  });

  ngOnInit(): void {
    this.search.valueChanges
      .pipe(debounceTime(300), distinctUntilChanged(), takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.load(1));
    merge(
      this.status.valueChanges,
      this.categoryId.valueChanges,
      this.supplierId.valueChanges,
      this.occurredFrom.valueChanges,
      this.occurredTo.valueChanges,
      this.recurrenceType.valueChanges,
    )
      .pipe(debounceTime(100), takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.load(1));
    this.summaryMonth.valueChanges
      .pipe(distinctUntilChanged(), takeUntilDestroyed(this.destroyRef))
      .subscribe((month) => this.loadSummary(month));
    this.loadInitial();
  }

  load(page = this.data().page): void {
    this.loading.set(true);
    this.error.set("");
    this.expensesService
      .list({
        page,
        limit: 20,
        search: this.search.value,
        status: this.status.value,
        categoryId: this.categoryId.value || undefined,
        supplierId: this.supplierId.value || undefined,
        occurredFrom: this.occurredFrom.value || undefined,
        occurredTo: this.occurredTo.value || undefined,
        recurrenceType: this.recurrenceType.value,
      })
      .pipe(finalize(() => this.loading.set(false)), takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (data) => this.data.set(data),
        error: (error: unknown) =>
          this.error.set(apiErrorMessage(error, "No pudimos cargar los gastos.")),
      });
  }

  loadSummary(month = this.summaryMonth.value): void {
    this.summaryLoading.set(true);
    this.expensesService
      .monthlySummary(month)
      .pipe(finalize(() => this.summaryLoading.set(false)), takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (summary) => this.summary.set(summary),
        error: (error: unknown) =>
          this.error.set(apiErrorMessage(error, "No pudimos cargar el resumen mensual.")),
      });
  }

  clearFilters(): void {
    this.search.setValue("", { emitEvent: false });
    this.status.setValue("", { emitEvent: false });
    this.categoryId.setValue("", { emitEvent: false });
    this.supplierId.setValue("", { emitEvent: false });
    this.occurredFrom.setValue("", { emitEvent: false });
    this.occurredTo.setValue("", { emitEvent: false });
    this.recurrenceType.setValue("", { emitEvent: false });
    this.load(1);
  }

  openEditor(expense: ExpenseSummary | null = null): void {
    if (expense && expense.status !== "draft") return;
    this.editing.set(expense);
    this.form.reset({
      categoryId: expense?.category.id ?? this.categories()[0]?.id ?? "",
      supplierId: expense?.supplier.isDefault ? "" : (expense?.supplier.id ?? ""),
      occurredOn: expense?.occurredOn ?? today(),
      description: expense?.description ?? "",
      reference: expense?.reference ?? "",
      amount: expense?.amount ?? "",
      notes: expense?.notes ?? "",
      recurrenceType: expense?.recurrenceType ?? "one_time",
    });
    this.error.set("");
    this.editorOpen.set(true);
  }

  closeEditor(): void {
    if (!this.saving()) this.editorOpen.set(false);
  }

  save(): void {
    if (this.form.invalid || this.saving()) {
      this.form.markAllAsTouched();
      return;
    }
    const raw = this.form.getRawValue();
    const input: ExpenseInput = {
      categoryId: raw.categoryId,
      ...(raw.supplierId ? { supplierId: raw.supplierId } : {}),
      occurredOn: raw.occurredOn,
      description: raw.description.trim(),
      reference: raw.reference.trim() || null,
      amount: Number(raw.amount),
      notes: raw.notes.trim() || null,
      recurrenceType: raw.recurrenceType,
    };
    const current = this.editing();
    this.saving.set(true);
    this.error.set("");
    const request = current
      ? this.expensesService.update(current.id, input)
      : this.expensesService.create(input);
    request
      .pipe(finalize(() => this.saving.set(false)), takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.editorOpen.set(false);
          this.showNotice(current ? "Gasto actualizado." : "Gasto registrado en borrador.");
          this.refresh();
        },
        error: (error: unknown) =>
          this.error.set(apiErrorMessage(error, "No pudimos guardar el gasto.")),
      });
  }

  changeStatus(expense: ExpenseSummary, status: ExpenseStatus): void {
    if (this.saving() || status === "draft") return;
    if (status === "cancelled" && !window.confirm("¿Cancelar este gasto?")) return;
    this.saving.set(true);
    this.error.set("");
    this.expensesService
      .changeStatus(expense.id, status)
      .pipe(finalize(() => this.saving.set(false)), takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.showNotice(status === "confirmed" ? "Gasto confirmado." : "Gasto cancelado.");
          this.refresh();
        },
        error: (error: unknown) =>
          this.error.set(apiErrorMessage(error, "No pudimos cambiar el estado del gasto.")),
      });
  }

  statusName(status: ExpenseStatus): string {
    return EXPENSE_STATUS_NAMES[status];
  }

  money(value: string): string {
    return new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN" }).format(
      Number(value),
    );
  }

  monthName(value: string): string {
    if (!value) return "—";
    const [year, month] = value.split("-").map(Number);
    return new Intl.DateTimeFormat("es-MX", { month: "long", year: "numeric" }).format(
      new Date(year!, month! - 1, 1),
    );
  }

  comparisonText(): string {
    const current = this.summary();
    if (current.changePercent === null) {
      return Number(current.confirmedAmount) === 0
        ? "Sin gastos confirmados para comparar"
        : "El mes anterior no tuvo gastos confirmados";
    }
    if (current.direction === "same") return "Sin cambio contra el mes anterior";
    return `${current.direction === "increase" ? "Aumento" : "Disminución"} de ${Math.abs(Number(current.changePercent)).toFixed(2)}%`;
  }

  private loadInitial(): void {
    this.loading.set(true);
    this.summaryLoading.set(true);
    forkJoin({
      expenses: this.expensesService.list({ page: 1, limit: 20 }),
      summary: this.expensesService.monthlySummary(this.summaryMonth.value),
      categories: this.expensesService.categories(),
      suppliers: this.suppliersService.list({ page: 1, limit: 100, isActive: true }),
    })
      .pipe(
        finalize(() => {
          this.loading.set(false);
          this.summaryLoading.set(false);
        }),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: ({ expenses, summary, categories, suppliers }) => {
          this.data.set(expenses);
          this.summary.set(summary);
          this.categories.set(categories);
          this.suppliers.set(suppliers.items);
        },
        error: (error: unknown) =>
          this.error.set(apiErrorMessage(error, "No pudimos cargar la administración de gastos.")),
      });
  }

  refresh(): void {
    this.load(1);
    this.loadSummary();
  }

  private showNotice(message: string): void {
    this.notice.set(message);
    window.setTimeout(() => this.notice.set(""), 3000);
  }
}
