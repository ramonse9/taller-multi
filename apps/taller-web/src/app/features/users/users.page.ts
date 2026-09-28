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
import { AuthService } from "../../core/auth/auth.service";
import { TimezoneCatalogItem } from "../../core/catalogs/catalog.models";
import { CatalogsService } from "../../core/catalogs/catalogs.service";
import { apiErrorMessage } from "../../core/http/api-error";
import { formatShortDate } from "../../core/dates/date-format";
import {
  CreateUserInput,
  PaginatedUsers,
  TenantRole,
  TenantUser,
  UpdateUserInput,
} from "./user.models";
import { UsersService } from "./users.service";

@Component({
  selector: "app-users-page",
  imports: [ReactiveFormsModule],
  templateUrl: "./users.page.html",
  styleUrl: "./users.page.css",
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UsersPage implements OnInit {
  readonly auth = inject(AuthService);
  private readonly users = inject(UsersService);
  private readonly catalogs = inject(CatalogsService);
  private readonly destroyRef = inject(DestroyRef);
  readonly formatShortDate = formatShortDate;

  readonly loading = signal(true);
  readonly saving = signal(false);
  readonly resetting = signal(false);
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
    phone: new FormControl("", {
      nonNullable: true,
      validators: [
        Validators.required,
        Validators.pattern(/^\+[1-9]\d{7,14}$/),
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
    this.load();
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
    this.form.controls.role.enable();
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
      phone: "",
      role: "user",
      timezoneCode: "America/Mazatlan",
      password: "",
      isActive: true,
    });
    this.editorOpen.set(true);
  }

  openEdit(user: TenantUser): void {
    this.editing.set(user);
    if (user.id === this.auth.user()?.id) {
      this.form.controls.role.disable();
      this.form.controls.isActive.disable();
    } else {
      this.form.controls.role.enable();
      this.form.controls.isActive.enable();
    }
    this.form.controls.password.clearValidators();
    this.form.controls.password.updateValueAndValidity();
    this.form.reset({
      fullName: user.fullName,
      username: user.username,
      email: user.email ?? "",
      phone: user.phone ?? "",
      role: user.role,
      timezoneCode: user.timezoneCode,
      password: "",
      isActive: user.isActive,
    });
    this.editorOpen.set(true);
  }

  closeEditor(): void {
    if (!this.saving()) this.editorOpen.set(false);
  }

  save(): void {
    if (this.form.invalid || this.saving()) {
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
          phone: raw.phone.trim(),
          role: raw.role,
          timezoneCode: raw.timezoneCode,
          isActive: raw.isActive,
        } satisfies UpdateUserInput)
      : this.users.create({
          fullName: raw.fullName.trim(),
          username: raw.username.trim().toLowerCase(),
          email: raw.email.trim().toLowerCase() || null,
          phone: raw.phone.trim(),
          role: raw.role,
          timezoneCode: raw.timezoneCode,
          password: raw.password,
        } satisfies CreateUserInput);
    request
      .pipe(
        finalize(() => this.saving.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: () => {
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
    return role === "company_admin" ? "Administrador" : "Usuario";
  }

  companyLoginSuffix(): string {
    const loginName = this.auth.user()?.loginName ?? "";
    const separator = loginName.lastIndexOf("@");
    return separator >= 0 ? loginName.slice(separator) : "@compania";
  }

  private showNotice(message: string): void {
    this.notice.set(message);
    window.setTimeout(() => this.notice.set(""), 3500);
  }
}
