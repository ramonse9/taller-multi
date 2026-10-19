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
  FormArray,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
} from "@angular/forms";
import { ActivatedRoute, RouterLink } from "@angular/router";
import { finalize, forkJoin } from "rxjs";
import { AuthService } from "../../core/auth/auth.service";
import { formatShortDate } from "../../core/dates/date-format";
import { apiErrorMessage } from "../../core/http/api-error";
import { ThemeService } from "../../core/theme/theme.service";
import {
  InvoiceCatalogs,
  InvoiceTaxInput,
  SimulatedInvoice,
} from "./invoice.models";
import { InvoicesService } from "./invoices.service";

type TaxTreatment = "none" | "iva16" | "iva8" | "iva0" | "exempt";

@Component({
  selector: "app-invoice-detail-page",
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: "./invoice-detail.page.html",
  host: { class: "block min-h-screen", "[class.dark]": "theme.isDark()" },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class InvoiceDetailPage implements OnInit {
  private readonly invoices = inject(InvoicesService);
  private readonly route = inject(ActivatedRoute);
  private readonly destroyRef = inject(DestroyRef);
  readonly auth = inject(AuthService);
  readonly theme = inject(ThemeService);
  readonly formatShortDate = formatShortDate;
  readonly readOnly = computed(
    () =>
      !this.auth.hasFeature("invoicing") &&
      this.auth.hasFeatureReadAccess("invoicing"),
  );
  readonly pueIssueBlocked = computed(() => {
    const invoice = this.invoice();
    return (
      invoice?.status === "draft" &&
      invoice.paymentMethodCode === "PUE" &&
      invoice.collectionStatus === "pending"
    );
  });
  readonly invoiceId = this.route.snapshot.paramMap.get("id") ?? "";
  readonly invoice = signal<SimulatedInvoice | null>(null);
  readonly catalogs = signal<InvoiceCatalogs | null>(null);
  readonly loading = signal(true);
  readonly saving = signal(false);
  readonly error = signal("");
  readonly notice = signal("");
  readonly confirmAction = signal<"issue" | "cancel" | "discard" | null>(null);

  readonly form = new FormGroup({
    cfdiUseCode: new FormControl("", { nonNullable: true }),
    paymentMethodCode: new FormControl<"PUE" | "PPD">("PUE", {
      nonNullable: true,
    }),
    paymentFormCode: new FormControl("03", { nonNullable: true }),
    items: new FormArray<
      FormGroup<{
        orderItemId: FormControl<string>;
        treatment: FormControl<TaxTreatment>;
      }>
    >([]),
  });

  ngOnInit(): void {
    this.form.controls.paymentMethodCode.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((method) => {
        if (method === "PPD") this.form.controls.paymentFormCode.setValue("99");
        else if (this.form.controls.paymentFormCode.value === "99") {
          this.form.controls.paymentFormCode.setValue("03");
        }
      });
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.error.set("");
    forkJoin({
      invoice: this.invoices.getOne(this.invoiceId),
      catalogs: this.invoices.catalogs(),
    })
      .pipe(
        finalize(() => this.loading.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: ({ invoice, catalogs }) => {
          this.catalogs.set(catalogs);
          this.setInvoice(invoice);
        },
        error: (error: unknown) =>
          this.error.set(
            apiErrorMessage(error, "No pudimos cargar la simulación."),
          ),
      });
  }

  save(): void {
    const current = this.invoice();
    if (
      this.readOnly() ||
      !this.auth.hasPermission("invoices.edit") ||
      !current ||
      current.status !== "draft" ||
      this.saving()
    )
      return;
    const raw = this.form.getRawValue();
    this.saving.set(true);
    this.error.set("");
    this.invoices
      .update(current.id, {
        cfdiUseCode: raw.cfdiUseCode,
        paymentMethodCode: raw.paymentMethodCode,
        paymentFormCode: raw.paymentFormCode,
        exportCode: "01",
        items: raw.items.map((item) =>
          this.taxInput(item.orderItemId, item.treatment),
        ),
      })
      .pipe(
        finalize(() => this.saving.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: (invoice) => {
          this.setInvoice(invoice);
          this.showNotice("Borrador actualizado y totales recalculados.");
        },
        error: (error: unknown) =>
          this.error.set(
            apiErrorMessage(error, "No pudimos actualizar el borrador."),
          ),
      });
  }

  executeConfirmedAction(): void {
    const current = this.invoice();
    const action = this.confirmAction();
    if (action === "issue" && this.pueIssueBlocked()) {
      this.confirmAction.set(null);
      this.error.set(
        "La simulación usa PUE. Marca primero la orden como pagada o cambia el método a PPD.",
      );
      return;
    }
    const permitted =
      action === "issue"
        ? this.auth.hasPermission("invoices.simulate_issue")
        : action === "cancel"
          ? this.auth.hasPermission("invoices.cancel_simulation")
          : this.auth.hasPermission("invoices.edit");
    if (this.readOnly() || !current || !action || !permitted || this.saving())
      return;
    this.saving.set(true);
    this.error.set("");
    const operation =
      action === "issue"
        ? this.invoices.issue(current.id)
        : action === "cancel"
          ? this.invoices.cancel(current.id)
          : this.invoices.discard(current.id);
    operation
      .pipe(
        finalize(() => this.saving.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: (invoice) => {
          this.confirmAction.set(null);
          this.setInvoice(invoice);
          this.showNotice(
            action === "issue"
              ? "Simulación emitida."
              : action === "cancel"
                ? "Simulación cancelada."
                : "Borrador descartado.",
          );
        },
        error: (error: unknown) =>
          this.error.set(
            apiErrorMessage(
              error,
              "No pudimos cambiar el estatus de la simulación.",
            ),
          ),
      });
  }

  supported<T extends { isActive: boolean; simulationSupported: boolean }>(
    items: T[],
  ): T[] {
    return items.filter((item) => item.isActive && item.simulationSupported);
  }

  money(value: string): string {
    return new Intl.NumberFormat("es-MX", {
      style: "currency",
      currency: "MXN",
    }).format(Number(value));
  }

  paymentMethodExplanation(method: string): string {
    return method === "PPD"
      ? "PPD · Pago en parcialidades o diferido. La simulación puede emitirse con el cobro pendiente; todavía no se generan complementos de pago."
      : "PUE · Pago en una sola exhibición. La orden debe estar marcada como pagada antes de emitir la simulación.";
  }

  print(): void {
    window.print();
  }

  eventName(type: string): string {
    return (
      {
        created: "Borrador creado",
        updated: "Borrador actualizado",
        issued: "Simulación emitida",
        cancelled: "Simulación cancelada",
        discarded: "Borrador descartado",
      }[type] ?? type
    );
  }

  private setInvoice(invoice: SimulatedInvoice): void {
    this.invoice.set(invoice);
    this.form.controls.cfdiUseCode.setValue(invoice.cfdiUseCode);
    this.form.controls.paymentMethodCode.setValue(
      invoice.paymentMethodCode as "PUE" | "PPD",
      { emitEvent: false },
    );
    this.form.controls.paymentFormCode.setValue(invoice.paymentFormCode, {
      emitEvent: false,
    });
    this.form.controls.items.clear();
    for (const item of invoice.items) {
      if (!item.orderItemId) continue;
      this.form.controls.items.push(
        new FormGroup({
          orderItemId: new FormControl(item.orderItemId, { nonNullable: true }),
          treatment: new FormControl(this.treatment(item), {
            nonNullable: true,
          }),
        }),
      );
    }
  }

  private treatment(item: SimulatedInvoice["items"][number]): TaxTreatment {
    if (item.taxObjectCode === "01") return "none";
    if (item.factorTypeCode === "Exento") return "exempt";
    if (Number(item.taxRate) === 0.08) return "iva8";
    if (Number(item.taxRate) === 0) return "iva0";
    return "iva16";
  }

  private taxInput(
    orderItemId: string,
    treatment: TaxTreatment,
  ): InvoiceTaxInput {
    if (treatment === "none") return { orderItemId, taxObjectCode: "01" };
    if (treatment === "exempt") {
      return {
        orderItemId,
        taxObjectCode: "02",
        taxCode: "002",
        factorTypeCode: "Exento",
        taxRate: null,
      };
    }
    const rate = { iva16: 0.16, iva8: 0.08, iva0: 0 }[treatment];
    return {
      orderItemId,
      taxObjectCode: "02",
      taxCode: "002",
      factorTypeCode: "Tasa",
      taxRate: rate,
    };
  }

  private showNotice(message: string): void {
    this.notice.set(message);
    window.setTimeout(() => this.notice.set(""), 3500);
  }
}
