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
  FormArray,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from "@angular/forms";
import { Router, RouterLink } from "@angular/router";
import {
  Subject,
  catchError,
  debounceTime,
  distinctUntilChanged,
  finalize,
  forkJoin,
  switchMap,
  tap,
  of,
} from "rxjs";
import { apiErrorMessage } from "../../core/http/api-error";
import { ThemeService } from "../../core/theme/theme.service";
import {
  CatalogConcept,
  MeasurementUnit,
} from "../concept-catalog/concept-catalog.models";
import { ConceptCatalogService } from "../concept-catalog/concept-catalog.service";
import { Supplier } from "../suppliers/supplier.models";
import { SuppliersService } from "../suppliers/suppliers.service";
import { PurchasesService } from "./purchases.service";

type PurchaseItemForm = FormGroup<{
  productId: FormControl<string>;
  quantity: FormControl<string>;
  unitCost: FormControl<string>;
}>;

const quantityPattern = /^\d+(?:\.\d{1,3})?$/;
const moneyPattern = /^\d+(?:\.\d{1,2})?$/;

@Component({
  selector: "app-purchase-wizard-page",
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: "./purchase-wizard.page.html",
  host: { class: "block min-h-screen", "[class.dark]": "theme.isDark()" },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PurchaseWizardPage implements OnInit {
  private readonly purchases = inject(PurchasesService);
  private readonly suppliersService = inject(SuppliersService);
  private readonly catalog = inject(ConceptCatalogService);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);
  readonly theme = inject(ThemeService);

  readonly step = signal(1);
  readonly suppliers = signal<Supplier[]>([]);
  readonly units = signal<MeasurementUnit[]>([]);
  readonly knownProducts = signal(new Map<string, CatalogConcept>());
  readonly productResults = signal<CatalogConcept[]>([]);
  readonly loading = signal(true);
  readonly saving = signal(false);
  readonly searchingProducts = signal(false);
  readonly savingProduct = signal(false);
  readonly error = signal("");
  readonly pickerError = signal("");
  readonly duplicateProducts = signal(false);
  readonly productPickerOpen = signal(false);
  readonly productPickerIndex = signal<number | null>(null);
  readonly creatingProduct = signal(false);
  readonly productSearch = new FormControl("", { nonNullable: true });
  private readonly productQueries = new Subject<string>();

  readonly quickProductForm = new FormGroup({
    name: new FormControl("", {
      nonNullable: true,
      validators: [Validators.required, Validators.minLength(2), Validators.maxLength(180)],
    }),
    sku: new FormControl("", {
      nonNullable: true,
      validators: [Validators.maxLength(80)],
    }),
    unitId: new FormControl("", { nonNullable: true, validators: [Validators.required] }),
    cost: new FormControl("", {
      nonNullable: true,
      validators: [Validators.required, Validators.pattern(moneyPattern)],
    }),
    price: new FormControl("", {
      nonNullable: true,
      validators: [Validators.pattern(/^$|^\d+(?:\.\d{1,2})?$/)],
    }),
    tracksInventory: new FormControl(true, { nonNullable: true }),
  });

  readonly form = new FormGroup({
    supplierId: new FormControl("", { nonNullable: true, validators: [Validators.required] }),
    purchasedAt: new FormControl(this.today(), {
      nonNullable: true,
      validators: [Validators.required],
    }),
    reference: new FormControl("", {
      nonNullable: true,
      validators: [Validators.maxLength(120)],
    }),
    notes: new FormControl("", {
      nonNullable: true,
      validators: [Validators.maxLength(2000)],
    }),
    items: new FormArray<PurchaseItemForm>([]),
  });

  total(): number {
    return this.form.controls.items.controls.reduce((sum, item) => {
      const quantity = Number(item.controls.quantity.value);
      const unitCost = Number(item.controls.unitCost.value);
      return sum + (Number.isFinite(quantity * unitCost) ? quantity * unitCost : 0);
    }, 0);
  }

  ngOnInit(): void {
    this.addItem();
    this.productSearch.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((search) => this.productQueries.next(search));
    this.productQueries
      .pipe(
        debounceTime(250),
        distinctUntilChanged(),
        tap(() => {
          this.searchingProducts.set(true);
          this.pickerError.set("");
        }),
        switchMap((search) =>
          this.catalog
            .list({ page: 1, limit: 10, search, kind: "product", isActive: true })
            .pipe(
              catchError((error: unknown) => {
                this.pickerError.set(apiErrorMessage(error, "No pudimos buscar productos."));
                return of({
                  page: 1,
                  limit: 10,
                  totalItems: 0,
                  totalPages: 0,
                  hasNextPage: false,
                  items: [],
                });
              }),
              finalize(() => this.searchingProducts.set(false)),
            ),
        ),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: (result) => {
          this.productResults.set(result.items);
          this.rememberProducts(result.items);
        },
      });
    forkJoin({
      suppliers: this.suppliersService.list({ page: 1, limit: 100, isActive: true }),
      units: this.catalog.listUnits(true),
    })
      .pipe(finalize(() => this.loading.set(false)), takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: ({ suppliers, units }) => {
          this.suppliers.set(suppliers.items);
          this.units.set(
            units.filter(
              (unit) => unit.symbol.toLowerCase() !== "serv" && unit.name !== "Servicio",
            ),
          );
          const preferred = suppliers.items.find(({ isDefault }) => isDefault) ?? suppliers.items[0];
          if (preferred) this.form.controls.supplierId.setValue(preferred.id);
        },
        error: (error: unknown) =>
          this.error.set(apiErrorMessage(error, "No pudimos preparar el registro de compra.")),
      });
  }

  get items(): FormArray<PurchaseItemForm> {
    return this.form.controls.items;
  }

  addItem(): void {
    this.items.push(
      new FormGroup({
        productId: new FormControl("", {
          nonNullable: true,
          validators: [Validators.required],
        }),
        quantity: new FormControl("", {
          nonNullable: true,
          validators: [Validators.required, Validators.pattern(quantityPattern)],
        }),
        unitCost: new FormControl("", {
          nonNullable: true,
          validators: [Validators.required, Validators.pattern(moneyPattern)],
        }),
      }),
    );
  }

  removeItem(index: number): void {
    if (this.items.length > 1) this.items.removeAt(index);
    this.validateUniqueProducts();
  }

  openProductPicker(index: number): void {
    this.productPickerIndex.set(index);
    this.productPickerOpen.set(true);
    this.creatingProduct.set(false);
    this.pickerError.set("");
    this.productSearch.setValue("", { emitEvent: false });
    this.productQueries.next("");
  }

  closeProductPicker(): void {
    if (this.savingProduct()) return;
    this.productPickerOpen.set(false);
    this.creatingProduct.set(false);
  }

  selectProduct(product: CatalogConcept): void {
    const index = this.productPickerIndex();
    if (index === null || this.isAlreadyAdded(product.id, index)) return;
    this.rememberProducts([product]);
    const item = this.items.at(index);
    item.controls.productId.setValue(product.id);
    if (!item.controls.unitCost.value) item.controls.unitCost.setValue(product.cost);
    this.validateUniqueProducts();
    this.closeProductPicker();
  }

  clearProduct(index: number): void {
    this.items.at(index).controls.productId.setValue("");
    this.validateUniqueProducts();
    this.openProductPicker(index);
  }

  isAlreadyAdded(productId: string, pickerIndex = this.productPickerIndex()): boolean {
    return this.items.controls.some(
      (item, index) => index !== pickerIndex && item.controls.productId.value === productId,
    );
  }

  startQuickProduct(): void {
    const index = this.productPickerIndex();
    const defaultUnit = this.units()[0];
    this.quickProductForm.reset({
      name: this.productSearch.value.trim(),
      sku: "",
      unitId: defaultUnit?.id ?? "",
      cost: index === null ? "" : this.items.at(index).controls.unitCost.value,
      price: "",
      tracksInventory: true,
    });
    this.creatingProduct.set(true);
    this.pickerError.set("");
  }

  saveQuickProduct(): void {
    if (this.quickProductForm.invalid || this.savingProduct()) {
      this.quickProductForm.markAllAsTouched();
      return;
    }
    const raw = this.quickProductForm.getRawValue();
    const duplicate = this.productResults().find(
      ({ name }) => name.trim().toLocaleLowerCase("es-MX") === raw.name.trim().toLocaleLowerCase("es-MX"),
    );
    if (duplicate) {
      this.pickerError.set("Ya existe un producto con ese nombre. Selecciónalo del listado.");
      return;
    }
    this.savingProduct.set(true);
    this.pickerError.set("");
    this.catalog
      .createConcept({
        kind: "product",
        sku: raw.sku.trim().toUpperCase() || null,
        name: raw.name.trim(),
        unitId: raw.unitId,
        cost: Number(raw.cost),
        price: raw.price ? Number(raw.price) : 0,
        tracksInventory: raw.tracksInventory,
        minimumStock: 0,
      })
      .pipe(
        finalize(() => this.savingProduct.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: (product) => {
          const index = this.productPickerIndex();
          if (index !== null) this.items.at(index).controls.unitCost.setValue(raw.cost);
          this.selectProduct(product);
        },
        error: (error: unknown) =>
          this.pickerError.set(apiErrorMessage(error, "No pudimos crear el producto.")),
      });
  }

  next(): void {
    this.error.set("");
    if (this.step() === 1) {
      const controls = [
        this.form.controls.supplierId,
        this.form.controls.purchasedAt,
        this.form.controls.reference,
        this.form.controls.notes,
      ];
      controls.forEach((control) => control.markAsTouched());
      if (controls.some((control) => control.invalid)) return;
      this.step.set(2);
      return;
    }
    this.items.markAllAsTouched();
    this.validateUniqueProducts();
    for (const item of this.items.controls) {
      const selected = this.product(item.controls.productId.value);
      const quantity = Number(item.controls.quantity.value);
      if (selected && !selected.unit.allowsDecimals && !Number.isInteger(quantity)) {
        item.controls.quantity.setErrors({ integerOnly: true });
      }
    }
    if (this.items.invalid || this.duplicateProducts()) return;
    this.step.set(3);
  }

  previous(): void {
    if (this.step() > 1) this.step.update((step) => step - 1);
  }

  save(): void {
    if (this.form.invalid || this.duplicateProducts() || this.saving()) return;
    const raw = this.form.getRawValue();
    this.saving.set(true);
    this.error.set("");
    this.purchases
      .create({
        supplierId: raw.supplierId,
        purchasedAt: raw.purchasedAt,
        reference: raw.reference.trim() || null,
        notes: raw.notes.trim() || null,
        items: raw.items.map((item) => ({
          productId: item.productId,
          quantity: Number(item.quantity),
          unitCost: Number(item.unitCost),
        })),
      })
      .pipe(finalize(() => this.saving.set(false)), takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (purchase) => void this.router.navigate(["/purchases", purchase.id]),
        error: (error: unknown) =>
          this.error.set(apiErrorMessage(error, "No pudimos registrar la compra.")),
      });
  }

  product(id: string): CatalogConcept | undefined {
    return this.knownProducts().get(id);
  }

  supplierName(): string {
    return (
      this.suppliers().find(({ id }) => id === this.form.controls.supplierId.value)
        ?.commercialName ?? "—"
    );
  }

  productUnitSymbol(id: string): string {
    return this.product(id)?.unit.symbol ?? "";
  }

  lineAmount(item: PurchaseItemForm): number {
    return Number(item.controls.quantity.value) * Number(item.controls.unitCost.value) || 0;
  }

  money(value: number): string {
    return new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN" }).format(value);
  }

  private validateUniqueProducts(): void {
    const selected = this.items.controls
      .map((item) => item.controls.productId.value)
      .filter(Boolean);
    this.duplicateProducts.set(new Set(selected).size !== selected.length);
  }

  private rememberProducts(products: CatalogConcept[]): void {
    const known = new Map(this.knownProducts());
    for (const product of products) known.set(product.id, product);
    this.knownProducts.set(known);
  }

  private today(): string {
    const now = new Date();
    const offset = now.getTimezoneOffset() * 60_000;
    return new Date(now.getTime() - offset).toISOString().slice(0, 10);
  }
}
