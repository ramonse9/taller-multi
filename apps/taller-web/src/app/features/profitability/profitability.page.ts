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
import {
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from "@angular/forms";
import { RouterLink } from "@angular/router";
import { finalize, forkJoin } from "rxjs";
import { formatShortDate } from "../../core/dates/date-format";
import { apiErrorMessage } from "../../core/http/api-error";
import { ThemeService } from "../../core/theme/theme.service";
import {
  ProfitabilityAnalytics,
  ProfitabilityOrderRow,
  ProfitabilityPeriodRow,
  ProfitabilityReport,
} from "./profitability.models";
import { ProfitabilityService } from "./profitability.service";

const localDate = (date: Date): string =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;

const defaultDates = (): { from: string; to: string } => {
  const now = new Date();
  return {
    from: localDate(new Date(now.getFullYear(), now.getMonth(), 1)),
    to: localDate(now),
  };
};

const emptyReport = (): ProfitabilityReport => ({
  occurredFrom: defaultDates().from,
  occurredTo: defaultDates().to,
  totals: {
    completedOrderCount: 0,
    incompleteOrderCount: 0,
    missingPriceOrderCount: 0,
    missingCostOrderCount: 0,
    paidCompletedOrderCount: 0,
    unpaidCompletedOrderCount: 0,
    receivableOrderCount: 0,
    income: "0.00",
    collectedIncome: "0.00",
    outstandingIncome: "0.00",
    receivableAmount: "0.00",
    directCost: "0.00",
    fifoProductCost: "0.00",
    grossProfit: "0.00",
    collectedGrossProfit: "0.00",
    operatingExpenses: "0.00",
    netProfit: "0.00",
    collectedNetResult: "0.00",
    grossMarginPercent: null,
    netMarginPercent: null,
    isComplete: true,
  },
  byDay: [],
  byMonth: [],
  byCustomer: [],
  byServiceType: [],
  orders: [],
});

@Component({
  selector: "app-profitability-page",
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: "./profitability.page.html",
  host: { class: "block min-h-screen", "[class.dark]": "theme.isDark()" },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProfitabilityPage implements OnInit {
  private readonly profitability = inject(ProfitabilityService);
  private readonly destroyRef = inject(DestroyRef);
  readonly theme = inject(ThemeService);
  readonly formatShortDate = formatShortDate;
  readonly report = signal<ProfitabilityReport>(emptyReport());
  readonly analytics = signal<ProfitabilityAnalytics | null>(null);
  readonly historyMonths = signal<6 | 12>(6);
  readonly selectedMonthPeriod = signal<string | null>(null);
  readonly loading = signal(true);
  readonly error = signal("");
  readonly periodView = signal<"day" | "month">("day");
  readonly profitableOrders = computed(() =>
    this.report()
      .orders.filter((order) => order.isComplete && order.grossProfit !== null)
      .slice()
      .sort(
        (left, right) => Number(right.grossProfit) - Number(left.grossProfit),
      )
      .slice(0, 5),
  );
  readonly leastProfitableOrders = computed(() =>
    this.report()
      .orders.filter((order) => order.isComplete && order.grossProfit !== null)
      .slice()
      .sort(
        (left, right) => Number(left.grossProfit) - Number(right.grossProfit),
      )
      .slice(0, 5),
  );
  readonly incompleteOrders = computed(() =>
    this.report().orders.filter((order) => !order.isComplete),
  );
  readonly monthlyComparisonMax = computed(() => {
    const series = this.analytics()?.series ?? [];
    return Math.max(
      1,
      ...series.flatMap((month) => [
        Math.abs(Number(month.generatedIncome)),
        Math.abs(Number(month.generatedDirectCost)),
        Math.abs(Number(month.generatedNetProfit)),
      ]),
    );
  });
  readonly selectedMonth = computed(() => {
    const series = this.analytics()?.series ?? [];
    const selected = this.selectedMonthPeriod();
    return (
      series.find((month) => month.period === selected) ?? series.at(-1) ?? null
    );
  });
  readonly waterfallMax = computed(() => {
    const totals = this.report().totals;
    return Math.max(
      1,
      Math.abs(Number(totals.income)),
      Math.abs(Number(totals.directCost)),
      Math.abs(Number(totals.grossProfit)),
      Math.abs(Number(totals.operatingExpenses)),
      Math.abs(Number(totals.netProfit)),
    );
  });
  readonly marginChart = computed(() => {
    const series = this.analytics()?.series ?? [];
    const available = series
      .map((month, index) => ({ month, index }))
      .filter(({ month }) => month.generatedNetMarginPercent !== null);
    if (available.length === 0)
      return { segments: [] as string[], values: [], zeroY: 170 };
    const numbers = available.map(({ month }) =>
      Number(month.generatedNetMarginPercent),
    );
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
    const values = available.map(({ month, index }) => {
      const x =
        horizontalPadding +
        (series.length === 1
          ? plotWidth / 2
          : (index / (series.length - 1)) * plotWidth);
      const y =
        verticalPadding +
        ((max - Number(month.generatedNetMarginPercent)) / range) * plotHeight;
      return { ...month, seriesIndex: index, x, y };
    });
    const segments: string[] = [];
    let current: typeof values = [];
    for (const value of values) {
      const previous = current.at(-1);
      if (previous && value.seriesIndex - previous.seriesIndex > 1) {
        if (current.length > 1) {
          segments.push(current.map(({ x, y }) => `${x},${y}`).join(" "));
        }
        current = [];
      }
      current.push(value);
    }
    if (current.length > 1) {
      segments.push(current.map(({ x, y }) => `${x},${y}`).join(" "));
    }
    return {
      segments,
      values,
      zeroY: verticalPadding + ((max - 0) / range) * plotHeight,
    };
  });
  readonly filters = new FormGroup({
    occurredFrom: new FormControl(defaultDates().from, {
      nonNullable: true,
      validators: [Validators.required],
    }),
    occurredTo: new FormControl(defaultDates().to, {
      nonNullable: true,
      validators: [Validators.required],
    }),
  });

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    if (this.filters.invalid) {
      this.filters.markAllAsTouched();
      return;
    }
    const { occurredFrom, occurredTo } = this.filters.getRawValue();
    if (occurredFrom > occurredTo) {
      this.error.set(
        "La fecha inicial no puede ser posterior a la fecha final.",
      );
      return;
    }
    this.loading.set(true);
    this.error.set("");
    forkJoin({
      report: this.profitability.report(occurredFrom, occurredTo),
      analytics: this.profitability.analytics(
        this.historyMonths(),
        occurredTo.slice(0, 7),
      ),
    })
      .pipe(
        finalize(() => this.loading.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: ({ report, analytics }) => {
          this.report.set(report);
          this.analytics.set(analytics);
          if (
            !analytics.series.some(
              ({ period }) => period === this.selectedMonthPeriod(),
            )
          ) {
            this.selectedMonthPeriod.set(
              analytics.series.at(-1)?.period ?? null,
            );
          }
        },
        error: (error: unknown) =>
          this.error.set(
            apiErrorMessage(
              error,
              "No pudimos calcular la utilidad del periodo.",
            ),
          ),
      });
  }

  applyHistoryPeriod(months: 6 | 12): void {
    const now = new Date();
    const from = new Date(now.getFullYear(), now.getMonth() - months + 1, 1);
    this.historyMonths.set(months);
    this.filters.setValue({
      occurredFrom: localDate(from),
      occurredTo: localDate(now),
    });
    this.periodView.set("month");
    this.load();
  }

  periodRows(): ProfitabilityPeriodRow[] {
    return this.periodView() === "day"
      ? this.report().byDay
      : this.report().byMonth;
  }

  money(value: string | null): string {
    if (value === null) return "Pendiente";
    return new Intl.NumberFormat("es-MX", {
      style: "currency",
      currency: "MXN",
    }).format(Number(value));
  }

  percent(value: string | null): string {
    return value === null ? "—" : `${Number(value).toFixed(2)}%`;
  }

  periodName(value: string): string {
    if (value.length === 10) return formatShortDate(value);
    const [year, month] = value.split("-").map(Number);
    return new Intl.DateTimeFormat("es-MX", {
      month: "long",
      year: "numeric",
    }).format(new Date(year!, month! - 1, 1));
  }

  shortMonth(value: string): string {
    const [year, month] = value.split("-").map(Number);
    return new Intl.DateTimeFormat("es-MX", { month: "short" })
      .format(new Date(year!, month! - 1, 1))
      .replace(".", "");
  }

  comparisonHeight(value: string): number {
    if (Number(value) === 0) return 0;
    return Math.max(
      2,
      (Math.abs(Number(value)) / this.monthlyComparisonMax()) * 100,
    );
  }

  selectMonth(period: string): void {
    this.selectedMonthPeriod.set(period);
  }

  monthHasMovement(month: ProfitabilityAnalytics["series"][number]): boolean {
    return (
      month.completedOrderCount > 0 ||
      month.collectedOrderCount > 0 ||
      Number(month.operatingExpenses) !== 0
    );
  }

  waterfallWidth(value: string): number {
    return Math.max(3, (Math.abs(Number(value)) / this.waterfallMax()) * 100);
  }

  orderMargin(order: ProfitabilityOrderRow): string {
    if (
      order.income === null ||
      Number(order.income) === 0 ||
      order.grossProfit === null
    )
      return "—";
    return `${((Number(order.grossProfit) / Number(order.income)) * 100).toFixed(2)}%`;
  }

  incompleteReason(order: ProfitabilityOrderRow): string {
    const reasons: string[] = [];
    if (order.income === null) reasons.push("precio pendiente");
    if (order.directCost === null) reasons.push("costo pendiente");
    return reasons.join(" y ") || "información incompleta";
  }
}
