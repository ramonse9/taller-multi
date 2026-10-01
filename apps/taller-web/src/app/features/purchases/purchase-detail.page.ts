import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  OnInit,
  inject,
  signal,
} from "@angular/core";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { ActivatedRoute, RouterLink } from "@angular/router";
import { finalize, forkJoin } from "rxjs";
import { formatShortDate } from "../../core/dates/date-format";
import { apiErrorMessage } from "../../core/http/api-error";
import { ThemeService } from "../../core/theme/theme.service";
import { InventoryLot } from "../inventory/inventory.models";
import { InventoryService } from "../inventory/inventory.service";
import {
  PURCHASE_STATUS_NAMES,
  Purchase,
  PurchaseItem,
  PurchaseStatus,
} from "./purchase.models";
import { PurchasesService } from "./purchases.service";

@Component({
  selector: "app-purchase-detail-page",
  imports: [RouterLink],
  templateUrl: "./purchase-detail.page.html",
  host: { class: "block min-h-screen", "[class.dark]": "theme.isDark()" },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PurchaseDetailPage implements OnInit {
  private readonly purchases = inject(PurchasesService);
  private readonly inventory = inject(InventoryService);
  private readonly route = inject(ActivatedRoute);
  private readonly destroyRef = inject(DestroyRef);
  readonly theme = inject(ThemeService);
  readonly formatShortDate = formatShortDate;

  readonly purchase = signal<Purchase | null>(null);
  readonly lots = signal(new Map<string, InventoryLot>());
  readonly loading = signal(true);
  readonly changingStatus = signal(false);
  readonly error = signal("");
  readonly notice = signal("");

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.error.set("");
    this.purchases
      .getOne(this.route.snapshot.paramMap.get("id")!)
      .pipe(finalize(() => this.loading.set(false)), takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (purchase) => {
          this.purchase.set(purchase);
          this.loadLots(purchase);
        },
        error: (error: unknown) =>
          this.error.set(apiErrorMessage(error, "No pudimos cargar la compra.")),
      });
  }

  changeStatus(status: "confirmed" | "cancelled"): void {
    const purchase = this.purchase();
    if (!purchase || this.changingStatus()) return;
    const warning =
      status === "confirmed"
        ? "Al confirmar se crearán las entradas y lotes de inventario."
        : purchase.status === "confirmed"
          ? "Solo se cancelará si ninguno de sus lotes ha sido consumido."
          : "El borrador quedará cancelado.";
    if (!window.confirm(`${warning}\n\n¿Deseas continuar?`)) return;
    this.changingStatus.set(true);
    this.error.set("");
    this.purchases
      .changeStatus(purchase.id, status)
      .pipe(
        finalize(() => this.changingStatus.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: (updated) => {
          this.purchase.set(updated);
          this.notice.set(status === "confirmed" ? "Compra confirmada." : "Compra cancelada.");
          this.loadLots(updated);
          window.setTimeout(() => this.notice.set(""), 3000);
        },
        error: (error: unknown) =>
          this.error.set(apiErrorMessage(error, "No pudimos cambiar el estado de la compra.")),
      });
  }

  lotFor(item: PurchaseItem): InventoryLot | undefined {
    return item.inventoryLotId ? this.lots().get(item.inventoryLotId) : undefined;
  }

  statusName(status: PurchaseStatus): string {
    return PURCHASE_STATUS_NAMES[status];
  }

  money(value: string): string {
    return new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN" }).format(
      Number(value),
    );
  }

  shortId(value: string | null): string {
    return value ? value.slice(0, 8).toUpperCase() : "—";
  }

  private loadLots(purchase: Purchase): void {
    const productIds = [
      ...new Set(
        purchase.items.filter(({ inventoryLotId }) => inventoryLotId).map(({ productId }) => productId),
      ),
    ];
    if (!productIds.length) {
      this.lots.set(new Map());
      return;
    }
    forkJoin(productIds.map((productId) => this.inventory.listLots(productId)))
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (groups) =>
          this.lots.set(new Map(groups.flat().map((lot) => [lot.id, lot] as const))),
        error: () => this.lots.set(new Map()),
      });
  }
}
