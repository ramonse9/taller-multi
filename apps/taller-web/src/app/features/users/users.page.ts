import {
  ChangeDetectionStrategy,
  Component,
  computed,
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
import {
  debounceTime,
  distinctUntilChanged,
  finalize,
  forkJoin,
  map,
  of,
  switchMap,
} from "rxjs";
import { AuthService } from "../../core/auth/auth.service";
import { TimezoneCatalogItem } from "../../core/catalogs/catalog.models";
import { CatalogsService } from "../../core/catalogs/catalogs.service";
import { apiErrorMessage } from "../../core/http/api-error";
import { formatShortDate } from "../../core/dates/date-format";
import { ThemeService } from "../../core/theme/theme.service";
import {
  CreateUserInput,
  PaginatedUsers,
  PermissionCatalogItem,
  PermissionTemplate,
  PermissionTemplateCode,
  TenantRole,
  TenantUser,
  UpdateUserInput,
} from "./user.models";
import { PermissionsService } from "./permissions.service";
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
  selector: "app-users-page",
  imports: [ReactiveFormsModule],
  templateUrl: "./users.page.html",
  styleUrl: "./users.page.css",
  host: { class: "block min-h-screen", "[class.dark]": "theme.isDark()" },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UsersPage implements OnInit {
  readonly auth = inject(AuthService);
  readonly theme = inject(ThemeService);
  private readonly users = inject(UsersService);
  private readonly permissions = inject(PermissionsService);
  private readonly catalogs = inject(CatalogsService);
  private readonly destroyRef = inject(DestroyRef);
  readonly formatShortDate = formatShortDate;

  readonly loading = signal(true);
  readonly saving = signal(false);
  readonly resetting = signal(false);
  readonly permissionsLoading = signal(false);
  readonly error = signal("");
  readonly notice = signal("");
  readonly data = signal<PaginatedUsers>({
    page: 1,
    limit: 20,
    totalItems: 0,
    totalPages: 0,
    hasNextPage: false,
    items: [],
  });
  readonly activeFilter = signal<boolean | null>(true);
  readonly editorOpen = signal(false);
  readonly editing = signal<TenantUser | null>(null);
  readonly passwordTarget = signal<TenantUser | null>(null);
  readonly timezones = signal<TimezoneCatalogItem[]>([]);
  readonly permissionCatalog = signal<PermissionCatalogItem[]>([]);
  readonly permissionTemplates = signal<PermissionTemplate[]>([]);
  readonly permissionSources = signal<TenantUser[]>([]);
  readonly selectedTemplate = signal<PermissionTemplateCode | null>(null);
  readonly selectedPermissions = signal<string[]>([]);
  readonly copySourceId = signal("");
  readonly targetRole = signal<TenantRole>("user");
  readonly permissionSelectionReady = signal(false);
  readonly permissionsDirty = signal(false);
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
  readonly availablePermissions = computed(() => {
    const targetRole = this.targetRole();
    const actor = this.auth.user();
    return this.permissionCatalog().filter((permission) => {
      if (
        targetRole !== "company_admin" &&
        permission.code === "vehicle_catalog.manage"
      )
        return false;
      if (
        targetRole === "user" &&
        ADMIN_REQUIRED_PERMISSIONS.includes(permission.code)
      )
        return false;
      return (
        actor?.role === "company_admin" ||
        !!actor?.permissions.includes(permission.code)
      );
    });
  });
  readonly permissionsCustomized = computed(() => {
    const template = this.permissionTemplates().find(
      ({ code }) => code === this.selectedTemplate(),
    );
    if (!template) return this.selectedPermissions().length > 0;
    const expected = this.normalizePermissions(template.permissionCodes);
    const selected = [...this.selectedPermissions()].sort();
    return expected.join("|") !== selected.join("|");
  });
  readonly search = new FormControl("", { nonNullable: true });
  readonly form = new FormGroup({
    fullName: new FormControl("", {
      nonNullable: true,
      validators: [
        Validators.required,
        Validators.minLength(2),
        Validators.maxLength(150),
      ],
    }),
    email: new FormControl("", {
      nonNullable: true,
      validators: [Validators.email, Validators.maxLength(254)],
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
    role: new FormControl<TenantRole>("user", {
      nonNullable: true,
      validators: [Validators.required],
    }),
    timezoneCode: new FormControl("America/Mazatlan", {
      nonNullable: true,
      validators: [Validators.required],
    }),
    password: new FormControl("", { nonNullable: true }),
    isActive: new FormControl(true, { nonNullable: true }),
  });
  readonly passwordForm = new FormGroup({
    password: new FormControl("", {
      nonNullable: true,
      validators: [
        Validators.required,
        Validators.minLength(6),
        Validators.maxLength(10),
        Validators.pattern(/^(?=.*[A-Za-z])(?=.*\d).+$/),
      ],
    }),
    confirmation: new FormControl("", {
      nonNullable: true,
      validators: [Validators.required],
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
    this.catalogs
      .timezones()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (timezones) => this.timezones.set(timezones),
        error: (error: unknown) =>
          this.error.set(
            apiErrorMessage(error, "No pudimos cargar las zonas horarias."),
          ),
      });
    if (this.canManagePermissions()) this.loadPermissionCatalog();
    this.load();
  }

  loadPermissionCatalog(): void {
    this.permissionsLoading.set(true);
    forkJoin({
      catalog: this.permissions.catalog(),
      templates: this.permissions.templates(),
      sources: this.users.list({
        page: 1,
        limit: 100,
        search: "",
        isActive: null,
      }),
    })
      .pipe(
        finalize(() => this.permissionsLoading.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: ({ catalog, templates, sources }) => {
          this.permissionCatalog.set(
            [...catalog].sort((left, right) => left.sortOrder - right.sortOrder),
          );
          this.permissionTemplates.set(
            [...templates].sort((left, right) => left.sortOrder - right.sortOrder),
          );
          this.permissionSources.set(sources.items);
          if (this.editorOpen() && !this.editing()) {
            this.applyTemplate(this.selectedTemplate() ?? "administration");
            this.permissionSelectionReady.set(true);
          }
        },
        error: (error: unknown) =>
          this.error.set(
            apiErrorMessage(error, "No pudimos cargar los permisos."),
          ),
      });
  }

  load(page = this.data().page): void {
    this.loading.set(true);
    this.error.set("");
    this.users
      .list({
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
            apiErrorMessage(error, "No pudimos cargar los usuarios."),
          ),
      });
  }

  filterBy(value: boolean | null): void {
    if (this.activeFilter() === value) return;
    this.activeFilter.set(value);
    this.load(1);
  }

  openCreate(): void {
    this.editing.set(null);
    if (this.canAssignRoles()) this.form.controls.role.enable();
    else this.form.controls.role.disable();
    this.form.controls.isActive.enable();
    this.form.controls.password.setValidators([
      Validators.required,
      Validators.minLength(6),
      Validators.maxLength(10),
      Validators.pattern(/^(?=.*[A-Za-z])(?=.*\d).+$/),
    ]);
    this.form.controls.password.updateValueAndValidity();
    this.form.reset({
      fullName: "",
      username: "",
      email: "",
      phoneCountryCode: "+52",
      phone: "",
      role: "user",
      timezoneCode: "America/Mazatlan",
      password: "",
      isActive: true,
    });
    this.copySourceId.set("");
    this.targetRole.set("user");
    this.applyTemplate("administration");
    this.permissionSelectionReady.set(this.permissionTemplates().length > 0);
    this.editorOpen.set(true);
  }

  openEdit(user: TenantUser): void {
    const phone = this.splitPhone(user.phone);
    if (!this.canManage(user)) return;
    this.editing.set(user);
    if (user.id === this.auth.user()?.id) {
      this.form.controls.role.disable();
      this.form.controls.isActive.disable();
    } else {
      if (this.canAssignRoles()) this.form.controls.role.enable();
      else this.form.controls.role.disable();
      this.form.controls.isActive.enable();
    }
    this.form.controls.password.clearValidators();
    this.form.controls.password.updateValueAndValidity();
    this.form.reset({
      fullName: user.fullName,
      username: user.username,
      email: user.email ?? "",
      phoneCountryCode: phone.countryCode,
      phone: phone.national,
      role: user.role,
      timezoneCode: user.timezoneCode,
      password: "",
      isActive: user.isActive,
    });
    this.copySourceId.set("");
    this.targetRole.set(user.role);
    this.selectedTemplate.set(null);
    this.selectedPermissions.set([]);
    this.permissionsDirty.set(false);
    this.permissionSelectionReady.set(
      !this.canManagePermissions() || user.role === "company_admin",
    );
    this.editorOpen.set(true);
    if (this.canManagePermissions()) this.loadPermissionProfile(user);
  }

  closeEditor(): void {
    if (!this.saving()) this.editorOpen.set(false);
  }

  save(): void {
    if (
      this.form.invalid ||
      this.saving() ||
      (this.canManagePermissions() &&
        this.form.controls.role.value !== "company_admin" &&
        !this.permissionSelectionReady())
    ) {
      this.form.markAllAsTouched();
      return;
    }
    this.saving.set(true);
    this.error.set("");
    const raw = this.form.getRawValue();
    const current = this.editing();
    const request = current
      ? this.users.update(current.id, {
          fullName: raw.fullName.trim(),
          username: raw.username.trim().toLowerCase(),
          email: raw.email.trim().toLowerCase() || null,
          phone: this.internationalPhone(raw.phoneCountryCode, raw.phone),
          role: raw.role,
          timezoneCode: raw.timezoneCode,
          isActive: raw.isActive,
        } satisfies UpdateUserInput)
      : this.users.create({
          fullName: raw.fullName.trim(),
          username: raw.username.trim().toLowerCase(),
          email: raw.email.trim().toLowerCase() || null,
          phone: this.internationalPhone(raw.phoneCountryCode, raw.phone),
          role: raw.role,
          timezoneCode: raw.timezoneCode,
          password: raw.password,
        } satisfies CreateUserInput);
    request
      .pipe(
        switchMap((savedUser) => {
          if (
            !this.canManagePermissions() ||
            savedUser.role === "company_admin" ||
            (!!current && !this.permissionsDirty())
          )
            return of(savedUser);
          return this.permissions
            .updateProfile(savedUser.id, {
              templateCode: this.selectedTemplate(),
              permissionCodes: this.normalizePermissions(
                this.selectedPermissions(),
              ),
            })
            .pipe(map(() => savedUser));
        }),
        finalize(() => this.saving.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: (savedUser) => {
          this.permissionSources.update((users) => [
            savedUser,
            ...users.filter(({ id }) => id !== savedUser.id),
          ]);
          this.editorOpen.set(false);
          this.showNotice(current ? "Usuario actualizado." : "Usuario creado.");
          this.load(current ? this.data().page : 1);
        },
        error: (error: unknown) =>
          this.error.set(
            apiErrorMessage(error, "No pudimos guardar el usuario."),
          ),
      });
  }

  openPasswordReset(user: TenantUser): void {
    if (!this.canManage(user) || user.id === this.auth.user()?.id) return;
    this.passwordTarget.set(user);
    this.passwordForm.reset({ password: "", confirmation: "" });
  }

  closePasswordReset(): void {
    if (!this.resetting()) this.passwordTarget.set(null);
  }

  resetPassword(): void {
    const target = this.passwordTarget();
    if (!target || this.passwordForm.invalid || !this.resetPasswordsMatch()) {
      this.passwordForm.markAllAsTouched();
      return;
    }
    this.resetting.set(true);
    this.error.set("");
    this.users
      .resetPassword(target.id, this.passwordForm.controls.password.value)
      .pipe(
        finalize(() => this.resetting.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: () => {
          this.passwordTarget.set(null);
          this.showNotice(`Contraseña restablecida para ${target.fullName}.`);
        },
        error: (error: unknown) =>
          this.error.set(
            apiErrorMessage(error, "No pudimos restablecer la contraseña."),
          ),
      });
  }

  deactivate(user: TenantUser): void {
    if (!this.canManage(user) || user.id === this.auth.user()?.id) return;
    if (
      !window.confirm(
        `¿Desactivar a ${user.fullName}? Ya no podrá iniciar sesión.`,
      )
    )
      return;
    this.error.set("");
    this.users
      .deactivate(user.id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.showNotice("Usuario desactivado.");
          this.load();
        },
        error: (error: unknown) =>
          this.error.set(
            apiErrorMessage(error, "No pudimos desactivar el usuario."),
          ),
      });
  }

  resetPasswordsMatch(): boolean {
    return (
      this.passwordForm.controls.password.value ===
      this.passwordForm.controls.confirmation.value
    );
  }

  previous(): void {
    if (this.data().page > 1) this.load(this.data().page - 1);
  }

  next(): void {
    if (this.data().hasNextPage) this.load(this.data().page + 1);
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

  canAssignRoles(): boolean {
    return this.auth.user()?.role === "company_admin";
  }

  canManage(user: TenantUser): boolean {
    const role = this.auth.user()?.role;
    return (
      this.auth.hasPermission("users.manage") &&
      (role === "company_admin" || (role === "admin" && user.role === "user"))
    );
  }

  canCreateUsers(): boolean {
    return this.auth.hasPermission("users.manage");
  }

  canManagePermissions(): boolean {
    return this.auth.hasPermission("permissions.manage");
  }

  managementScope(user: TenantUser): string {
    if (user.role === "company_admin")
      return "Administra Administradores y Usuarios";
    if (user.role === "admin") return "Administra únicamente Usuarios";
    return "No administra otras cuentas";
  }

  roleChanged(): void {
    const role = this.form.controls.role.value;
    this.targetRole.set(role);
    if (role === "company_admin") {
      this.selectedTemplate.set(null);
      this.selectedPermissions.set(
        this.permissionCatalog().map(({ code }) => code),
      );
      this.permissionSelectionReady.set(true);
      this.permissionsDirty.set(true);
      return;
    }
    this.applyTemplate(this.selectedTemplate() ?? "administration");
    this.permissionSelectionReady.set(this.permissionTemplates().length > 0);
  }

  applyTemplate(code: PermissionTemplateCode): void {
    const template = this.permissionTemplates().find(
      (candidate) => candidate.code === code,
    );
    this.selectedTemplate.set(code);
    this.selectedPermissions.set(
      this.normalizePermissions(template?.permissionCodes ?? []),
    );
    this.permissionsDirty.set(true);
  }

  hasSelectedPermission(code: string): boolean {
    return this.selectedPermissions().includes(code);
  }

  togglePermission(code: string, checked: boolean): void {
    if (this.permissionLocked(code)) return;
    this.selectedPermissions.update((current) =>
      checked
        ? [...new Set([...current, code])].sort()
        : current.filter((permission) => permission !== code),
    );
    this.permissionsDirty.set(true);
  }

  permissionLocked(code: string): boolean {
    return (
      this.form.controls.role.value === "company_admin" ||
      (this.form.controls.role.value === "admin" &&
        ADMIN_REQUIRED_PERMISSIONS.includes(code))
    );
  }

  copyCandidates(): TenantUser[] {
    const targetId = this.editing()?.id;
    return this.permissionSources().filter(
      (user) =>
        user.id !== targetId &&
        user.role !== "company_admin" &&
        this.canManage(user),
    );
  }

  copyPermissions(): void {
    const sourceId = this.copySourceId();
    if (!sourceId || this.permissionsLoading()) return;
    this.permissionsLoading.set(true);
    this.permissions
      .profile(sourceId)
      .pipe(
        finalize(() => this.permissionsLoading.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: (profile) => {
          this.selectedTemplate.set(profile.templateCode);
          this.selectedPermissions.set(
            this.normalizePermissions(profile.permissionCodes),
          );
          this.permissionSelectionReady.set(true);
          this.permissionsDirty.set(true);
        },
        error: (error: unknown) =>
          this.error.set(
            apiErrorMessage(error, "No pudimos copiar los permisos."),
          ),
      });
  }

  companyLoginSuffix(): string {
    const loginName = this.auth.user()?.loginName ?? "";
    const separator = loginName.lastIndexOf("@");
    return separator >= 0 ? loginName.slice(separator) : "@compania";
  }

  formatPhone(): void {
    const control = this.form.controls.phone;
    const digits = control.value.replace(/\D/g, "").slice(0, 10);
    const sections = [
      digits.slice(0, 3),
      digits.slice(3, 6),
      digits.slice(6, 8),
      digits.slice(8, 10),
    ];
    control.setValue(sections.filter(Boolean).join(" "), { emitEvent: false });
  }

  private internationalPhone(countryCode: string, nationalPhone: string): string {
    return `${countryCode.trim()}${nationalPhone.replace(/\D/g, "")}`;
  }

  private splitPhone(value: string | null): {
    countryCode: string;
    national: string;
  } {
    if (!value) return { countryCode: "+52", national: "" };
    const normalized = value.trim();
    const allDigits = normalized.replace(/\D/g, "");
    const nationalDigits = allDigits.slice(-10);
    const countryDigits = normalized.startsWith("+")
      ? allDigits.slice(0, Math.max(0, allDigits.length - nationalDigits.length))
      : "52";
    const sections = [
      nationalDigits.slice(0, 3),
      nationalDigits.slice(3, 6),
      nationalDigits.slice(6, 8),
      nationalDigits.slice(8, 10),
    ];
    return {
      countryCode: `+${countryDigits || "52"}`,
      national: sections.filter(Boolean).join(" "),
    };
  }

  private showNotice(message: string): void {
    this.notice.set(message);
    window.setTimeout(() => this.notice.set(""), 3500);
  }

  private loadPermissionProfile(user: TenantUser): void {
    this.permissionsLoading.set(true);
    this.permissions
      .profile(user.id)
      .pipe(
        finalize(() => this.permissionsLoading.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: (profile) => {
          this.selectedTemplate.set(profile.templateCode);
          this.selectedPermissions.set(
            this.normalizePermissions(profile.permissionCodes),
          );
          this.permissionSelectionReady.set(true);
          this.permissionsDirty.set(false);
        },
        error: (error: unknown) =>
          this.error.set(
            apiErrorMessage(error, "No pudimos cargar los permisos del usuario."),
          ),
      });
  }

  private normalizePermissions(codes: string[]): string[] {
    const role = this.form.controls.role.value;
    const available = new Set(
      this.availablePermissions().map(({ code }) => code),
    );
    const normalized = codes.filter((code) => available.has(code));
    if (role === "admin") normalized.push(...ADMIN_REQUIRED_PERMISSIONS);
    return [...new Set(normalized)].sort();
  }
}
