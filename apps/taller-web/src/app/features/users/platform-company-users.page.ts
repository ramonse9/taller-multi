import {
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  inject,
  OnInit,
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
import { debounceTime, distinctUntilChanged, finalize, forkJoin } from "rxjs";
import { TimezoneCatalogItem } from "../../core/catalogs/catalog.models";
import { CatalogsService } from "../../core/catalogs/catalogs.service";
import { formatShortDate } from "../../core/dates/date-format";
import { apiErrorMessage } from "../../core/http/api-error";
import { ThemeService } from "../../core/theme/theme.service";
import { CompanyResponse } from "../companies/company.models";
import { CompaniesService } from "../companies/companies.service";
import { PermissionsService } from "./permissions.service";
import {
  CreatePlatformCompanyUserInput,
  PaginatedUsers,
  PermissionCatalogItem,
  PermissionTemplate,
  PermissionTemplateCode,
  TenantRole,
} from "./user.models";
import { UsersService } from "./users.service";

interface PermissionGroup {
  module: string;
  label: string;
  permissions: PermissionCatalogItem[];
}

const MODULE_LABELS: Record<string, string> = {
  dashboard: "Tablero",
  clients: "Clientes",
  vehicles: "Vehículos",
  orders: "Órdenes",
  catalog: "Productos y servicios",
  inventory: "Inventario",
  suppliers: "Proveedores",
  purchases: "Compras",
  expenses: "Gastos",
  profitability: "Utilidad",
  vehicle_catalog: "Marcas y modelos",
  users: "Usuarios",
  permissions: "Permisos",
};

const ADMIN_REQUIRED_PERMISSIONS = [
  "users.view",
  "users.manage",
  "permissions.manage",
];

@Component({
  selector: "app-platform-company-users-page",
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: "./platform-company-users.page.html",
  styleUrls: ["./users.page.css", "./platform-company-users.page.css"],
  host: { class: "block min-h-screen", "[class.dark]": "theme.isDark()" },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PlatformCompanyUsersPage implements OnInit {
  readonly theme = inject(ThemeService);
  private readonly route = inject(ActivatedRoute);
  private readonly companies = inject(CompaniesService);
  private readonly users = inject(UsersService);
  private readonly permissions = inject(PermissionsService);
  private readonly catalogs = inject(CatalogsService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly companyId =
    this.route.snapshot.paramMap.get("companyId") ?? "";

  readonly formatShortDate = formatShortDate;
  readonly loading = signal(true);
  readonly loadingContext = signal(true);
  readonly permissionsLoading = signal(true);
  readonly saving = signal(false);
  readonly error = signal("");
  readonly notice = signal("");
  readonly company = signal<CompanyResponse | null>(null);
  readonly timezones = signal<TimezoneCatalogItem[]>([]);
  readonly permissionCatalog = signal<PermissionCatalogItem[]>([]);
  readonly permissionTemplates = signal<PermissionTemplate[]>([]);
  readonly selectedTemplate = signal<PermissionTemplateCode | null>(null);
  readonly selectedPermissions = signal<string[]>([]);
  readonly targetRole = signal<TenantRole>("user");
  readonly editorOpen = signal(false);
  readonly activeFilter = signal<boolean | null>(true);
  readonly data = signal<PaginatedUsers>({
    page: 1,
    limit: 20,
    totalItems: 0,
    totalPages: 0,
    hasNextPage: false,
    items: [],
  });
  readonly search = new FormControl("", { nonNullable: true });
  readonly availablePermissions = computed(() =>
    this.permissionCatalog().filter(
      ({ code }) =>
        this.targetRole() !== "user" ||
        !ADMIN_REQUIRED_PERMISSIONS.includes(code),
    ),
  );
  readonly permissionGroups = computed<PermissionGroup[]>(() => {
    const groups = new Map<string, PermissionCatalogItem[]>();
    for (const permission of this.availablePermissions()) {
      const current = groups.get(permission.module) ?? [];
      current.push(permission);
      groups.set(permission.module, current);
    }
    return [...groups.entries()].map(([module, permissions]) => ({
      module,
      label: MODULE_LABELS[module] ?? module,
      permissions,
    }));
  });
  readonly permissionsCustomized = computed(() => {
    const template = this.permissionTemplates().find(
      ({ code }) => code === this.selectedTemplate(),
    );
    if (!template) return this.selectedPermissions().length > 0;
    const expected = this.normalizePermissions(template.permissionCodes);
    return (
      expected.join("|") !== [...this.selectedPermissions()].sort().join("|")
    );
  });

  readonly form = new FormGroup({
    fullName: new FormControl("", {
      nonNullable: true,
      validators: [
        Validators.required,
        Validators.minLength(2),
        Validators.maxLength(150),
      ],
    }),
    username: new FormControl("", {
      nonNullable: true,
      validators: [
        Validators.required,
        Validators.pattern(/^[a-z][a-z0-9._-]{1,29}$/),
      ],
    }),
    phoneCountryCode: new FormControl("+52", {
      nonNullable: true,
      validators: [Validators.required, Validators.pattern(/^\+[1-9]\d{0,3}$/)],
    }),
    phone: new FormControl("", {
      nonNullable: true,
      validators: [
        Validators.required,
        Validators.pattern(/^\d{3} \d{3} \d{2} \d{2}$/),
      ],
    }),
    email: new FormControl("", {
      nonNullable: true,
      validators: [Validators.email, Validators.maxLength(254)],
    }),
    role: new FormControl<TenantRole>("user", {
      nonNullable: true,
      validators: [Validators.required],
    }),
    timezoneCode: new FormControl("America/Mazatlan", {
      nonNullable: true,
      validators: [Validators.required],
    }),
    password: new FormControl("", {
      nonNullable: true,
      validators: [
        Validators.required,
        Validators.minLength(6),
        Validators.maxLength(10),
        Validators.pattern(/^(?=.*[A-Za-z])(?=.*\d).+$/),
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
      .subscribe(() => this.load(1));
    this.loadContext();
    this.load();
  }

  loadContext(): void {
    this.loadingContext.set(true);
    this.permissionsLoading.set(true);
    forkJoin({
      companies: this.companies.list(),
      timezones: this.catalogs.timezones(),
      catalog: this.permissions.catalog(),
      templates: this.permissions.templates(),
    })
      .pipe(
        finalize(() => {
          this.loadingContext.set(false);
          this.permissionsLoading.set(false);
        }),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: ({ companies, timezones, catalog, templates }) => {
          const company = companies.find(({ id }) => id === this.companyId);
          if (!company) {
            this.error.set("No encontramos la compañía seleccionada.");
            return;
          }
          this.company.set(company);
          this.timezones.set(timezones);
          this.permissionCatalog.set(
            [...catalog].sort(
              (left, right) => left.sortOrder - right.sortOrder,
            ),
          );
          this.permissionTemplates.set(
            [...templates].sort(
              (left, right) => left.sortOrder - right.sortOrder,
            ),
          );
        },
        error: (error: unknown) =>
          this.error.set(
            apiErrorMessage(
              error,
              "No pudimos preparar la administración de usuarios.",
            ),
          ),
      });
  }

  load(page = this.data().page): void {
    if (!this.companyId) return;
    this.loading.set(true);
    this.error.set("");
    this.users
      .listForCompany(this.companyId, {
        page,
        limit: 20,
        search: this.search.value.trim(),
        isActive: this.activeFilter(),
      })
      .pipe(
        finalize(() => this.loading.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: (data) => this.data.set(data),
        error: (error: unknown) =>
          this.error.set(
            apiErrorMessage(
              error,
              "No pudimos cargar los usuarios de la compañía.",
            ),
          ),
      });
  }

  filterBy(value: boolean | null): void {
    if (this.activeFilter() === value) return;
    this.activeFilter.set(value);
    this.load(1);
  }

  openCreate(): void {
    if (!this.company()?.isActive) return;
    this.form.reset({
      fullName: "",
      username: "",
      phoneCountryCode: "+52",
      phone: "",
      email: "",
      role: "user",
      timezoneCode: "America/Mazatlan",
      password: "",
    });
    this.targetRole.set("user");
    this.applyTemplate("reception");
    this.editorOpen.set(true);
  }

  closeEditor(): void {
    if (!this.saving()) this.editorOpen.set(false);
  }

  save(): void {
    const role = this.form.controls.role.value;
    if (
      this.form.invalid ||
      this.saving() ||
      (role !== "company_admin" && this.permissionsLoading())
    ) {
      this.form.markAllAsTouched();
      return;
    }
    const raw = this.form.getRawValue();
    const input: CreatePlatformCompanyUserInput = {
      fullName: raw.fullName.trim(),
      username: raw.username.trim().toLowerCase(),
      email: raw.email.trim().toLowerCase() || null,
      phone: `${raw.phoneCountryCode.trim()}${raw.phone.replace(/\D/g, "")}`,
      password: raw.password,
      timezoneCode: raw.timezoneCode,
      role: raw.role,
    };
    if (role !== "company_admin") {
      input.templateCode = this.selectedTemplate();
      input.permissionCodes = this.normalizePermissions(
        this.selectedPermissions(),
      );
    }
    this.saving.set(true);
    this.error.set("");
    this.users
      .createForCompany(this.companyId, input)
      .pipe(
        finalize(() => this.saving.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: ({ user }) => {
          this.editorOpen.set(false);
          this.showNotice(
            `${user.loginName} fue creado. Deberá cambiar su contraseña al iniciar sesión.`,
          );
          this.load(1);
        },
        error: (error: unknown) =>
          this.error.set(
            apiErrorMessage(error, "No pudimos crear el usuario."),
          ),
      });
  }

  roleChanged(): void {
    const role = this.form.controls.role.value;
    this.targetRole.set(role);
    if (role === "company_admin") {
      this.selectedTemplate.set(null);
      this.selectedPermissions.set(
        this.permissionCatalog().map(({ code }) => code),
      );
      return;
    }
    this.applyTemplate(role === "admin" ? "administration" : "reception");
  }

  applyTemplate(code: PermissionTemplateCode): void {
    const template = this.permissionTemplates().find(
      (candidate) => candidate.code === code,
    );
    this.selectedTemplate.set(code);
    this.selectedPermissions.set(
      this.normalizePermissions(template?.permissionCodes ?? []),
    );
  }

  togglePermission(code: string, checked: boolean): void {
    if (this.permissionLocked(code)) return;
    this.selectedPermissions.update((current) =>
      checked
        ? [...new Set([...current, code])].sort()
        : current.filter((permission) => permission !== code),
    );
  }

  hasSelectedPermission(code: string): boolean {
    return this.selectedPermissions().includes(code);
  }

  permissionLocked(code: string): boolean {
    return (
      this.targetRole() === "company_admin" ||
      (this.targetRole() === "admin" &&
        ADMIN_REQUIRED_PERMISSIONS.includes(code))
    );
  }

  previous(): void {
    if (this.data().page > 1) this.load(this.data().page - 1);
  }

  next(): void {
    if (this.data().hasNextPage) this.load(this.data().page + 1);
  }

  formatPhone(): void {
    const control = this.form.controls.phone;
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

  initials(name: string): string {
    return name
      .split(/\s+/)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase() ?? "")
      .join("");
  }

  roleLabel(role: TenantRole): string {
    if (role === "company_admin") return "Administrador principal";
    return role === "admin" ? "Administrador" : "Usuario";
  }

  managementScope(role: TenantRole): string {
    if (role === "company_admin")
      return "Administra Administradores y Usuarios";
    if (role === "admin") return "Administra únicamente Usuarios";
    return "No administra otras cuentas";
  }

  private normalizePermissions(codes: string[]): string[] {
    const available = new Set(
      this.availablePermissions().map(({ code }) => code),
    );
    const normalized = codes.filter((code) => available.has(code));
    if (this.targetRole() === "admin")
      normalized.push(...ADMIN_REQUIRED_PERMISSIONS);
    return [...new Set(normalized)].sort();
  }

  private showNotice(message: string): void {
    this.notice.set(message);
    window.setTimeout(() => this.notice.set(""), 4500);
  }
}
