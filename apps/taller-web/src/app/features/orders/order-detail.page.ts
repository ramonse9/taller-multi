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
import { FormControl, ReactiveFormsModule, Validators } from "@angular/forms";
import { ActivatedRoute, RouterLink } from "@angular/router";
import { finalize } from "rxjs";
import { formatShortDate } from "../../core/dates/date-format";
import { apiErrorMessage } from "../../core/http/api-error";
import { ThemeService } from "../../core/theme/theme.service";
import { AuthService } from "../../core/auth/auth.service";
import {
  ORDER_STATUS_NAMES,
  Order,
  OrderItem,
  OrderStatus,
} from "./order.models";
import { OrdersService } from "./orders.service";

const TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  in_progress: ["completed", "cancelled"],
  completed: ["in_progress", "cancelled"],
  cancelled: ["in_progress"],
};

@Component({
  selector: "app-order-detail-page",
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: "./order-detail.page.html",
  host: { class: "block min-h-screen", "[class.dark]": "theme.isDark()" },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OrderDetailPage implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly orders = inject(OrdersService);
  private readonly destroyRef = inject(DestroyRef);
  readonly theme = inject(ThemeService);
  readonly auth = inject(AuthService);
  readonly formatShortDate = formatShortDate;
  readonly orderId = this.route.snapshot.paramMap.get("id") ?? "";
  readonly order = signal<Order | null>(null);
  readonly loading = signal(true);
  readonly saving = signal(false);
  readonly error = signal("");
  readonly notice = signal("");
  readonly statusSelection = new FormControl<OrderStatus>("in_progress", {
    nonNullable: true,
  });
  readonly note = new FormControl("", {
    nonNullable: true,
    validators: [Validators.required, Validators.maxLength(2000)],
  });
  readonly transitions = computed(() => {
    const order = this.order();
    return order
      ? TRANSITIONS[order.status].filter(
          (status) =>
            !(order.isPaid && status === "cancelled") &&
            (status !== "cancelled" || this.auth.hasPermission("orders.cancel")),
        )
      : [];
  });
  readonly editable = computed(() => {
    const order = this.order();
    return (
      this.auth.hasPermission("orders.edit") &&
      this.auth.hasPermission("clients.view") &&
      this.auth.hasPermission("vehicles.view") &&
      this.auth.hasPermission("vehicle_catalog.view") &&
      order?.status === "in_progress" &&
      !order.isPaid
    );
  });

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    if (!this.orderId) return;
    this.loading.set(true);
    this.error.set("");
    this.orders
      .getOne(this.orderId)
      .pipe(
        finalize(() => this.loading.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: (order) => {
          this.order.set(order);
          this.statusSelection.setValue(order.status, { emitEvent: false });
        },
        error: (error: unknown) =>
          this.error.set(apiErrorMessage(error, "No pudimos cargar la orden.")),
      });
  }

  changeStatus(): void {
    const current = this.order();
    const status = this.statusSelection.value;
    if (!current || status === current.status || this.saving()) return;
    this.saving.set(true);
    this.error.set("");
    this.orders
      .changeStatus(this.orderId, status)
      .pipe(
        finalize(() => this.saving.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: (order) => {
          this.order.set(order);
          this.statusSelection.setValue(order.status, { emitEvent: false });
          this.showNotice(
            `Orden actualizada a ${this.statusName(status).toLocaleLowerCase("es-MX")}.`,
          );
        },
        error: (error: unknown) => {
          this.statusSelection.setValue(current.status, { emitEvent: false });
          this.error.set(
            apiErrorMessage(error, "No pudimos cambiar el estado."),
          );
        },
      });
  }

  addNote(): void {
    if (this.note.invalid || this.saving()) {
      this.note.markAsTouched();
      return;
    }
    this.saving.set(true);
    this.error.set("");
    this.orders
      .addNote(this.orderId, this.note.value)
      .pipe(
        finalize(() => this.saving.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: (note) => {
          this.order.update((order) =>
            order ? { ...order, notes: [...order.notes, note] } : order,
          );
          this.note.setValue("");
          this.showNotice("Nota agregada.");
        },
        error: (error: unknown) =>
          this.error.set(apiErrorMessage(error, "No pudimos agregar la nota.")),
      });
  }

  changePaymentStatus(): void {
    const current = this.order();
    if (!current || current.status === "cancelled" || this.saving()) return;
    this.saving.set(true);
    this.error.set("");
    this.orders
      .changePaymentStatus(this.orderId, !current.isPaid)
      .pipe(
        finalize(() => this.saving.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: (order) => {
          this.order.set(order);
          this.showNotice(order.isPaid ? "Orden marcada como pagada." : "Orden marcada como pendiente.");
        },
        error: (error: unknown) =>
          this.error.set(apiErrorMessage(error, "No pudimos cambiar el estado de pago.")),
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

  hasActualCosts(order: Order): boolean {
    return (
      order.inventoryAppliedAt !== null ||
      order.items.some(({ costLayers }) => costLayers.length > 0)
    );
  }

  itemCostLabel(order: Order, item: OrderItem): string {
    if (
      item.productServiceId &&
      item.tracksInventory &&
      this.hasActualCosts(order)
    ) {
      return "Costo real FIFO";
    }
    return item.productServiceId ? "Costo de referencia" : "Costo capturado";
  }

  private showNotice(message: string): void {
    this.notice.set(message);
    window.setTimeout(() => this.notice.set(""), 3000);
  }
}
