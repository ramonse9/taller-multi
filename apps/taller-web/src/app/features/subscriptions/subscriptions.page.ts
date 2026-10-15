import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  inject,
  OnInit,
  signal,
} from "@angular/core";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { finalize, forkJoin } from "rxjs";
import { apiErrorMessage } from "../../core/http/api-error";
import {
  CompanySubscription,
  SubscriptionFeature,
  SubscriptionPlan,
  SubscriptionPlanCode,
  SubscriptionStatus,
} from "../../core/subscriptions/subscription.models";
import { SubscriptionsService } from "../../core/subscriptions/subscriptions.service";

interface SubscriptionEditor extends CompanySubscription {
  draftPlanCode: SubscriptionPlanCode;
  draftStatus: SubscriptionStatus;
  saving: boolean;
  message: string;
  error: string;
}

interface DowngradeConfirmation {
  companyId: string;
  companyName: string;
  currentPlanName: string;
  targetPlanName: string;
  unavailableFeatures: SubscriptionFeature[];
  readOnlyFeatures: SubscriptionFeature[];
}

@Component({
  selector: "app-subscriptions-page",
  templateUrl: "./subscriptions.page.html",
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SubscriptionsPage implements OnInit {
  private readonly subscriptions = inject(SubscriptionsService);
  private readonly destroyRef = inject(DestroyRef);

  readonly loading = signal(true);
  readonly loadError = signal("");
  readonly plans = signal<SubscriptionPlan[]>([]);
  readonly companies = signal<SubscriptionEditor[]>([]);
  readonly downgradeConfirmation = signal<DowngradeConfirmation | null>(null);

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.loadError.set("");
    forkJoin({
      plans: this.subscriptions.plans(),
      companies: this.subscriptions.companies(),
    })
      .pipe(
        finalize(() => this.loading.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: ({ plans, companies }) => {
          this.plans.set(plans);
          this.companies.set(companies.map((company) => this.editor(company)));
        },
        error: (error: unknown) =>
          this.loadError.set(
            apiErrorMessage(error, "No pudimos cargar las suscripciones."),
          ),
      });
  }

  setPlan(companyId: string, planCode: SubscriptionPlanCode): void {
    this.updateEditor(companyId, {
      draftPlanCode: planCode,
      message: "",
      error: "",
    });
  }

  setStatus(companyId: string, status: SubscriptionStatus): void {
    this.updateEditor(companyId, {
      draftStatus: status,
      message: "",
      error: "",
    });
  }

  save(company: SubscriptionEditor): void {
    if (company.saving) return;
    if (!this.hasChanges(company)) {
      this.updateEditor(company.companyId, {
        message: "No hay cambios pendientes.",
        error: "",
      });
      return;
    }
    if (this.isDowngrade(company)) {
      const target = this.plan(company.draftPlanCode);
      if (!target) return;
      this.downgradeConfirmation.set({
        companyId: company.companyId,
        companyName: company.companyName,
        currentPlanName: company.planName,
        targetPlanName: target.name,
        unavailableFeatures: this.unavailableFeatures(company),
        readOnlyFeatures: this.readOnlyAfterChange(company),
      });
      return;
    }
    this.persist(company);
  }

  confirmDowngrade(): void {
    const confirmation = this.downgradeConfirmation();
    if (!confirmation) return;
    const company = this.companies().find(
      ({ companyId }) => companyId === confirmation.companyId,
    );
    if (!company || company.saving) return;
    this.downgradeConfirmation.set(null);
    this.persist(company);
  }

  closeDowngradeConfirmation(): void {
    if (this.downgradeSaving()) return;
    this.downgradeConfirmation.set(null);
  }

  downgradeSaving(): boolean {
    const confirmation = this.downgradeConfirmation();
    return Boolean(
      confirmation &&
      this.companies().find(
        ({ companyId }) => companyId === confirmation.companyId,
      )?.saving,
    );
  }

  hasChanges(company: SubscriptionEditor): boolean {
    return (
      company.draftPlanCode !== company.planCode ||
      company.draftStatus !== company.status
    );
  }

  selectedPlan(company: SubscriptionEditor): SubscriptionPlan | undefined {
    return this.plan(company.draftPlanCode);
  }

  unavailableFeatures(company: SubscriptionEditor): SubscriptionFeature[] {
    const targetFeatures = new Set(
      this.selectedPlan(company)?.features ?? company.features,
    );
    const targetReadOnlyFeatures = this.readOnlyAfterChange(company);
    return [
      ...new Set([...company.features, ...company.readOnlyFeatures]),
    ].filter(
      (feature) =>
        !targetFeatures.has(feature) &&
        !targetReadOnlyFeatures.includes(feature),
    );
  }

  readOnlyAfterChange(company: SubscriptionEditor): SubscriptionFeature[] {
    return company.planCode === "invoicing" &&
      company.draftPlanCode === "control"
      ? ["invoicing"]
      : [];
  }

  isDowngrade(company: SubscriptionEditor): boolean {
    const current = this.plan(company.planCode);
    const target = this.selectedPlan(company);
    return Boolean(current && target && target.sortOrder < current.sortOrder);
  }

  private persist(company: SubscriptionEditor): void {
    this.updateEditor(company.companyId, {
      saving: true,
      message: "",
      error: "",
    });
    this.subscriptions
      .change(company.companyId, {
        planCode: company.draftPlanCode,
        status: company.draftStatus,
        reason: "Actualización desde administración de suscripciones",
      })
      .pipe(
        finalize(() => this.updateEditor(company.companyId, { saving: false })),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: (updated) => {
          const editor = this.editor(updated);
          this.updateEditor(company.companyId, {
            ...editor,
            message: "Suscripción actualizada.",
          });
        },
        error: (error: unknown) =>
          this.updateEditor(company.companyId, {
            error: apiErrorMessage(
              error,
              "No pudimos actualizar la suscripción.",
            ),
          }),
      });
  }

  featureName(feature: SubscriptionFeature): string {
    const names: Record<SubscriptionFeature, string> = {
      dashboard: "Tablero",
      customer_history: "Clientes",
      vehicle_history: "Vehículos",
      vehicle_catalog: "Marcas y modelos",
      service_orders: "Órdenes",
      free_order_items: "Conceptos libres",
      user_management: "Usuarios y permisos",
      item_catalog: "Catálogo",
      suppliers: "Proveedores",
      purchases: "Compras",
      inventory: "Inventario",
      expenses: "Gastos",
      profitability: "Utilidad",
      invoicing: "Facturación",
    };
    return names[feature];
  }

  limit(value: number | null, suffix: string): string {
    return value === null ? `Sin límite de ${suffix}` : `${value} ${suffix}`;
  }

  statusName(status: SubscriptionStatus): string {
    return {
      active: "Activa",
      past_due: "Pago pendiente",
      suspended: "Suspendida",
      canceled: "Cancelada",
    }[status];
  }

  transitionNote(company: SubscriptionEditor): string {
    if (company.draftPlanCode === company.planCode) return "";
    if (
      company.planCode === "invoicing" &&
      company.draftPlanCode === "control"
    ) {
      return "Las simulaciones se conservarán para consulta histórica, sin permitir cambios.";
    }
    if (company.draftPlanCode === "essential") {
      return "Los datos de catálogo, compras e inventario se conservarán, pero sus módulos quedarán ocultos y bloqueados.";
    }
    if (company.draftPlanCode === "invoicing") {
      return "Se habilitará la simulación fiscal; seguirá siendo necesario completar emisor y receptor.";
    }
    return "Las capacidades de Control quedarán disponibles inmediatamente.";
  }

  private plan(code: SubscriptionPlanCode): SubscriptionPlan | undefined {
    return this.plans().find((plan) => plan.code === code);
  }

  private editor(company: CompanySubscription): SubscriptionEditor {
    return {
      ...company,
      draftPlanCode: company.planCode,
      draftStatus: company.status,
      saving: false,
      message: "",
      error: "",
    };
  }

  private updateEditor(
    companyId: string,
    changes: Partial<SubscriptionEditor>,
  ): void {
    this.companies.update((companies) =>
      companies.map((company) =>
        company.companyId === companyId ? { ...company, ...changes } : company,
      ),
    );
  }
}
