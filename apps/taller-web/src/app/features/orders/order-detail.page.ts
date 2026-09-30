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
import { ORDER_STATUS_NAMES, Order, OrderStatus } from "./order.models";
import { OrdersService } from "./orders.service";

const TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  draft: ["open", "cancelled"],
  open: ["in_progress", "completed", "cancelled"],
  in_progress: ["open", "completed", "cancelled"],
  completed: [],
  cancelled: [],
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
  readonly formatShortDate = formatShortDate;
  readonly orderId = this.route.snapshot.paramMap.get("id") ?? "";
  readonly order = signal<Order | null>(null);
  readonly loading = signal(true);
  readonly saving = signal(false);
  readonly error = signal("");
  readonly notice = signal("");
  readonly statusNote = new FormControl("", {
    nonNullable: true,
    validators: [Validators.maxLength(500)],
  });
  readonly note = new FormControl("", {
    nonNullable: true,
    validators: [Validators.required, Validators.maxLength(2000)],
  });
  readonly transitions = computed(() => {
    const status = this.order()?.status;
    return status ? TRANSITIONS[status] : [];
  });
  readonly editable = computed(() => {
    const status = this.order()?.status;
    return status === "draft" || status === "open" || status === "in_progress";
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
        next: (order) => this.order.set(order),
        error: (error: unknown) =>
          this.error.set(apiErrorMessage(error, "No pudimos cargar la orden.")),
      });
  }

  changeStatus(status: OrderStatus): void {
    if (this.saving() || this.statusNote.invalid) return;
    this.saving.set(true);
    this.error.set("");
    this.orders
      .changeStatus(this.orderId, status, this.statusNote.value)
      .pipe(
        finalize(() => this.saving.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: (order) => {
          this.order.set(order);
          this.statusNote.setValue("");
          this.showNotice(
            `Orden actualizada a ${this.statusName(status).toLocaleLowerCase("es-MX")}.`,
          );
        },
        error: (error: unknown) =>
          this.error.set(
            apiErrorMessage(error, "No pudimos cambiar el estado."),
          ),
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

  transitionAction(status: OrderStatus): string {
    return {
      open: "Abrir orden",
      in_progress: "Iniciar trabajo",
      completed: "Terminar orden",
      cancelled: "Cancelar orden",
      draft: "Volver a borrador",
    }[status];
  }

  private showNotice(message: string): void {
    this.notice.set(message);
    window.setTimeout(() => this.notice.set(""), 3000);
  }
}
