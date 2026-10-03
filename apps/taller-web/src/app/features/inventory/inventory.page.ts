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
import { debounceTime, distinctUntilChanged, finalize } from "rxjs";
import { ActivatedRoute } from "@angular/router";
import { formatShortDate } from "../../core/dates/date-format";
import { apiErrorMessage } from "../../core/http/api-error";
import { ThemeService } from "../../core/theme/theme.service";
import { AuthService } from "../../core/auth/auth.service";
import {
  InventoryLot,
  InventoryMovement,
  InventoryMovementType,
  InventoryProduct,
  PaginatedInventoryMovements,
  PaginatedInventoryProducts,
} from "./inventory.models";
import { InventoryService } from "./inventory.service";

const emptyProducts = (): PaginatedInventoryProducts => ({
  page: 1,
  limit: 20,
  totalItems: 0,
  totalPages: 0,
  hasNextPage: false,
  items: [],
});

const emptyMovements = (): PaginatedInventoryMovements => ({
  page: 1,
  limit: 20,
  totalItems: 0,
  totalPages: 0,
  hasNextPage: false,
  items: [],
});

@Component({
  selector: "app-inventory-page",
  imports: [ReactiveFormsModule],
  templateUrl: "./inventory.page.html",
  host: { class: "block min-h-screen", "[class.dark]": "theme.isDark()" },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class InventoryPage implements OnInit {
  private readonly inventory = inject(InventoryService);
  private readonly route = inject(ActivatedRoute);
  private readonly destroyRef = inject(DestroyRef);
  readonly theme = inject(ThemeService);
  readonly auth = inject(AuthService);
  readonly formatShortDate = formatShortDate;

  readonly products = signal<PaginatedInventoryProducts>(emptyProducts());
  readonly movements = signal<PaginatedInventoryMovements>(emptyMovements());
  readonly lots = signal<InventoryLot[]>([]);
  readonly selectedProduct = signal<InventoryProduct | null>(null);
  readonly loadingProducts = signal(true);
  readonly loadingMovements = signal(false);
  readonly loadingLots = signal(false);
  readonly saving = signal(false);
  readonly lowStockOnly = signal(false);
  readonly movementEditorOpen = signal(false);
  readonly error = signal("");
  readonly notice = signal("");

  readonly search = new FormControl(this.route.snapshot.queryParamMap.get("search") ?? "", {
    nonNullable: true,
  });
  private readonly initialProductId = this.route.snapshot.queryParamMap.get("productId") ?? "";
  readonly movementType = new FormControl<InventoryMovementType | "">("", {
    nonNullable: true,
  });
  readonly movementForm = new FormGroup({
    type: new FormControl<InventoryMovementType>("entry", {
      nonNullable: true,
      validators: [Validators.required],
    }),
    quantity: new FormControl<number | null>(null, {
      validators: [Validators.required],
    }),
    unitCost: new FormControl<number | null>(null, {
      validators: [Validators.required, Validators.min(0)],
    }),
    reason: new FormControl("", {
      nonNullable: true,
      validators: [
        Validators.required,
        Validators.minLength(2),
        Validators.maxLength(250),
      ],
    }),
  });

  ngOnInit(): void {
    this.search.valueChanges
      .pipe(
        debounceTime(300),
        distinctUntilChanged(),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe(() => this.loadProducts(1));
    this.movementType.valueChanges
      .pipe(distinctUntilChanged(), takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.loadMovements(1));
    this.loadProducts();
  }

  loadProducts(page = this.products().page): void {
    this.loadingProducts.set(true);
    this.error.set("");
    this.inventory
      .listProducts({
        page,
        limit: 20,
        search: this.search.value,
        lowStock: this.lowStockOnly() ? true : undefined,
      })
      .pipe(
        finalize(() => this.loadingProducts.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: (products) => {
          this.products.set(products);
          const selectedId = this.selectedProduct()?.id || this.initialProductId;
          const selected =
            products.items.find(({ id }) => id === selectedId) ??
            products.items[0] ??
            null;
          const changed = selected?.id !== selectedId;
          this.selectedProduct.set(selected);
          if (changed) {
            this.loadMovements(1);
            this.loadLots();
          } else if (!selected) {
            this.movements.set(emptyMovements());
            this.lots.set([]);
          }
        },
        error: (error: unknown) =>
          this.error.set(
            apiErrorMessage(error, "No pudimos cargar las existencias."),
          ),
      });
  }

  toggleLowStock(): void {
    this.lowStockOnly.update((value) => !value);
    this.selectedProduct.set(null);
    this.loadProducts(1);
  }

  selectProduct(product: InventoryProduct): void {
    if (this.selectedProduct()?.id === product.id) return;
    this.selectedProduct.set(product);
    this.loadMovements(1);
    this.loadLots();
  }

  loadLots(): void {
    if (!this.auth.hasPermission("catalog.view_costs")) {
      this.lots.set([]);
      return;
    }
    const product = this.selectedProduct();
    if (!product) {
      this.lots.set([]);
      return;
    }
    this.loadingLots.set(true);
    this.inventory
      .listLots(product.id)
      .pipe(
        finalize(() => this.loadingLots.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: (lots) => {
          if (this.selectedProduct()?.id === product.id) this.lots.set(lots);
        },
        error: (error: unknown) =>
          this.error.set(
            apiErrorMessage(error, "No pudimos cargar los lotes."),
          ),
      });
  }

  loadMovements(page = this.movements().page): void {
    if (!this.auth.hasPermission("catalog.view_costs")) {
      this.movements.set(emptyMovements());
      return;
    }
    const product = this.selectedProduct();
    if (!product) {
      this.movements.set(emptyMovements());
      return;
    }
    this.loadingMovements.set(true);
    this.error.set("");
    this.inventory
      .listMovements({
        page,
        limit: 20,
        productId: product.id,
        type: this.movementType.value,
      })
      .pipe(
        finalize(() => this.loadingMovements.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: (movements) => this.movements.set(movements),
        error: (error: unknown) =>
          this.error.set(
            apiErrorMessage(error, "No pudimos cargar los movimientos."),
          ),
      });
  }

  openMovementEditor(
    product: InventoryProduct = this.selectedProduct()!,
  ): void {
    if (
      !product ||
      !this.auth.hasPermission("catalog.view_costs") ||
      (!this.auth.hasPermission("inventory.move") &&
        !this.auth.hasPermission("inventory.adjust"))
    ) return;
    const initialType: InventoryMovementType = this.auth.hasPermission("inventory.move")
      ? "entry"
      : "adjustment";
    this.selectedProduct.set(product);
    this.movementForm.reset({
      type: initialType,
      quantity: null,
      unitCost: null,
      reason: "",
    });
    this.updateCostValidation();
    this.movementEditorOpen.set(true);
    this.error.set("");
  }

  closeMovementEditor(): void {
    if (!this.saving()) this.movementEditorOpen.set(false);
  }

  movementFormTypeChanged(): void {
    const type = this.movementForm.controls.type.value;
    const quantity = this.movementForm.controls.quantity.value;
    if (type !== "adjustment" && quantity !== null) {
      this.movementForm.controls.quantity.setValue(Math.abs(quantity));
    }
    this.updateCostValidation();
  }

  movementFormQuantityChanged(): void {
    this.updateCostValidation();
  }

  saveMovement(): void {
    const product = this.selectedProduct();
    if (!product || this.movementForm.invalid || this.saving()) {
      this.movementForm.markAllAsTouched();
      return;
    }
    const raw = this.movementForm.getRawValue();
    const requiredPermission = raw.type === "adjustment" ? "inventory.adjust" : "inventory.move";
    if (!this.auth.hasPermission(requiredPermission)) return;
    if (raw.quantity === null || raw.quantity === 0) {
      this.movementForm.controls.quantity.setErrors({ nonZero: true });
      return;
    }
    if (!product.allowsDecimals && !Number.isInteger(raw.quantity)) {
      this.movementForm.controls.quantity.setErrors({ integerOnly: true });
      return;
    }
    if (
      Math.abs(raw.quantity * 1000 - Math.round(raw.quantity * 1000)) > 1e-9
    ) {
      this.movementForm.controls.quantity.setErrors({ decimalPlaces: true });
      return;
    }
    if (raw.type !== "adjustment" && raw.quantity < 0) {
      this.movementForm.controls.quantity.setErrors({ positive: true });
      return;
    }
    const increasesStock =
      raw.type === "entry" || (raw.type === "adjustment" && raw.quantity > 0);
    if (increasesStock && raw.unitCost === null) {
      this.movementForm.controls.unitCost.setErrors({ required: true });
      this.movementForm.controls.unitCost.markAsTouched();
      return;
    }
    this.saving.set(true);
    this.error.set("");
    this.inventory
      .createMovement({
        productId: product.id,
        type: raw.type,
        quantity: raw.quantity,
        unitCost: increasesStock ? raw.unitCost : null,
        reason: raw.reason.trim(),
      })
      .pipe(
        finalize(() => this.saving.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: () => {
          this.movementEditorOpen.set(false);
          this.showNotice("Movimiento registrado.");
          this.loadProducts();
          this.loadMovements(1);
          this.loadLots();
        },
        error: (error: unknown) =>
          this.error.set(
            apiErrorMessage(error, "No pudimos registrar el movimiento."),
          ),
      });
  }

  movementName(type: InventoryMovementType): string {
    return { entry: "Entrada", exit: "Salida", adjustment: "Ajuste" }[type];
  }

  movementSign(movement: InventoryMovement): string {
    return Number(movement.quantity) > 0 ? "+" : "";
  }

  movementIsPositive(movement: InventoryMovement): boolean {
    return Number(movement.quantity) > 0;
  }

  lotSourceName(source: InventoryLot["sourceType"]): string {
    return {
      opening_balance: "Saldo inicial",
      manual_entry: "Entrada manual",
      adjustment: "Ajuste positivo",
      purchase: "Compra",
      order_return: "Devolución de orden",
    }[source];
  }

  lotHasStock(lot: InventoryLot): boolean {
    return Number(lot.remainingQuantity) > 0;
  }

  money(value: string): string {
    return new Intl.NumberFormat("es-MX", {
      style: "currency",
      currency: "MXN",
    }).format(Number(value));
  }

  private updateCostValidation(): void {
    const type = this.movementForm.controls.type.value;
    const quantity = this.movementForm.controls.quantity.value;
    const increasesStock =
      type === "entry" || (type === "adjustment" && (quantity ?? 0) > 0);
    const control = this.movementForm.controls.unitCost;
    control.setValidators(
      increasesStock
        ? [Validators.required, Validators.min(0)]
        : [Validators.min(0)],
    );
    if (!increasesStock) control.setValue(null);
    control.updateValueAndValidity();
  }

  private showNotice(message: string): void {
    this.notice.set(message);
    window.setTimeout(() => this.notice.set(""), 3500);
  }
}
