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
import { debounceTime, distinctUntilChanged, finalize, forkJoin } from "rxjs";
import { apiErrorMessage } from "../../core/http/api-error";
import { ThemeService } from "../../core/theme/theme.service";
import {
  CatalogConcept,
  ConceptKind,
  MeasurementUnit,
  PaginatedConcepts,
} from "./concept-catalog.models";
import { ConceptCatalogService } from "./concept-catalog.service";

const emptyConcepts = (): PaginatedConcepts => ({
  page: 1,
  limit: 20,
  totalItems: 0,
  totalPages: 0,
  hasNextPage: false,
  items: [],
});

@Component({
  selector: "app-concept-catalog-page",
  imports: [ReactiveFormsModule],
  templateUrl: "./concept-catalog.page.html",
  host: { class: "block min-h-screen", "[class.dark]": "theme.isDark()" },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ConceptCatalogPage implements OnInit {
  private readonly catalog = inject(ConceptCatalogService);
  private readonly destroyRef = inject(DestroyRef);
  readonly theme = inject(ThemeService);

  readonly concepts = signal<PaginatedConcepts>(emptyConcepts());
  readonly activeUnits = signal<MeasurementUnit[]>([]);
  readonly units = signal<MeasurementUnit[]>([]);
  readonly loading = signal(true);
  readonly loadingUnits = signal(true);
  readonly saving = signal(false);
  readonly error = signal("");
  readonly notice = signal("");
  readonly active = signal(true);
  readonly unitActive = signal(true);
  readonly conceptEditorOpen = signal(false);
  readonly unitEditorOpen = signal(false);
  readonly editingConcept = signal<CatalogConcept | null>(null);
  readonly editingUnit = signal<MeasurementUnit | null>(null);

  readonly search = new FormControl("", { nonNullable: true });
  readonly kind = new FormControl<ConceptKind | "">("", {
    nonNullable: true,
  });
  readonly conceptForm = new FormGroup({
    kind: new FormControl<ConceptKind>("product", { nonNullable: true }),
    sku: new FormControl("", {
      nonNullable: true,
      validators: [Validators.maxLength(80)],
    }),
    name: new FormControl("", {
      nonNullable: true,
      validators: [Validators.required, Validators.maxLength(180)],
    }),
    description: new FormControl("", {
      nonNullable: true,
      validators: [Validators.maxLength(2000)],
    }),
    unitId: new FormControl("", {
      nonNullable: true,
      validators: [Validators.required],
    }),
    cost: new FormControl("0.00", {
      nonNullable: true,
      validators: [
        Validators.required,
        Validators.pattern(/^\d+(\.\d{0,2})?$/),
      ],
    }),
    price: new FormControl("0.00", {
      nonNullable: true,
      validators: [
        Validators.required,
        Validators.pattern(/^\d+(\.\d{0,2})?$/),
      ],
    }),
    tracksInventory: new FormControl(false, { nonNullable: true }),
    minimumStock: new FormControl<number | null>(0, {
      validators: [Validators.min(0)],
    }),
    satProductServiceCode: new FormControl("", {
      nonNullable: true,
      validators: [Validators.pattern(/^$|^\d{8}$/)],
    }),
  });
  readonly unitForm = new FormGroup({
    name: new FormControl("", {
      nonNullable: true,
      validators: [Validators.required, Validators.maxLength(80)],
    }),
    symbol: new FormControl("", {
      nonNullable: true,
      validators: [Validators.required, Validators.maxLength(20)],
    }),
    satCode: new FormControl("", {
      nonNullable: true,
      validators: [Validators.pattern(/^$|^[A-Z0-9]{1,3}$/)],
    }),
    allowsDecimals: new FormControl(true, { nonNullable: true }),
  });

  ngOnInit(): void {
    this.search.valueChanges
      .pipe(
        debounceTime(300),
        distinctUntilChanged(),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe(() => this.loadConcepts(1));
    this.kind.valueChanges
      .pipe(distinctUntilChanged(), takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.loadConcepts(1));
    this.loadConcepts();
    this.loadUnits();
  }

  loadConcepts(page = this.concepts().page): void {
    this.loading.set(true);
    this.error.set("");
    this.catalog
      .list({
        page,
        limit: 20,
        search: this.search.value,
        kind: this.kind.value,
        isActive: this.active(),
      })
      .pipe(
        finalize(() => this.loading.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: (concepts) => this.concepts.set(concepts),
        error: (error: unknown) =>
          this.error.set(
            apiErrorMessage(error, "No pudimos cargar los conceptos."),
          ),
      });
  }

  filterConcepts(isActive: boolean): void {
    if (this.active() === isActive) return;
    this.active.set(isActive);
    this.loadConcepts(1);
  }

  loadUnits(): void {
    this.loadingUnits.set(true);
    this.error.set("");
    forkJoin({
      active: this.catalog.listUnits(true),
      displayed: this.catalog.listUnits(this.unitActive()),
    })
      .pipe(
        finalize(() => this.loadingUnits.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: ({ active, displayed }) => {
          this.activeUnits.set(active);
          this.units.set(displayed);
          if (
            this.conceptEditorOpen() &&
            this.conceptForm.controls.kind.value === "service"
          ) {
            this.setConceptUnitState("service");
          }
        },
        error: (error: unknown) =>
          this.error.set(
            apiErrorMessage(error, "No pudimos cargar las unidades."),
          ),
      });
  }

  filterUnits(isActive: boolean): void {
    if (this.unitActive() === isActive) return;
    this.unitActive.set(isActive);
    this.loadUnits();
  }

  openConceptEditor(concept: CatalogConcept | null = null): void {
    this.editingConcept.set(concept);
    const unitOptions = concept?.unit.isActive
      ? this.activeUnits()
      : [concept?.unit, ...this.activeUnits()].filter(
          (unit): unit is MeasurementUnit => !!unit,
        );
    if (
      concept &&
      !this.activeUnits().some(({ id }) => id === concept.unit.id)
    ) {
      this.activeUnits.set(unitOptions);
    }
    this.conceptForm.reset({
      kind: concept?.kind ?? "product",
      sku: concept?.sku ?? "",
      name: concept?.name ?? "",
      description: concept?.description ?? "",
      unitId: concept?.unit.id ?? this.activeUnits()[0]?.id ?? "",
      cost: concept?.cost ?? "0.00",
      price: concept?.price ?? "0.00",
      tracksInventory: concept?.tracksInventory ?? false,
      minimumStock: concept ? Number(concept.minimumStock) : 0,
      satProductServiceCode: concept?.satProductServiceCode ?? "",
    });
    this.setConceptUnitState(concept?.kind ?? "product");
    this.conceptEditorOpen.set(true);
    this.error.set("");
  }

  conceptKindChanged(): void {
    const kind = this.conceptForm.controls.kind.value;
    this.setConceptUnitState(kind);
    if (kind === "service") {
      this.conceptForm.controls.tracksInventory.setValue(false);
      this.conceptForm.controls.minimumStock.setValue(0);
    }
  }

  conceptUnits(): MeasurementUnit[] {
    return this.conceptForm.controls.kind.value === "service"
      ? this.activeUnits().filter((unit) => this.isServiceUnit(unit))
      : this.activeUnits().filter((unit) => !this.isServiceUnit(unit));
  }

  formatDecimal(controlName: "cost" | "price"): void {
    const control = this.conceptForm.controls[controlName];
    const digitsAndPoints = control.value.replace(/[^\d.]/g, "");
    const [whole = "", ...decimalParts] = digitsAndPoints.split(".");
    const hasPoint = digitsAndPoints.includes(".");
    const decimal = decimalParts.join("").slice(0, 2);
    const value = `${whole || (hasPoint ? "0" : "")}${hasPoint ? "." : ""}${decimal}`;
    control.setValue(value, { emitEvent: false });
  }

  closeConceptEditor(): void {
    if (!this.saving()) this.conceptEditorOpen.set(false);
  }

  saveConcept(): void {
    if (this.conceptForm.invalid || this.saving()) {
      this.conceptForm.markAllAsTouched();
      return;
    }
    const raw = this.conceptForm.getRawValue();
    const input = {
      kind: raw.kind,
      sku: raw.sku.trim() || null,
      name: raw.name.trim(),
      description: raw.description.trim() || null,
      unitId: raw.unitId,
      cost: Number(raw.cost),
      price: Number(raw.price),
      tracksInventory: raw.kind === "product" ? raw.tracksInventory : false,
      minimumStock:
        raw.kind === "product" && raw.tracksInventory
          ? (raw.minimumStock ?? 0)
          : 0,
      satProductServiceCode: raw.satProductServiceCode.trim() || null,
    };
    const current = this.editingConcept();
    this.saving.set(true);
    this.error.set("");
    const request = current
      ? this.catalog.updateConcept(current.id, input)
      : this.catalog.createConcept(input);
    request
      .pipe(
        finalize(() => this.saving.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: () => {
          this.conceptEditorOpen.set(false);
          this.showNotice(
            current ? "Concepto actualizado." : "Concepto registrado.",
          );
          this.loadConcepts(current ? this.concepts().page : 1);
        },
        error: (error: unknown) =>
          this.error.set(
            apiErrorMessage(error, "No pudimos guardar el concepto."),
          ),
      });
  }

  changeConceptStatus(concept: CatalogConcept): void {
    if (concept.isActive && !window.confirm(`¿Desactivar ${concept.name}?`))
      return;
    this.catalog
      .updateConcept(concept.id, { isActive: !concept.isActive })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.showNotice(
            concept.isActive ? "Concepto desactivado." : "Concepto reactivado.",
          );
          this.loadConcepts();
        },
        error: (error: unknown) =>
          this.error.set(
            apiErrorMessage(error, "No pudimos actualizar el concepto."),
          ),
      });
  }

  openUnitEditor(unit: MeasurementUnit | null = null): void {
    this.editingUnit.set(unit);
    this.unitForm.reset({
      name: unit?.name ?? "",
      symbol: unit?.symbol ?? "",
      satCode: unit?.satCode ?? "",
      allowsDecimals: unit?.allowsDecimals ?? true,
    });
    this.unitEditorOpen.set(true);
    this.error.set("");
  }

  closeUnitEditor(): void {
    if (!this.saving()) this.unitEditorOpen.set(false);
  }

  saveUnit(): void {
    if (this.unitForm.invalid || this.saving()) {
      this.unitForm.markAllAsTouched();
      return;
    }
    const raw = this.unitForm.getRawValue();
    const input = {
      name: raw.name.trim(),
      symbol: raw.symbol.trim(),
      satCode: raw.satCode.trim().toUpperCase() || null,
      allowsDecimals: raw.allowsDecimals,
    };
    const current = this.editingUnit();
    this.saving.set(true);
    const request = current
      ? this.catalog.updateUnit(current.id, input)
      : this.catalog.createUnit(input);
    request
      .pipe(
        finalize(() => this.saving.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: () => {
          this.unitEditorOpen.set(false);
          this.showNotice(
            current ? "Unidad actualizada." : "Unidad registrada.",
          );
          this.loadUnits();
        },
        error: (error: unknown) =>
          this.error.set(
            apiErrorMessage(error, "No pudimos guardar la unidad."),
          ),
      });
  }

  changeUnitStatus(unit: MeasurementUnit): void {
    if (unit.isActive && !window.confirm(`¿Desactivar la unidad ${unit.name}?`))
      return;
    this.catalog
      .updateUnit(unit.id, { isActive: !unit.isActive })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.showNotice(
            unit.isActive ? "Unidad desactivada." : "Unidad reactivada.",
          );
          this.loadUnits();
        },
        error: (error: unknown) =>
          this.error.set(
            apiErrorMessage(error, "No pudimos actualizar la unidad."),
          ),
      });
  }

  money(value: string | number): string {
    return new Intl.NumberFormat("es-MX", {
      style: "currency",
      currency: "MXN",
    }).format(Number(value));
  }

  private setConceptUnitState(kind: ConceptKind): void {
    const unitControl = this.conceptForm.controls.unitId;
    if (kind === "service") {
      const serviceUnit = this.activeUnits().find((unit) =>
        this.isServiceUnit(unit),
      );
      unitControl.setValue(serviceUnit?.id ?? "");
      unitControl.disable({ emitEvent: false });
      return;
    }
    unitControl.enable({ emitEvent: false });
    const productUnits = this.activeUnits().filter(
      (unit) => !this.isServiceUnit(unit),
    );
    if (!productUnits.some(({ id }) => id === unitControl.value)) {
      unitControl.setValue(productUnits[0]?.id ?? "");
    }
  }

  private isServiceUnit(unit: MeasurementUnit): boolean {
    return (
      unit.symbol.toLocaleLowerCase("es-MX") === "serv" ||
      unit.name.toLocaleLowerCase("es-MX") === "servicio"
    );
  }

  private showNotice(message: string): void {
    this.notice.set(message);
    window.setTimeout(() => this.notice.set(""), 3500);
  }
}
