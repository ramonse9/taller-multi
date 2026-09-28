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
import { apiErrorMessage } from "../../core/http/api-error";
import { ThemeService } from "../../core/theme/theme.service";
import {
  PaginatedCatalog,
  VehicleBrand,
  VehicleModel,
} from "./vehicle-catalog.models";
import { VehicleCatalogService } from "./vehicle-catalog.service";

const emptyPage = <T>(): PaginatedCatalog<T> => ({
  page: 1,
  limit: 20,
  totalItems: 0,
  totalPages: 0,
  hasNextPage: false,
  items: [],
});

@Component({
  selector: "app-vehicle-catalog-page",
  imports: [ReactiveFormsModule],
  templateUrl: "./vehicle-catalog.page.html",
  host: {
    class: "block min-h-screen",
    "[class.dark]": "theme.isDark()",
  },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class VehicleCatalogPage implements OnInit {
  private readonly catalog = inject(VehicleCatalogService);
  private readonly destroyRef = inject(DestroyRef);
  readonly theme = inject(ThemeService);

  readonly brands = signal<PaginatedCatalog<VehicleBrand>>(emptyPage());
  readonly models = signal<PaginatedCatalog<VehicleModel>>(emptyPage());
  readonly selectedBrand = signal<VehicleBrand | null>(null);
  readonly brandActive = signal(true);
  readonly modelActive = signal(true);
  readonly loadingBrands = signal(true);
  readonly loadingModels = signal(false);
  readonly saving = signal(false);
  readonly notice = signal("");
  readonly error = signal("");
  readonly brandEditorOpen = signal(false);
  readonly modelEditorOpen = signal(false);
  readonly editingBrand = signal<VehicleBrand | null>(null);
  readonly editingModel = signal<VehicleModel | null>(null);

  readonly brandSearch = new FormControl("", { nonNullable: true });
  readonly modelSearch = new FormControl("", { nonNullable: true });
  readonly brandForm = new FormGroup({
    name: new FormControl("", {
      nonNullable: true,
      validators: [
        Validators.required,
        Validators.minLength(2),
        Validators.maxLength(100),
      ],
    }),
  });
  readonly modelForm = new FormGroup({
    name: new FormControl("", {
      nonNullable: true,
      validators: [Validators.required, Validators.maxLength(100)],
    }),
  });

  ngOnInit(): void {
    this.brandSearch.valueChanges
      .pipe(
        debounceTime(300),
        distinctUntilChanged(),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe(() => this.loadBrands(1));
    this.modelSearch.valueChanges
      .pipe(
        debounceTime(300),
        distinctUntilChanged(),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe(() => this.loadModels(1));
    this.loadBrands();
  }

  loadBrands(page = this.brands().page): void {
    this.loadingBrands.set(true);
    this.error.set("");
    this.catalog
      .listBrands({
        page,
        limit: 20,
        search: this.brandSearch.value.trim(),
        isActive: this.brandActive(),
      })
      .pipe(
        finalize(() => this.loadingBrands.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: (brands) => {
          this.brands.set(brands);
          const selectedId = this.selectedBrand()?.id;
          const selected =
            brands.items.find(({ id }) => id === selectedId) ??
            brands.items[0] ??
            null;
          const changed = selected?.id !== selectedId;
          this.selectedBrand.set(selected);
          if (changed) {
            this.modelSearch.setValue("", { emitEvent: false });
            this.loadModels(1);
          } else if (!selected) {
            this.models.set(emptyPage());
          }
        },
        error: (error: unknown) =>
          this.error.set(
            apiErrorMessage(error, "No pudimos cargar las marcas."),
          ),
      });
  }

  selectBrand(brand: VehicleBrand): void {
    if (this.selectedBrand()?.id === brand.id) return;
    this.selectedBrand.set(brand);
    this.modelSearch.setValue("", { emitEvent: false });
    this.loadModels(1);
  }

  filterBrands(isActive: boolean): void {
    if (this.brandActive() === isActive) return;
    this.brandActive.set(isActive);
    this.selectedBrand.set(null);
    this.loadBrands(1);
  }

  loadModels(page = this.models().page): void {
    const brand = this.selectedBrand();
    if (!brand) {
      this.models.set(emptyPage());
      return;
    }
    this.loadingModels.set(true);
    this.error.set("");
    this.catalog
      .listModels(brand.id, {
        page,
        limit: 20,
        search: this.modelSearch.value.trim(),
        isActive: this.modelActive(),
      })
      .pipe(
        finalize(() => this.loadingModels.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: (models) => this.models.set(models),
        error: (error: unknown) =>
          this.error.set(
            apiErrorMessage(error, "No pudimos cargar los modelos."),
          ),
      });
  }

  filterModels(isActive: boolean): void {
    if (this.modelActive() === isActive) return;
    this.modelActive.set(isActive);
    this.loadModels(1);
  }

  openBrandEditor(brand: VehicleBrand | null = null): void {
    this.error.set("");
    this.editingBrand.set(brand);
    this.brandForm.reset({ name: brand?.name ?? "" });
    this.brandEditorOpen.set(true);
  }

  closeBrandEditor(): void {
    if (!this.saving()) this.brandEditorOpen.set(false);
  }

  saveBrand(): void {
    if (this.brandForm.invalid || this.saving()) {
      this.brandForm.markAllAsTouched();
      return;
    }
    const current = this.editingBrand();
    const name = this.brandForm.controls.name.value.trim();
    this.saving.set(true);
    this.error.set("");
    const request = current
      ? this.catalog.updateBrand(current.id, { name })
      : this.catalog.createBrand(name);
    request
      .pipe(
        finalize(() => this.saving.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: (saved) => {
          this.brandEditorOpen.set(false);
          this.selectedBrand.set(saved);
          this.models.set(emptyPage());
          this.showNotice(current ? "Marca actualizada." : "Marca registrada.");
          this.loadBrands(current ? this.brands().page : 1);
          this.loadModels(1);
        },
        error: (error: unknown) =>
          this.error.set(
            apiErrorMessage(error, "No pudimos guardar la marca."),
          ),
      });
  }

  changeBrandStatus(brand: VehicleBrand): void {
    if (
      brand.isActive &&
      !window.confirm(
        `¿Desactivar ${brand.name}? Sus modelos dejarán de estar disponibles.`,
      )
    )
      return;
    const request = brand.isActive
      ? this.catalog.deactivateBrand(brand.id)
      : this.catalog.updateBrand(brand.id, { isActive: true });
    this.error.set("");
    request.pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: () => {
        this.showNotice(
          brand.isActive ? "Marca desactivada." : "Marca reactivada.",
        );
        this.selectedBrand.set(null);
        this.loadBrands();
      },
      error: (error: unknown) =>
        this.error.set(
          apiErrorMessage(error, "No pudimos actualizar la marca."),
        ),
    });
  }

  openModelEditor(model: VehicleModel | null = null): void {
    if (!this.selectedBrand()) return;
    this.error.set("");
    this.editingModel.set(model);
    this.modelForm.reset({ name: model?.name ?? "" });
    this.modelEditorOpen.set(true);
  }

  closeModelEditor(): void {
    if (!this.saving()) this.modelEditorOpen.set(false);
  }

  saveModel(): void {
    const brand = this.selectedBrand();
    if (!brand || this.modelForm.invalid || this.saving()) {
      this.modelForm.markAllAsTouched();
      return;
    }
    const current = this.editingModel();
    const name = this.modelForm.controls.name.value.trim();
    this.saving.set(true);
    this.error.set("");
    const request = current
      ? this.catalog.updateModel(current.id, { name })
      : this.catalog.createModel(brand.id, name);
    request
      .pipe(
        finalize(() => this.saving.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: () => {
          this.modelEditorOpen.set(false);
          this.showNotice(
            current ? "Modelo actualizado." : "Modelo registrado.",
          );
          this.loadModels(current ? this.models().page : 1);
        },
        error: (error: unknown) =>
          this.error.set(
            apiErrorMessage(error, "No pudimos guardar el modelo."),
          ),
      });
  }

  changeModelStatus(model: VehicleModel): void {
    if (
      model.isActive &&
      !window.confirm(`¿Desactivar el modelo ${model.name}?`)
    )
      return;
    const request = model.isActive
      ? this.catalog.deactivateModel(model.id)
      : this.catalog.updateModel(model.id, { isActive: true });
    this.error.set("");
    request.pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: () => {
        this.showNotice(
          model.isActive ? "Modelo desactivado." : "Modelo reactivado.",
        );
        this.loadModels();
      },
      error: (error: unknown) =>
        this.error.set(
          apiErrorMessage(error, "No pudimos actualizar el modelo."),
        ),
    });
  }

  private showNotice(message: string): void {
    this.notice.set(message);
    window.setTimeout(() => this.notice.set(""), 3500);
  }
}
