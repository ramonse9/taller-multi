import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  OnInit,
  inject,
  signal,
} from "@angular/core";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { FormControl, ReactiveFormsModule } from "@angular/forms";
import { RouterLink } from "@angular/router";
import { debounceTime, distinctUntilChanged, finalize, forkJoin } from "rxjs";
import { formatShortDate } from "../../core/dates/date-format";
import { apiErrorMessage } from "../../core/http/api-error";
import { ThemeService } from "../../core/theme/theme.service";
import { Supplier } from "../suppliers/supplier.models";
import { SuppliersService } from "../suppliers/suppliers.service";
import {
  PaginatedPurchases,
  PURCHASE_STATUS_NAMES,
  PurchaseStatus,
} from "./purchase.models";
import { PurchasesService } from "./purchases.service";

const emptyPurchases = (): PaginatedPurchases => ({
  page: 1,
  limit: 20,
  totalItems: 0,
  totalPages: 0,
  hasNextPage: false,
  items: [],
});

@Component({
  selector: "app-purchases-page",
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: "./purchases.page.html",
  host: { class: "block min-h-screen", "[class.dark]": "theme.isDark()" },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PurchasesPage implements OnInit {
  private readonly purchasesService = inject(PurchasesService);
  private readonly suppliersService = inject(SuppliersService);
  private readonly destroyRef = inject(DestroyRef);
  readonly theme = inject(ThemeService);
  readonly formatShortDate = formatShortDate;

  readonly data = signal<PaginatedPurchases>(emptyPurchases());
  readonly suppliers = signal<Supplier[]>([]);
  readonly loading = signal(true);
  readonly error = signal("");
  readonly search = new FormControl("", { nonNullable: true });
  readonly status = new FormControl<PurchaseStatus | "">("", { nonNullable: true });
  readonly supplierId = new FormControl("", { nonNullable: true });

  ngOnInit(): void {
    this.search.valueChanges
      .pipe(debounceTime(300), distinctUntilChanged(), takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.load(1));
    this.status.valueChanges
      .pipe(distinctUntilChanged(), takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.load(1));
    this.supplierId.valueChanges
      .pipe(distinctUntilChanged(), takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.load(1));
    this.loadInitial();
  }

  load(page = this.data().page): void {
    this.loading.set(true);
    this.error.set("");
    this.purchasesService
      .list({
        page,
        limit: 20,
        search: this.search.value,
        status: this.status.value,
        supplierId: this.supplierId.value || undefined,
      })
      .pipe(finalize(() => this.loading.set(false)), takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (data) => this.data.set(data),
        error: (error: unknown) =>
          this.error.set(apiErrorMessage(error, "No pudimos cargar las compras.")),
      });
  }

  statusName(status: PurchaseStatus): string {
    return PURCHASE_STATUS_NAMES[status];
  }

  money(value: string): string {
    return new Intl.NumberFormat("es-MX", {
      style: "currency",
      currency: "MXN",
    }).format(Number(value));
  }

  private loadInitial(): void {
    this.loading.set(true);
    forkJoin({
      purchases: this.purchasesService.list({ page: 1, limit: 20 }),
      suppliers: this.suppliersService.list({ page: 1, limit: 100, isActive: true }),
    })
      .pipe(finalize(() => this.loading.set(false)), takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: ({ purchases, suppliers }) => {
          this.data.set(purchases);
          this.suppliers.set(suppliers.items);
        },
        error: (error: unknown) =>
          this.error.set(apiErrorMessage(error, "No pudimos cargar las compras.")),
      });
  }
}
