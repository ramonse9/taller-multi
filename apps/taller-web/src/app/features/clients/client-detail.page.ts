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
import { ActivatedRoute, RouterLink } from "@angular/router";
import { finalize, forkJoin } from "rxjs";
import { apiErrorMessage } from "../../core/http/api-error";
import { formatShortDate } from "../../core/dates/date-format";
import { ThemeService } from "../../core/theme/theme.service";
import {
  PaginatedCatalog,
  VehicleBrand,
  VehicleModel,
} from "../vehicle-catalog/vehicle-catalog.models";
import { VehicleCatalogService } from "../vehicle-catalog/vehicle-catalog.service";
import {
  Vehicle,
  VehicleHistory,
  VehicleInput,
} from "../vehicles/vehicle.models";
import { VehiclesService } from "../vehicles/vehicles.service";
import { Client } from "./client.models";
import { ClientsService } from "./clients.service";

@Component({
  selector: "app-client-detail-page",
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: "./client-detail.page.html",
  host: {
    class: "block min-h-screen",
    "[class.dark]": "theme.isDark()",
  },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ClientDetailPage implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly clients = inject(ClientsService);
  private readonly vehiclesService = inject(VehiclesService);
  private readonly catalog = inject(VehicleCatalogService);
  private readonly destroyRef = inject(DestroyRef);
  readonly theme = inject(ThemeService);
  readonly formatShortDate = formatShortDate;

  readonly clientId = this.route.snapshot.paramMap.get("id") ?? "";
  readonly client = signal<Client | null>(null);
  readonly vehicles = signal<Vehicle[]>([]);
  readonly brands = signal<VehicleBrand[]>([]);
  readonly models = signal<VehicleModel[]>([]);
  readonly loading = signal(true);
  readonly loadingModels = signal(false);
  readonly saving = signal(false);
  readonly loadingHistory = signal(false);
  readonly error = signal("");
  readonly notice = signal("");
  readonly editorOpen = signal(false);
  readonly editing = signal<Vehicle | null>(null);
  readonly history = signal<VehicleHistory | null>(null);
  readonly maxYear = new Date().getFullYear() + 1;

  readonly form = new FormGroup({
    brandId: new FormControl("", {
      nonNullable: true,
      validators: [Validators.required],
    }),
    modelId: new FormControl("", {
      nonNullable: true,
      validators: [Validators.required],
    }),
    year: new FormControl<number | null>(null, {
      validators: [
        Validators.required,
        Validators.min(1886),
        Validators.max(this.maxYear),
      ],
    }),
    color: new FormControl("", {
      nonNullable: true,
      validators: [Validators.required, Validators.maxLength(50)],
    }),
    numeroSerie: new FormControl("", {
      nonNullable: true,
      validators: [Validators.pattern(/^[A-HJ-NPR-Z0-9]{10}$/i)],
    }),
    licensePlate: new FormControl("", {
      nonNullable: true,
      validators: [Validators.maxLength(20)],
    }),
    isActive: new FormControl(true, { nonNullable: true }),
  });

  ngOnInit(): void {
    if (!this.clientId) {
      this.error.set("No pudimos identificar al cliente.");
      this.loading.set(false);
      return;
    }
    this.loadPage();
  }

  loadPage(): void {
    this.loading.set(true);
    this.error.set("");
    forkJoin({
      client: this.clients.getOne(this.clientId),
      vehicles: this.vehiclesService.list(this.clientId),
      brands: this.catalog.listBrands({
        page: 1,
        limit: 100,
        search: "",
        isActive: true,
      }),
    })
      .pipe(
        finalize(() => this.loading.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: ({ client, vehicles, brands }) => {
          this.client.set(client);
          this.vehicles.set(vehicles);
          this.brands.set(brands.items);
        },
        error: (error: unknown) =>
          this.error.set(
            apiErrorMessage(
              error,
              "No pudimos cargar el cliente y sus vehículos.",
            ),
          ),
      });
  }

  openCreate(): void {
    this.editing.set(null);
    this.models.set([]);
    this.form.reset({
      brandId: "",
      modelId: "",
      year: null,
      color: "",
      numeroSerie: "",
      licensePlate: "",
      isActive: true,
    });
    this.editorOpen.set(true);
  }

  openEdit(vehicle: Vehicle): void {
    this.editing.set(vehicle);
    this.form.reset({
      brandId: vehicle.brandId,
      modelId: vehicle.modelId,
      year: vehicle.year,
      color: vehicle.color,
      numeroSerie: vehicle.numeroSerie ?? "",
      licensePlate: vehicle.licensePlate ?? "",
      isActive: vehicle.isActive,
    });
    this.editorOpen.set(true);
    this.loadModels(vehicle.brandId, vehicle.modelId);
  }

  closeEditor(): void {
    if (!this.saving()) this.editorOpen.set(false);
  }

  brandChanged(): void {
    const brandId = this.form.controls.brandId.value;
    this.form.controls.modelId.setValue("");
    this.models.set([]);
    if (brandId) this.loadModels(brandId);
  }

  formatNumeroSerie(): void {
    const control = this.form.controls.numeroSerie;
    control.setValue(
      control.value
        .toUpperCase()
        .replace(/[^A-HJ-NPR-Z0-9]/g, "")
        .slice(0, 10),
      { emitEvent: false },
    );
  }

  formatPlate(): void {
    const control = this.form.controls.licensePlate;
    control.setValue(control.value.toUpperCase().slice(0, 20), {
      emitEvent: false,
    });
  }

  save(): void {
    if (this.form.invalid || this.saving()) {
      this.form.markAllAsTouched();
      return;
    }
    const raw = this.form.getRawValue();
    if (raw.year === null) return;
    const input: VehicleInput = {
      brandId: raw.brandId,
      modelId: raw.modelId,
      year: raw.year,
      color: raw.color.trim(),
      numeroSerie: raw.numeroSerie.trim() || null,
      licensePlate: raw.licensePlate.trim() || null,
      isActive: raw.isActive,
    };
    const current = this.editing();
    this.saving.set(true);
    this.error.set("");
    const request = current
      ? this.vehiclesService.update(this.clientId, current.id, input)
      : this.vehiclesService.create(this.clientId, input);
    request
      .pipe(
        finalize(() => this.saving.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: () => {
          this.editorOpen.set(false);
          this.showNotice(
            current ? "Vehículo actualizado." : "Vehículo registrado.",
          );
          this.loadVehicles();
        },
        error: (error: unknown) =>
          this.error.set(
            apiErrorMessage(error, "No pudimos guardar el vehículo."),
          ),
      });
  }

  openHistory(vehicle: Vehicle): void {
    if (!vehicle.numeroSerie) return;
    this.loadingHistory.set(true);
    this.error.set("");
    this.vehiclesService
      .history(vehicle.numeroSerie, vehicle.brandId)
      .pipe(
        finalize(() => this.loadingHistory.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: (history) => this.history.set(history),
        error: (error: unknown) =>
          this.error.set(
            apiErrorMessage(error, "No pudimos consultar el historial."),
          ),
      });
  }

  closeHistory(): void {
    this.history.set(null);
  }

  statusName(status: string): string {
    return (
      {
        draft: "Borrador",
        open: "Abierta",
        in_progress: "En proceso",
        completed: "Terminada",
        cancelled: "Cancelada",
      }[status] ?? status
    );
  }

  private loadVehicles(): void {
    this.vehiclesService
      .list(this.clientId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (vehicles) => this.vehicles.set(vehicles),
        error: (error: unknown) =>
          this.error.set(
            apiErrorMessage(error, "No pudimos actualizar los vehículos."),
          ),
      });
  }

  private loadModels(brandId: string, selectedModelId = ""): void {
    this.loadingModels.set(true);
    this.catalog
      .listModels(brandId, {
        page: 1,
        limit: 100,
        search: "",
        isActive: true,
      })
      .pipe(
        finalize(() => this.loadingModels.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: (page: PaginatedCatalog<VehicleModel>) => {
          this.models.set(page.items);
          if (selectedModelId)
            this.form.controls.modelId.setValue(selectedModelId);
        },
        error: (error: unknown) =>
          this.error.set(
            apiErrorMessage(error, "No pudimos cargar los modelos."),
          ),
      });
  }

  private showNotice(message: string): void {
    this.notice.set(message);
    window.setTimeout(() => this.notice.set(""), 3000);
  }
}
