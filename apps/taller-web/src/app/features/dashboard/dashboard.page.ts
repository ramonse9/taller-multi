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
  DashboardAnalytics,
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
  readonly analytics = signal<DashboardAnalytics | null>(null);
  readonly analyticsMonths = signal<6 | 12>(6);
  readonly analyticsLoading = signal(false);
  readonly analyticsError = signal("");
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
  readonly analyticsEmpty = computed(() => {
    const analytics = this.analytics();
    if (!analytics) return false;
    return analytics.series.every(
      (month) =>
        Number(month.generatedIncome) === 0 &&
        Number(month.collectedIncome) === 0 &&
        Number(month.operatingExpenses) === 0,
    );
  });
  readonly monthlyBarMax = computed(() => {
    const summary = this.analytics()?.summary;
    if (!summary) return 1;
    return Math.max(
      1,
      Math.abs(Number(summary.generatedIncome)),
      Math.abs(Number(summary.generatedDirectCost)),
      Math.abs(Number(summary.operatingExpenses)),
      Math.abs(Number(summary.generatedNetProfit)),
    );
  });
  readonly lineChart = computed(() => {
    const series = this.analytics()?.series ?? [];
    if (series.length === 0) return { points: "", values: [], zeroY: 170 };
    const numbers = series.map((month) => Number(month.generatedNetProfit));
    let min = Math.min(0, ...numbers);
    let max = Math.max(0, ...numbers);
    if (min === max) {
      min -= 1;
      max += 1;
    }
    const range = max - min;
    const width = 600;
    const height = 190;
    const horizontalPadding = 24;
    const verticalPadding = 20;
    const plotWidth = width - horizontalPadding * 2;
    const plotHeight = height - verticalPadding * 2;
    const values = series.map((month, index) => {
      const x =
        horizontalPadding +
        (series.length === 1
          ? plotWidth / 2
          : (index / (series.length - 1)) * plotWidth);
      const y =
        verticalPadding + ((max - numbers[index]!) / range) * plotHeight;
      return { ...month, x, y };
    });
    return {
      points: values.map(({ x, y }) => `${x},${y}`).join(" "),
      values,
      zeroY: verticalPadding + ((max - 0) / range) * plotHeight,
    };
  });

  readonly expenseColors = [
    "#4388c5",
    "#e28a4b",
    "#6da77f",
    "#a678b4",
    "#d2aa3f",
    "#c76262",
  ];

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
          if (summary.access.includesFinancials) this.loadAnalytics();
          else this.analytics.set(null);
        },
        error: (error: unknown) =>
          this.error.set(
            apiErrorMessage(error, "No pudimos cargar el tablero."),
          ),
      });
  }

  loadAnalytics(months = this.analyticsMonths()): void {
    this.analyticsMonths.set(months);
    this.analyticsLoading.set(true);
    this.analyticsError.set("");
    this.dashboard
      .analytics(months)
      .pipe(
        finalize(() => this.analyticsLoading.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: (analytics) => this.analytics.set(analytics),
        error: (error: unknown) => {
          this.analytics.set(null);
          this.analyticsError.set(
            apiErrorMessage(error, "No pudimos cargar las gráficas."),
          );
        },
      });
  }

  barHeight(value: string): number {
    return Math.max(3, (Math.abs(Number(value)) / this.monthlyBarMax()) * 100);
  }

  collectionDonut(): string {
    const collection = this.analytics()?.collection;
    if (!collection) return "conic-gradient(#d9e0e6 0 100%)";
    const paid = Number(collection.paidAmount);
    const pending = Number(collection.pendingAmount);
    const total = paid + pending;
    if (total === 0) return "conic-gradient(#d9e0e6 0 100%)";
    const paidPercentage = (paid / total) * 100;
    return `conic-gradient(#4388c5 0 ${paidPercentage}%, #e2a348 ${paidPercentage}% 100%)`;
  }

  expensesDonut(): string {
    const categories = this.analytics()?.expensesByCategory ?? [];
    const total = categories.reduce(
      (sum, category) => sum + Number(category.amount),
      0,
    );
    if (total === 0) return "conic-gradient(#d9e0e6 0 100%)";
    let accumulated = 0;
    const stops = categories.map((category, index) => {
      const start = accumulated;
      accumulated += (Number(category.amount) / total) * 100;
      return `${this.expenseColors[index % this.expenseColors.length]} ${start}% ${accumulated}%`;
    });
    return `conic-gradient(${stops.join(", ")})`;
  }

  shortMonth(period: string): string {
    const [year, month] = period.split("-").map(Number);
    return new Intl.DateTimeFormat("es-MX", { month: "short" })
      .format(new Date(year!, month! - 1, 1))
      .replace(".", "");
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
      financials.missingCostOrderCount > 0
        ? "conceptos cobrables sin precio y productos libres sin costo"
        : financials.missingPriceOrderCount > 0
          ? "conceptos cobrables sin precio"
          : "productos libres sin costo";
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
