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
import { finalize, forkJoin } from "rxjs";
import { apiErrorMessage } from "../../core/http/api-error";
import { ThemeService } from "../../core/theme/theme.service";
import { CatalogConcept } from "../concept-catalog/concept-catalog.models";
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
  readonly products = signal<CatalogConcept[]>([]);
  readonly loading = signal(true);
  readonly saving = signal(false);
  readonly error = signal("");
  readonly duplicateProducts = signal(false);

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
    forkJoin({
      suppliers: this.suppliersService.list({ page: 1, limit: 100, isActive: true }),
      concepts: this.catalog.list({ page: 1, limit: 100, kind: "product", isActive: true }),
    })
      .pipe(finalize(() => this.loading.set(false)), takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: ({ suppliers, concepts }) => {
          this.suppliers.set(suppliers.items);
          this.products.set(concepts.items);
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

  productChanged(index: number): void {
    const item = this.items.at(index);
    const product = this.product(item.controls.productId.value);
    if (product && !item.controls.unitCost.value) item.controls.unitCost.setValue(product.cost);
    this.validateUniqueProducts();
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
    return this.products().find((product) => product.id === id);
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

  private today(): string {
    const now = new Date();
    const offset = now.getTimezoneOffset() * 60_000;
    return new Date(now.getTime() - offset).toISOString().slice(0, 10);
  }
}
