import {
  ChangeDetectionStrategy,
  Component,
  computed,
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
import { ActivatedRoute, Router, RouterLink } from "@angular/router";
import { finalize, forkJoin, of } from "rxjs";
import { AuthService } from "../../core/auth/auth.service";
import { formatShortDate } from "../../core/dates/date-format";
import { apiErrorMessage } from "../../core/http/api-error";
import { ThemeService } from "../../core/theme/theme.service";
import {
  INVOICE_COLLECTION_STATUS_NAMES,
  InvoiceCollectionStatus,
  InvoiceCatalogs,
  InvoiceReconciliationSummary,
  InvoiceSettings,
  InvoiceStatus,
  PaginatedInvoices,
} from "./invoice.models";
import { InvoicesService } from "./invoices.service";

const emptyList = (): PaginatedInvoices => ({
  page: 1,
  limit: 20,
  totalItems: 0,
  totalPages: 0,
  hasNextPage: false,
  items: [],
});

const invoiceStatusFromQuery = (value: string | null): InvoiceStatus | "" =>
  value === "draft" ||
  value === "issued" ||
  value === "cancelled" ||
  value === "discarded"
    ? value
    : "";

@Component({
  selector: "app-invoices-page",
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: "./invoices.page.html",
  host: { class: "block min-h-screen", "[class.dark]": "theme.isDark()" },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class InvoicesPage implements OnInit {
  private readonly invoicesService = inject(InvoicesService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);
  readonly auth = inject(AuthService);
  readonly theme = inject(ThemeService);
  readonly formatShortDate = formatShortDate;
  readonly readOnly = computed(
    () =>
      !this.auth.hasFeature("invoicing") &&
      this.auth.hasFeatureReadAccess("invoicing"),
  );

  readonly orderId = this.route.snapshot.queryParamMap.get("orderId") ?? "";
  readonly loading = signal(true);
  readonly summaryLoading = signal(true);
  readonly saving = signal(false);
  readonly error = signal("");
  readonly summaryError = signal("");
  readonly notice = signal("");
  readonly summary = signal<InvoiceReconciliationSummary | null>(null);
  readonly settings = signal<InvoiceSettings | null>(null);
  readonly catalogs = signal<InvoiceCatalogs | null>(null);
  readonly invoices = signal<PaginatedInvoices>(emptyList());
  readonly status = new FormControl<InvoiceStatus | "">(
    invoiceStatusFromQuery(this.route.snapshot.queryParamMap.get("status")),
    { nonNullable: true },
  );
  readonly summaryEmpty = computed(() => {
    const summary = this.summary();
    return (
      summary !== null &&
      summary.pendingToInvoiceCount === 0 &&
      summary.activeDraftCount === 0 &&
      summary.issuedSimulationCount === 0 &&
      summary.cancelledSimulationCount === 0 &&
      summary.ppdPendingCollectionCount === 0
    );
  });
  readonly accountingView = computed(
    () =>
      this.auth.hasPermission("invoices.view") &&
      !this.auth.hasPermission("profitability.view"),
  );

  readonly createForm = new FormGroup({
    cfdiUseCode: new FormControl("G03", {
      nonNullable: true,
      validators: [Validators.required],
    }),
    paymentMethodCode: new FormControl<"PUE" | "PPD">("PUE", {
      nonNullable: true,
      validators: [Validators.required],
    }),
    paymentFormCode: new FormControl("03", {
      nonNullable: true,
      validators: [Validators.required],
    }),
  });

  readonly settingsForm = new FormGroup({
    fiscalName: new FormControl("", {
      nonNullable: true,
      validators: [Validators.required],
    }),
    taxId: new FormControl("", {
      nonNullable: true,
      validators: [Validators.required],
    }),
    fiscalRegimeCode: new FormControl("", {
      nonNullable: true,
      validators: [Validators.required],
    }),
    fiscalPostalCode: new FormControl("", {
      nonNullable: true,
      validators: [Validators.required, Validators.pattern(/^\d{5}$/)],
    }),
    defaultSeries: new FormControl("A", {
      nonNullable: true,
      validators: [Validators.required],
    }),
    pricesIncludeTax: new FormControl(true, { nonNullable: true }),
    isActive: new FormControl(false, { nonNullable: true }),
  });

  ngOnInit(): void {
    this.loadSummary();
    this.status.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.loadList(1));
    this.route.queryParamMap
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((parameters) => {
        const status = invoiceStatusFromQuery(parameters.get("status"));
        if (status !== this.status.value) this.status.setValue(status);
      });
    this.createForm.controls.paymentMethodCode.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((method) => {
        if (method === "PPD")
          this.createForm.controls.paymentFormCode.setValue("99");
        else if (this.createForm.controls.paymentFormCode.value === "99") {
          this.createForm.controls.paymentFormCode.setValue("03");
        }
      });
    forkJoin({
      settings:
        this.auth.user()?.role === "company_admin" &&
        this.auth.hasPermission("invoices.configure")
          ? this.invoicesService.settings()
          : of(null),
      catalogs: this.invoicesService.catalogs(),
      invoices: this.invoicesService.list(1, this.status.value),
    })
      .pipe(
        finalize(() => this.loading.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: ({ settings, catalogs, invoices }) => {
          this.settings.set(settings);
          this.catalogs.set(catalogs);
          this.invoices.set(invoices);
          if (settings) this.populateSettings(settings);
        },
        error: (error: unknown) =>
          this.error.set(
            apiErrorMessage(error, "No pudimos cargar Facturación."),
          ),
      });
  }

  loadSummary(): void {
    this.summaryLoading.set(true);
    this.summaryError.set("");
    this.invoicesService
      .summary()
      .pipe(
        finalize(() => this.summaryLoading.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: (summary) => this.summary.set(summary),
        error: (error: unknown) => {
          this.summary.set(null);
          this.summaryError.set(
            apiErrorMessage(error, "No pudimos cargar la conciliación."),
          );
        },
      });
  }

  loadList(page = this.invoices().page): void {
    this.invoicesService
      .list(page, this.status.value)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (invoices) => this.invoices.set(invoices),
        error: (error: unknown) =>
          this.error.set(
            apiErrorMessage(error, "No pudimos cargar las simulaciones."),
          ),
      });
  }

  createDraft(): void {
    if (
      this.readOnly() ||
      !this.auth.hasPermission("invoices.create") ||
      !this.orderId ||
      this.createForm.invalid ||
      this.saving()
    ) {
      this.createForm.markAllAsTouched();
      return;
    }
    const raw = this.createForm.getRawValue();
    this.saving.set(true);
    this.error.set("");
    this.invoicesService
      .create({ orderId: this.orderId, ...raw, exportCode: "01" })
      .pipe(
        finalize(() => this.saving.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: (invoice) => void this.router.navigate(["/invoices", invoice.id]),
        error: (error: unknown) =>
          this.error.set(
            apiErrorMessage(
              error,
              "No pudimos crear el borrador de simulación.",
            ),
          ),
      });
  }

  saveSettings(): void {
    if (
      this.readOnly() ||
      this.auth.user()?.role !== "company_admin" ||
      !this.auth.hasPermission("invoices.configure") ||
      this.settingsForm.invalid ||
      this.saving()
    ) {
      this.settingsForm.markAllAsTouched();
      return;
    }
    this.saving.set(true);
    this.error.set("");
    this.invoicesService
      .updateSettings(this.settingsForm.getRawValue())
      .pipe(
        finalize(() => this.saving.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: (settings) => {
          this.settings.set(settings);
          this.populateSettings(settings);
          this.showNotice("Configuración fiscal actualizada.");
        },
        error: (error: unknown) =>
          this.error.set(
            apiErrorMessage(
              error,
              "No pudimos guardar la configuración fiscal.",
            ),
          ),
      });
  }

  statusName(status: InvoiceStatus): string {
    return {
      draft: "Borrador",
      issued: "Simulación emitida",
      cancelled: "Simulación cancelada",
      discarded: "Borrador descartado",
    }[status];
  }

  collectionStatusName(status: InvoiceCollectionStatus): string {
    return INVOICE_COLLECTION_STATUS_NAMES[status];
  }

  paymentMethodExplanation(method: "PUE" | "PPD"): string {
    return method === "PPD"
      ? "PPD permite emitir la simulación con la orden pendiente de pago. Esta fase no genera complementos de pago."
      : "PUE representa pago en una sola exhibición. Para emitir la simulación, la orden deberá estar marcada como pagada.";
  }

  money(value: string): string {
    return new Intl.NumberFormat("es-MX", {
      style: "currency",
      currency: "MXN",
    }).format(Number(value));
  }

  periodName(value: string): string {
    return new Intl.DateTimeFormat("es-MX", {
      month: "long",
      year: "numeric",
      timeZone: "UTC",
    }).format(new Date(value));
  }

  supported<T extends { isActive: boolean; simulationSupported: boolean }>(
    items: T[],
  ): T[] {
    return items.filter((item) => item.isActive && item.simulationSupported);
  }

  private populateSettings(settings: InvoiceSettings): void {
    this.settingsForm.reset({
      fiscalName: settings.fiscalName ?? "",
      taxId: settings.taxId ?? "",
      fiscalRegimeCode: settings.fiscalRegimeCode ?? "",
      fiscalPostalCode: settings.fiscalPostalCode ?? "",
      defaultSeries: settings.defaultSeries,
      pricesIncludeTax: settings.pricesIncludeTax ?? true,
      isActive: settings.isActive,
    });
  }

  private showNotice(message: string): void {
    this.notice.set(message);
    window.setTimeout(() => this.notice.set(""), 3500);
  }
}
