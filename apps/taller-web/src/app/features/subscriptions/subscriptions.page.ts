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
      customer_history: "Clientes",
      vehicle_history: "Vehículos",
      service_orders: "Órdenes",
      free_order_items: "Conceptos libres",
      item_catalog: "Catálogo",
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
