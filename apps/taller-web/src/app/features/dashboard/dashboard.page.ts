import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  OnInit,
  computed,
  inject,
  signal,
} from "@angular/core";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { RouterLink } from "@angular/router";
import { finalize, forkJoin } from "rxjs";
import { formatShortDate } from "../../core/dates/date-format";
import { apiErrorMessage } from "../../core/http/api-error";
import { ThemeService } from "../../core/theme/theme.service";
import { AuthService } from "../../core/auth/auth.service";
import {
  DashboardActivity,
  DashboardMovementType,
  DashboardOrderStatus,
  DashboardRecordStatus,
  DashboardSummary,
} from "./dashboard.models";
import { DashboardService } from "./dashboard.service";

@Component({
  selector: "app-dashboard-page",
  imports: [RouterLink],
  templateUrl: "./dashboard.page.html",
  host: { class: "block min-h-screen", "[class.dark]": "theme.isDark()" },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DashboardPage implements OnInit {
  private readonly dashboard = inject(DashboardService);
  private readonly destroyRef = inject(DestroyRef);
  readonly auth = inject(AuthService);
  readonly theme = inject(ThemeService);
  readonly formatShortDate = formatShortDate;
  readonly summary = signal<DashboardSummary | null>(null);
  readonly activity = signal<DashboardActivity | null>(null);
  readonly loading = signal(true);
  readonly error = signal("");
  readonly empty = computed(() => {
    const summary = this.summary();
    const activity = this.activity();
    if (!summary || !activity) return false;
    return (
      summary.orders.inProgressCount === 0 &&
      summary.orders.unpaidCount === 0 &&
      summary.orders.completedPaidCount === 0 &&
      (activity.recentPurchases?.length ?? 0) === 0 &&
      (activity.recentExpenses?.length ?? 0) === 0 &&
      (activity.recentInventoryMovements?.length ?? 0) === 0 &&
      (activity.lowStock?.totalProducts ?? 0) === 0
    );
  });

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.error.set("");
    forkJoin({
      summary: this.dashboard.summary(),
      activity: this.dashboard.activity(),
    })
      .pipe(
        finalize(() => this.loading.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: ({ summary, activity }) => {
          this.summary.set(summary);
          this.activity.set(activity);
        },
        error: (error: unknown) =>
          this.error.set(
            apiErrorMessage(error, "No pudimos cargar el tablero."),
          ),
      });
  }

  money(value: string | null): string {
    return value === null
      ? "Por definir"
      : new Intl.NumberFormat("es-MX", {
          style: "currency",
          currency: "MXN",
        }).format(Number(value));
  }

  financialWarning(
    financials: NonNullable<DashboardSummary["financials"]>,
  ): string {
    const count = financials.incompleteOrderCount;
    const order = count === 1 ? "orden terminada" : "órdenes terminadas";
    const verb = count === 1 ? "contiene" : "contienen";
    const issue =
      financials.missingPriceOrderCount > 0 &&
      financials.missingProductCostOrderCount > 0
        ? "conceptos sin precio o productos sin costo"
        : financials.missingPriceOrderCount > 0
          ? "conceptos sin precio"
          : "productos sin costo";
    return `Revisa ${count} ${order}: ${verb} ${issue} y su utilidad todavía no es exacta.`;
  }

  number(value: string): string {
    return new Intl.NumberFormat("es-MX", { maximumFractionDigits: 3 }).format(
      Number(value),
    );
  }

  monthName(value: string): string {
    const [year, month] = value.split("-").map(Number);
    return new Intl.DateTimeFormat("es-MX", {
      month: "long",
      year: "numeric",
    }).format(new Date(year!, month! - 1, 1));
  }

  orderStatusName(status: DashboardOrderStatus): string {
    return {
      in_progress: "En proceso",
      completed: "Terminada",
      cancelled: "Cancelada",
    }[status];
  }

  recordStatusName(status: DashboardRecordStatus): string {
    return {
      draft: "Borrador",
      confirmed: "Confirmada",
      cancelled: "Cancelada",
    }[status];
  }

  movementName(type: DashboardMovementType): string {
    return { entry: "Entrada", exit: "Salida", adjustment: "Ajuste" }[type];
  }
}
