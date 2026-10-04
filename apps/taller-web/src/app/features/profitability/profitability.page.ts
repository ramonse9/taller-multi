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
import { RouterLink } from "@angular/router";
import { finalize } from "rxjs";
import { formatShortDate } from "../../core/dates/date-format";
import { apiErrorMessage } from "../../core/http/api-error";
import { ThemeService } from "../../core/theme/theme.service";
import {
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
    missingProductCostOrderCount: 0,
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
  readonly loading = signal(true);
  readonly error = signal("");
  readonly periodView = signal<"day" | "month">("day");
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
    this.profitability
      .report(occurredFrom, occurredTo)
      .pipe(
        finalize(() => this.loading.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: (report) => this.report.set(report),
        error: (error: unknown) =>
          this.error.set(
            apiErrorMessage(
              error,
              "No pudimos calcular la utilidad del periodo.",
            ),
          ),
      });
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
}
