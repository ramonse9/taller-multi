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
import {
  FormArray,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from "@angular/forms";
import { ActivatedRoute, Router, RouterLink } from "@angular/router";
import {
  catchError,
  debounceTime,
  distinctUntilChanged,
  finalize,
  forkJoin,
  map,
  of,
  switchMap,
} from "rxjs";
import { AuthService } from "../../core/auth/auth.service";
import { apiErrorMessage } from "../../core/http/api-error";
import { ThemeService } from "../../core/theme/theme.service";
import { Client, ClientInput, CustomerType } from "../clients/client.models";
import { ClientsService } from "../clients/clients.service";
import { CatalogConcept } from "../concept-catalog/concept-catalog.models";
import { ConceptCatalogService } from "../concept-catalog/concept-catalog.service";
import {
  VehicleBrand,
  VehicleModel,
} from "../vehicle-catalog/vehicle-catalog.models";
import { VehicleCatalogService } from "../vehicle-catalog/vehicle-catalog.service";
import { CreateVehicleInput, Vehicle } from "../vehicles/vehicle.models";
import { VehiclesService } from "../vehicles/vehicles.service";
import { Order, OrderInput, OrderItemKind } from "./order.models";
import { OrdersService } from "./orders.service";

@Component({
  selector: "app-order-wizard-page",
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: "./order-wizard.page.html",
  host: { class: "block min-h-screen", "[class.dark]": "theme.isDark()" },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OrderWizardPage implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly orders = inject(OrdersService);
  private readonly clientsService = inject(ClientsService);
  private readonly vehiclesService = inject(VehiclesService);
  private readonly catalog = inject(VehicleCatalogService);
  private readonly conceptCatalog = inject(ConceptCatalogService);
  private readonly destroyRef = inject(DestroyRef);
  readonly auth = inject(AuthService);
  readonly theme = inject(ThemeService);

  readonly orderId = this.route.snapshot.paramMap.get("id") ?? "";
  readonly editing = !!this.orderId;
  readonly step = signal(1);
  readonly loading = signal(true);
  readonly saving = signal(false);
  readonly quickSaving = signal(false);
  readonly savingCatalog = signal(false);
  readonly loadingModels = signal(false);
  readonly error = signal("");
  readonly catalogError = signal("");
  readonly catalogNotice = signal("");
  readonly clients = signal<Client[]>([]);
  readonly clientTotal = signal(0);
  readonly searchingClients = signal(false);
  readonly clientListError = signal("");
  readonly selectedClientSummary = signal<{
    id: string;
    displayName: string;
  } | null>(null);
  readonly vehicles = signal<Vehicle[]>([]);
  readonly brands = signal<VehicleBrand[]>([]);
  readonly models = signal<VehicleModel[]>([]);
  readonly concepts = signal<CatalogConcept[]>([]);
  readonly systemFolio = signal<string | null>(null);
  readonly showClientForm = signal(false);
  readonly showVehicleForm = signal(false);
  readonly clientSearch = new FormControl("", { nonNullable: true });
  readonly conceptSearch = new FormControl("", { nonNullable: true });
  readonly brandSearch = new FormControl("", { nonNullable: true });
  readonly modelSearch = new FormControl("", { nonNullable: true });
  readonly maxYear = new Date().getFullYear() + 1;
  readonly canManageCatalog = computed(() =>
    this.auth.hasPermission("vehicle_catalog.manage"),
  );
  readonly canUseItemCatalog = computed(
    () =>
      this.auth.hasFeature("item_catalog") &&
      this.auth.hasPermission("catalog.view"),
  );
  readonly canUseProfitability = computed(
    () =>
      this.auth.hasFeature("profitability") &&
      this.auth.hasPermission("catalog.view_costs"),
  );

  filteredClients(): Client[] {
    return this.clients();
  }

  selectedClient(): { id: string; displayName: string } | null {
    return (
      this.clients().find(
        ({ id }) => id === this.orderForm.controls.customerId.value,
      ) ?? this.selectedClientSummary()
    );
  }

  selectedVehicle(): Vehicle | null {
    return (
      this.vehicles().find(
        ({ id }) => id === this.orderForm.controls.vehicleId.value,
      ) ?? null
    );
  }

  readonly orderForm = new FormGroup({
    externalFolio: new FormControl("", {
      nonNullable: true,
      validators: [Validators.maxLength(50)],
    }),
    customerId: new FormControl("", {
      nonNullable: true,
      validators: [Validators.required],
    }),
    vehicleId: new FormControl("", {
      nonNullable: true,
      validators: [Validators.required],
    }),
    items: new FormArray([this.createItemGroup()]),
  });
  readonly clientForm = new FormGroup({
    type: new FormControl<CustomerType>("person", { nonNullable: true }),
    displayName: new FormControl("", {
      nonNullable: true,
      validators: [
        Validators.required,
        Validators.minLength(2),
        Validators.maxLength(180),
      ],
    }),
    phoneCountryCode: new FormControl("+52", {
      nonNullable: true,
      validators: [Validators.required, Validators.pattern(/^\+[1-9]\d{0,2}$/)],
    }),
    phone: new FormControl("", {
      nonNullable: true,
      validators: [
        Validators.required,
        Validators.pattern(/^\d{3} \d{3} \d{2} \d{2}$/),
      ],
    }),
  });
  readonly vehicleForm = new FormGroup({
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
  });

  get items(): FormArray {
    return this.orderForm.controls.items;
  }

  ngOnInit(): void {
    this.clientSearch.valueChanges
      .pipe(
        debounceTime(300),
        distinctUntilChanged(),
        switchMap((search) => {
          this.searchingClients.set(true);
          this.clientListError.set("");
          return this.clientsService
            .list({
              page: 1,
              limit: 20,
              search: search.trim(),
              isActive: true,
            })
            .pipe(
              map((data) => ({ data, error: "" })),
              catchError((error: unknown) =>
                of({
                  data: null,
                  error: apiErrorMessage(error, "No pudimos buscar clientes."),
                }),
              ),
            );
        }),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe(({ data, error }) => {
        this.searchingClients.set(false);
        this.clientListError.set(error);
        if (!data) return;
        this.clients.set(data.items);
        this.clientTotal.set(data.totalItems);
      });

    forkJoin({
      clients: this.clientsService.list({
        page: 1,
        limit: 20,
        search: "",
        isActive: true,
      }),
      brands: this.catalog.listBrands({
        page: 1,
        limit: 100,
        search: "",
        isActive: true,
      }),
      concepts: this.canUseItemCatalog()
        ? this.conceptCatalog.list()
        : of({ items: [] as CatalogConcept[] }),
    })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: ({ clients, brands, concepts }) => {
          this.clients.set(clients.items);
          this.clientTotal.set(clients.totalItems);
          this.brands.set(brands.items);
          this.concepts.set(concepts.items);
          if (this.editing) this.loadOrder();
          else this.loading.set(false);
        },
        error: (error: unknown) => {
          this.loading.set(false);
          this.error.set(
            apiErrorMessage(error, "No pudimos preparar la nueva orden."),
          );
        },
      });
  }

  selectClient(client: Client): void {
    if (this.orderForm.controls.customerId.value === client.id) return;
    this.selectedClientSummary.set({
      id: client.id,
      displayName: client.displayName,
    });
    this.orderForm.controls.customerId.setValue(client.id);
    this.orderForm.controls.vehicleId.setValue("");
    this.vehicles.set([]);
    this.showClientForm.set(false);
    this.loadVehicles(client.id);
  }

  selectVehicle(vehicle: Vehicle): void {
    this.orderForm.controls.vehicleId.setValue(vehicle.id);
    this.showVehicleForm.set(false);
  }

  goTo(step: number): void {
    if (step > 1 && !this.orderForm.controls.customerId.value) return;
    if (step > 2 && !this.orderForm.controls.vehicleId.value) return;
    if (step > 3 && this.items.invalid) {
      this.items.markAllAsTouched();
      return;
    }
    this.error.set("");
    this.step.set(step);
  }

  saveClient(): void {
    if (this.clientForm.invalid || this.quickSaving()) {
      this.clientForm.markAllAsTouched();
      return;
    }
    const raw = this.clientForm.getRawValue();
    const digits = raw.phone.replace(/\D/g, "");
    const input: ClientInput = {
      type: raw.type,
      displayName: raw.displayName.trim(),
      legalName: null,
      contactName: null,
      taxId: null,
      email: null,
      phone: `${raw.phoneCountryCode}${digits}`,
      notes: null,
    };
    this.quickSaving.set(true);
    this.clientsService
      .create(input)
      .pipe(
        finalize(() => this.quickSaving.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: (client) => {
          this.clients.update((clients) => [client, ...clients]);
          this.clientTotal.update((total) => total + 1);
          this.clientSearch.setValue("");
          this.clientForm.reset({
            type: "person",
            displayName: "",
            phoneCountryCode: "+52",
            phone: "",
          });
          this.selectClient(client);
        },
        error: (error: unknown) =>
          this.error.set(
            apiErrorMessage(error, "No pudimos crear el cliente."),
          ),
      });
  }

  saveVehicle(): void {
    if (
      this.vehicleForm.invalid ||
      this.quickSaving() ||
      this.savingCatalog()
    ) {
      this.vehicleForm.markAllAsTouched();
      return;
    }
    const customerId = this.orderForm.controls.customerId.value;
    const raw = this.vehicleForm.getRawValue();
    if (!customerId || raw.year === null) return;
    const input: CreateVehicleInput = {
      brandId: raw.brandId,
      modelId: raw.modelId,
      year: raw.year,
      color: raw.color.trim(),
      numeroSerie: raw.numeroSerie.trim() || null,
      licensePlate: raw.licensePlate.trim() || null,
    };
    this.quickSaving.set(true);
    this.vehiclesService
      .create(customerId, input)
      .pipe(
        finalize(() => this.quickSaving.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: (vehicle) => {
          this.vehicles.update((vehicles) => [vehicle, ...vehicles]);
          this.resetVehicleForm();
          this.selectVehicle(vehicle);
        },
        error: (error: unknown) =>
          this.error.set(
            apiErrorMessage(error, "No pudimos crear el vehículo."),
          ),
      });
  }

  brandSearchChanged(): void {
    this.clearCatalogFeedback();
    const brand = this.findBrand(this.brandSearch.value);
    const brandId = brand?.id ?? "";
    if (this.vehicleForm.controls.brandId.value === brandId) return;
    this.vehicleForm.controls.brandId.setValue(brandId);
    this.vehicleForm.controls.modelId.setValue("");
    this.modelSearch.setValue("");
    this.models.set([]);
    if (brandId) this.loadModels(brandId);
  }

  modelSearchChanged(): void {
    this.clearCatalogFeedback();
    const model = this.findModel(this.modelSearch.value);
    this.vehicleForm.controls.modelId.setValue(model?.id ?? "");
  }

  canCreateBrand(): boolean {
    const name = this.cleanCatalogName(this.brandSearch.value);
    return (
      this.canManageCatalog() &&
      name.length >= 2 &&
      name.length <= 100 &&
      !this.findBrand(name)
    );
  }

  canCreateModel(): boolean {
    const name = this.cleanCatalogName(this.modelSearch.value);
    return (
      this.canManageCatalog() &&
      !!this.vehicleForm.controls.brandId.value &&
      name.length >= 1 &&
      name.length <= 100 &&
      !this.findModel(name)
    );
  }

  createBrand(): void {
    const name = this.cleanCatalogName(this.brandSearch.value);
    if (!this.canCreateBrand() || this.savingCatalog()) return;
    this.savingCatalog.set(true);
    this.clearCatalogFeedback();
    this.catalog
      .createBrand(name)
      .pipe(
        finalize(() => this.savingCatalog.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: (brand) => {
          this.brands.update((brands) =>
            [...brands.filter(({ id }) => id !== brand.id), brand].sort(
              (left, right) => left.name.localeCompare(right.name, "es"),
            ),
          );
          this.brandSearch.setValue(brand.name);
          this.vehicleForm.controls.brandId.setValue(brand.id);
          this.modelSearch.setValue("");
          this.vehicleForm.controls.modelId.setValue("");
          this.models.set([]);
          this.catalogNotice.set(`Marca ${brand.name} creada y seleccionada.`);
          this.loadModels(brand.id);
        },
        error: (error: unknown) =>
          this.catalogError.set(
            apiErrorMessage(error, "No pudimos crear la marca."),
          ),
      });
  }

  createModel(): void {
    const brandId = this.vehicleForm.controls.brandId.value;
    const name = this.cleanCatalogName(this.modelSearch.value);
    if (!brandId || !this.canCreateModel() || this.savingCatalog()) return;
    this.savingCatalog.set(true);
    this.clearCatalogFeedback();
    this.catalog
      .createModel(brandId, name)
      .pipe(
        finalize(() => this.savingCatalog.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: (model) => {
          this.models.update((models) =>
            [...models.filter(({ id }) => id !== model.id), model].sort(
              (left, right) => left.name.localeCompare(right.name, "es"),
            ),
          );
          this.modelSearch.setValue(model.name);
          this.vehicleForm.controls.modelId.setValue(model.id);
          this.catalogNotice.set(`Modelo ${model.name} creado y seleccionado.`);
        },
        error: (error: unknown) =>
          this.catalogError.set(
            apiErrorMessage(error, "No pudimos crear el modelo."),
          ),
      });
  }

  addItem(): void {
    if (this.items.length >= 50) return;
    this.items.push(this.createItemGroup());
    this.organizeItems();
  }

  addCatalogItem(concept: CatalogConcept): void {
    if (this.items.length >= 50) return;
    const initialFreeItem =
      this.items.length === 1 &&
      !this.items.at(0).value["description"] &&
      !this.items.at(0).value["productServiceId"];
    const group = this.createItemGroup({
      productServiceId: concept.id,
      kind: concept.kind,
      description: concept.name,
      quantity: 1,
      affectsOrderTotal: concept.kind === "service",
      unitPrice: concept.kind === "service" ? Number(concept.price) : null,
      suggestedUnitPrice: Number(concept.price),
      unitCost: concept.cost === null ? null : Number(concept.cost),
      unitName: concept.unit.name,
      unitSymbol: concept.unit.symbol,
      tracksInventory: concept.tracksInventory,
    });
    if (initialFreeItem) this.items.setControl(0, group);
    else this.items.push(group);
    this.organizeItems();
    this.conceptSearch.setValue("");
  }

  filteredConcepts(): CatalogConcept[] {
    const term = this.normalizeCatalogName(this.conceptSearch.value);
    if (!term) return this.concepts().slice(0, 8);
    return this.concepts()
      .filter((concept) =>
        this.normalizeCatalogName(
          [concept.sku ?? "", concept.name, concept.description ?? ""].join(
            " ",
          ),
        ).includes(term),
      )
      .slice(0, 8);
  }

  removeItem(index: number): void {
    if (this.items.length > 1) this.items.removeAt(index);
  }

  setItemKind(index: number, kind: OrderItemKind): void {
    const item = this.items.at(index);
    if (item.get("productServiceId")?.value) return;
    item.get("kind")?.setValue(kind);
    item.get("unitName")?.setValue(kind === "service" ? "Servicio" : "Unidad");
    item.get("unitSymbol")?.setValue(kind === "service" ? "serv" : "u");
    this.setItemBilling(index, kind === "service");
  }

  setItemBilling(index: number, affectsOrderTotal: boolean): void {
    const item = this.items.at(index);
    if (item.get("kind")?.value !== "product" && !affectsOrderTotal) return;
    item.get("affectsOrderTotal")?.setValue(affectsOrderTotal);
    const price = item.get("unitPrice");
    if (affectsOrderTotal) {
      if (price?.value === null) {
        const suggested = item.get("suggestedUnitPrice")?.value;
        if (suggested !== null && suggested !== undefined)
          price?.setValue(suggested);
      }
      price?.setValidators([Validators.required, Validators.min(0)]);
    } else {
      price?.setValue(null);
      price?.setValidators([Validators.min(0)]);
    }
    price?.updateValueAndValidity();
    this.organizeItems();
  }

  isFirstInput(index: number): boolean {
    return (
      !this.items.at(index).get("affectsOrderTotal")?.value &&
      (index === 0 ||
        !!this.items.at(index - 1).get("affectsOrderTotal")?.value)
    );
  }

  isExplicitZeroCost(index: number): boolean {
    return this.items.at(index).get("unitCost")?.value === 0;
  }

  itemAmount(index: number): number | null {
    const raw = this.items.at(index).value as {
      affectsOrderTotal?: boolean;
      quantity?: number | null;
      unitPrice?: number | null;
    };
    if (!raw.affectsOrderTotal) return 0;
    return raw.unitPrice === null ||
      raw.unitPrice === undefined ||
      raw.quantity === null ||
      raw.quantity === undefined
      ? null
      : Number(raw.quantity) * Number(raw.unitPrice);
  }

  total(): number | null {
    const amounts = this.items.controls.map((_, index) =>
      this.itemAmount(index),
    );
    return amounts.some((amount) => amount === null)
      ? null
      : amounts.reduce<number>((sum, amount) => sum + (amount ?? 0), 0);
  }

  inputCost(): number | null {
    const inputs = this.items.controls.filter(
      (item) => !item.get("affectsOrderTotal")?.value,
    );
    if (!inputs.length) return 0;
    const costs = inputs.map((item) => {
      const quantity = item.get("quantity")?.value;
      const unitCost = item.get("unitCost")?.value;
      return quantity === null ||
        quantity === undefined ||
        unitCost === null ||
        unitCost === undefined
        ? null
        : Number(quantity) * Number(unitCost);
    });
    return costs.some((cost) => cost === null)
      ? null
      : costs.reduce<number>((sum, cost) => sum + (cost ?? 0), 0);
  }

  grossProfit(): number | null {
    const subtotal = this.total();
    const costs = this.items.controls.map((item) => {
      const quantity = item.get("quantity")?.value;
      const unitCost = item.get("unitCost")?.value;
      return quantity === null ||
        quantity === undefined ||
        unitCost === null ||
        unitCost === undefined
        ? null
        : Number(quantity) * Number(unitCost);
    });
    return subtotal === null || costs.some((cost) => cost === null)
      ? null
      : subtotal - costs.reduce<number>((sum, cost) => sum + (cost ?? 0), 0);
  }

  money(value: number | string | null): string {
    return value === null
      ? "Por definir"
      : new Intl.NumberFormat("es-MX", {
          style: "currency",
          currency: "MXN",
        }).format(Number(value));
  }

  formatPhone(): void {
    const control = this.clientForm.controls.phone;
    const digits = control.value.replace(/\D/g, "").slice(0, 10);
    control.setValue(
      [
        digits.slice(0, 3),
        digits.slice(3, 6),
        digits.slice(6, 8),
        digits.slice(8, 10),
      ]
        .filter(Boolean)
        .join(" "),
      { emitEvent: false },
    );
  }

  formatNumeroSerie(): void {
    const control = this.vehicleForm.controls.numeroSerie;
    control.setValue(
      control.value
        .toUpperCase()
        .replace(/[^A-HJ-NPR-Z0-9]/g, "")
        .slice(0, 10),
      { emitEvent: false },
    );
  }

  formatPlate(): void {
    const control = this.vehicleForm.controls.licensePlate;
    control.setValue(control.value.toUpperCase().slice(0, 20), {
      emitEvent: false,
    });
  }

  saveOrder(): void {
    if (this.orderForm.invalid || this.saving()) {
      this.orderForm.markAllAsTouched();
      return;
    }
    const raw = this.orderForm.getRawValue();
    const input: OrderInput = {
      externalFolio: raw.externalFolio.trim().replace(/\s+/g, " ") || null,
      customerId: raw.customerId,
      vehicleId: raw.vehicleId,
      items: raw.items.map((item) => ({
        itemId: item["itemId"] || undefined,
        productServiceId: item["productServiceId"] || null,
        kind: item["kind"],
        description: String(item["description"]).trim(),
        affectsOrderTotal: Boolean(item["affectsOrderTotal"]),
        quantity: Number(item["quantity"]),
        unitPrice:
          item["unitPrice"] === null || item["unitPrice"] === undefined
            ? null
            : Number(item["unitPrice"]),
        unitCost:
          item["unitCost"] === null || item["unitCost"] === undefined
            ? null
            : Number(item["unitCost"]),
      })),
    };
    this.saving.set(true);
    this.error.set("");
    const request = this.editing
      ? this.orders.update(this.orderId, input)
      : this.orders.create(input);
    request
      .pipe(
        finalize(() => this.saving.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: (order) => void this.router.navigate(["/orders", order.id]),
        error: (error: unknown) =>
          this.error.set(
            apiErrorMessage(error, "No pudimos guardar la orden."),
          ),
      });
  }

  private createItemGroup(
    value: {
      itemId?: string;
      productServiceId?: string | null;
      kind?: OrderItemKind;
      description?: string;
      quantity?: number;
      unitPrice?: number | null;
      unitCost?: number | null;
      unitName?: string;
      unitSymbol?: string;
      tracksInventory?: boolean;
      affectsOrderTotal?: boolean;
      suggestedUnitPrice?: number | null;
    } = {},
  ): FormGroup {
    const kind = value.kind ?? "service";
    const affectsOrderTotal = value.affectsOrderTotal ?? kind === "service";
    return new FormGroup({
      itemId: new FormControl(value.itemId ?? "", { nonNullable: true }),
      productServiceId: new FormControl(value.productServiceId ?? "", {
        nonNullable: true,
      }),
      kind: new FormControl<OrderItemKind>(kind, {
        nonNullable: true,
      }),
      description: new FormControl(value.description ?? "", {
        nonNullable: true,
        validators: [Validators.required, Validators.maxLength(300)],
      }),
      quantity: new FormControl<number | null>(value.quantity ?? 1, {
        validators: [Validators.required, Validators.min(1)],
      }),
      affectsOrderTotal: new FormControl(affectsOrderTotal, {
        nonNullable: true,
      }),
      suggestedUnitPrice: new FormControl<number | null>(
        value.suggestedUnitPrice ?? value.unitPrice ?? null,
      ),
      unitPrice: new FormControl<number | null>(value.unitPrice ?? null, {
        validators: affectsOrderTotal
          ? [Validators.required, Validators.min(0)]
          : [Validators.min(0)],
      }),
      unitCost: new FormControl<number | null>(value.unitCost ?? null, {
        validators: [Validators.min(0)],
      }),
      unitName: new FormControl(
        value.unitName ?? (kind === "product" ? "Unidad" : "Servicio"),
        {
          nonNullable: true,
        },
      ),
      unitSymbol: new FormControl(
        value.unitSymbol ?? (kind === "product" ? "u" : "serv"),
        {
          nonNullable: true,
        },
      ),
      tracksInventory: new FormControl(value.tracksInventory ?? false, {
        nonNullable: true,
      }),
    });
  }

  private organizeItems(): void {
    const ordered = [...this.items.controls].sort(
      (left, right) =>
        Number(!left.get("affectsOrderTotal")?.value) -
        Number(!right.get("affectsOrderTotal")?.value),
    );
    if (ordered.every((control, index) => control === this.items.at(index)))
      return;
    this.items.clear();
    ordered.forEach((control) => this.items.push(control));
  }

  private loadOrder(): void {
    this.orders
      .getOne(this.orderId)
      .pipe(
        finalize(() => this.loading.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: (order) => this.hydrateOrder(order),
        error: (error: unknown) =>
          this.error.set(apiErrorMessage(error, "No pudimos cargar la orden.")),
      });
  }

  private hydrateOrder(order: Order): void {
    this.systemFolio.set(order.folio);
    this.orderForm.controls.externalFolio.setValue(order.externalFolio ?? "");
    this.selectedClientSummary.set({
      id: order.customer.id,
      displayName: order.customer.displayName,
    });
    this.orderForm.controls.customerId.setValue(order.customer.id);
    this.orderForm.controls.vehicleId.setValue(order.vehicle.id);
    this.items.clear();
    order.items.forEach((item) => {
      const catalogPrice = this.concepts().find(
        (concept) => concept.id === item.productServiceId,
      )?.price;
      const group = this.createItemGroup({
        itemId: item.id,
        productServiceId: item.productServiceId ?? "",
        kind: item.kind,
        description: item.description,
        affectsOrderTotal: item.affectsOrderTotal,
        quantity: Number(item.quantity),
        unitPrice: item.unitPrice === null ? null : Number(item.unitPrice),
        suggestedUnitPrice:
          item.unitPrice !== null
            ? Number(item.unitPrice)
            : catalogPrice === undefined
              ? null
              : Number(catalogPrice),
        unitCost: item.unitCost === null ? null : Number(item.unitCost),
        unitName: item.unitName,
        unitSymbol: item.unitSymbol,
        tracksInventory: item.tracksInventory,
      });
      this.items.push(group);
    });
    this.organizeItems();
    this.loadVehicles(order.customer.id, order.vehicle.id);
  }

  private loadVehicles(customerId: string, selectedVehicleId = ""): void {
    this.vehiclesService
      .list(customerId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (vehicles) => {
          this.vehicles.set(
            vehicles.filter(
              ({ isActive, id }) => isActive || id === selectedVehicleId,
            ),
          );
          if (selectedVehicleId)
            this.orderForm.controls.vehicleId.setValue(selectedVehicleId);
        },
        error: (error: unknown) =>
          this.error.set(
            apiErrorMessage(error, "No pudimos cargar los vehículos."),
          ),
      });
  }

  private loadModels(brandId: string): void {
    this.loadingModels.set(true);
    this.catalog
      .listModels(brandId, { page: 1, limit: 100, search: "", isActive: true })
      .pipe(
        finalize(() => this.loadingModels.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: (models) => this.models.set(models.items),
        error: (error: unknown) =>
          this.error.set(
            apiErrorMessage(error, "No pudimos cargar los modelos."),
          ),
      });
  }

  private resetVehicleForm(): void {
    this.vehicleForm.reset({
      brandId: "",
      modelId: "",
      year: null,
      color: "",
      numeroSerie: "",
      licensePlate: "",
    });
    this.brandSearch.setValue("");
    this.modelSearch.setValue("");
    this.models.set([]);
    this.clearCatalogFeedback();
  }

  private findBrand(name: string): VehicleBrand | undefined {
    const normalized = this.normalizeCatalogName(name);
    return this.brands().find(
      (brand) => this.normalizeCatalogName(brand.name) === normalized,
    );
  }

  private findModel(name: string): VehicleModel | undefined {
    const normalized = this.normalizeCatalogName(name);
    return this.models().find(
      (model) => this.normalizeCatalogName(model.name) === normalized,
    );
  }

  private cleanCatalogName(name: string): string {
    return name.trim().replace(/\s+/g, " ");
  }

  private normalizeCatalogName(name: string): string {
    return this.cleanCatalogName(name)
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLocaleLowerCase("es-MX");
  }

  private clearCatalogFeedback(): void {
    this.catalogError.set("");
    this.catalogNotice.set("");
  }
}
