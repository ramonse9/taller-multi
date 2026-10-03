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
import { ActivatedRoute, RouterLink } from "@angular/router";
import { debounceTime, distinctUntilChanged, finalize } from "rxjs";
import { formatShortDate } from "../../core/dates/date-format";
import { apiErrorMessage } from "../../core/http/api-error";
import { ThemeService } from "../../core/theme/theme.service";
import { AuthService } from "../../core/auth/auth.service";
import {
  ORDER_STATUS_NAMES,
  OrderStatus,
  PaginatedOrders,
} from "./order.models";
import { OrdersService } from "./orders.service";

const orderStatusFromQuery = (value: string | null): OrderStatus | "" =>
  value === "in_progress" || value === "completed" || value === "cancelled" ? value : "";

const paymentStatusFromQuery = (value: string | null): boolean | "" => {
  if (value === "true") return true;
  if (value === "false") return false;
  return "";
};

@Component({
  selector: "app-orders-page",
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: "./orders.page.html",
  host: {
    class: "block min-h-screen",
    "[class.dark]": "theme.isDark()",
  },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OrdersPage implements OnInit {
  private readonly orders = inject(OrdersService);
  private readonly route = inject(ActivatedRoute);
  private readonly destroyRef = inject(DestroyRef);
  readonly theme = inject(ThemeService);
  readonly auth = inject(AuthService);
  readonly formatShortDate = formatShortDate;

  readonly customerId =
    this.route.snapshot.queryParamMap.get("customerId") ?? "";
  readonly vehicleId = this.route.snapshot.queryParamMap.get("vehicleId") ?? "";
  readonly search = new FormControl("", { nonNullable: true });
  readonly status = new FormControl<OrderStatus | "">(
    orderStatusFromQuery(this.route.snapshot.queryParamMap.get("status")),
    {
      nonNullable: true,
    },
  );
  readonly isPaid = new FormControl<boolean | "">(
    paymentStatusFromQuery(this.route.snapshot.queryParamMap.get("isPaid")),
    {
      nonNullable: true,
    },
  );
  readonly loading = signal(true);
  readonly error = signal("");
  readonly data = signal<PaginatedOrders>({
    page: 1,
    limit: 20,
    totalItems: 0,
    totalPages: 0,
    hasNextPage: false,
    items: [],
  });

  ngOnInit(): void {
    this.search.valueChanges
      .pipe(
        debounceTime(300),
        distinctUntilChanged(),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe(() => this.load(1));
    this.status.valueChanges
      .pipe(distinctUntilChanged(), takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.load(1));
    this.isPaid.valueChanges
      .pipe(distinctUntilChanged(), takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.load(1));
    this.load();
  }

  load(page = this.data().page): void {
    this.loading.set(true);
    this.error.set("");
    this.orders
      .list({
        page,
        limit: 20,
        search: this.search.value,
        status: this.status.value,
        customerId: this.customerId || undefined,
        vehicleId: this.vehicleId || undefined,
        isPaid: this.isPaid.value,
      })
      .pipe(
        finalize(() => this.loading.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: (data) => this.data.set(data),
        error: (error: unknown) =>
          this.error.set(
            apiErrorMessage(error, "No pudimos cargar las órdenes."),
          ),
      });
  }

  statusName(status: OrderStatus): string {
    return ORDER_STATUS_NAMES[status];
  }

  money(value: string | null): string {
    return value === null
      ? "Por definir"
      : new Intl.NumberFormat("es-MX", {
          style: "currency",
          currency: "MXN",
        }).format(Number(value));
  }

  previous(): void {
    if (this.data().page > 1) this.load(this.data().page - 1);
  }

  next(): void {
    if (this.data().hasNextPage) this.load(this.data().page + 1);
  }
}
