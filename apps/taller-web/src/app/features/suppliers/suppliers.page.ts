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
import { AuthService } from "../../core/auth/auth.service";
import { PaginatedSuppliers, Supplier } from "./supplier.models";
import { SuppliersService } from "./suppliers.service";

const emptySuppliers = (): PaginatedSuppliers => ({
  page: 1,
  limit: 20,
  totalItems: 0,
  totalPages: 0,
  hasNextPage: false,
  items: [],
});

@Component({
  selector: "app-suppliers-page",
  imports: [ReactiveFormsModule],
  templateUrl: "./suppliers.page.html",
  host: { class: "block min-h-screen", "[class.dark]": "theme.isDark()" },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SuppliersPage implements OnInit {
  private readonly suppliersService = inject(SuppliersService);
  private readonly destroyRef = inject(DestroyRef);
  readonly theme = inject(ThemeService);
  readonly auth = inject(AuthService);

  readonly suppliers = signal<PaginatedSuppliers>(emptySuppliers());
  readonly active = signal(true);
  readonly loading = signal(true);
  readonly saving = signal(false);
  readonly editorOpen = signal(false);
  readonly editing = signal<Supplier | null>(null);
  readonly error = signal("");
  readonly notice = signal("");
  readonly search = new FormControl("", { nonNullable: true });
  readonly form = new FormGroup({
    commercialName: new FormControl("", {
      nonNullable: true,
      validators: [
        Validators.required,
        Validators.minLength(2),
        Validators.maxLength(180),
      ],
    }),
    legalName: new FormControl("", {
      nonNullable: true,
      validators: [Validators.maxLength(180)],
    }),
    taxId: new FormControl("", {
      nonNullable: true,
      validators: [Validators.pattern(/^$|^[A-ZÑ&]{3,4}\d{6}[A-Z0-9]{3}$/)],
    }),
    phone: new FormControl("", {
      nonNullable: true,
      validators: [Validators.maxLength(30)],
    }),
    email: new FormControl("", {
      nonNullable: true,
      validators: [Validators.email, Validators.maxLength(254)],
    }),
    notes: new FormControl("", {
      nonNullable: true,
      validators: [Validators.maxLength(2000)],
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
    this.load();
  }

  load(page = this.suppliers().page): void {
    this.loading.set(true);
    this.error.set("");
    this.suppliersService
      .list({
        page,
        limit: 20,
        search: this.search.value,
        isActive: this.active(),
      })
      .pipe(
        finalize(() => this.loading.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: (suppliers) => this.suppliers.set(suppliers),
        error: (error: unknown) =>
          this.error.set(
            apiErrorMessage(error, "No pudimos cargar los proveedores."),
          ),
      });
  }

  filter(isActive: boolean): void {
    if (this.active() === isActive) return;
    this.active.set(isActive);
    this.load(1);
  }

  openEditor(supplier: Supplier | null = null): void {
    this.editing.set(supplier);
    this.form.reset({
      commercialName: supplier?.commercialName ?? "",
      legalName: supplier?.legalName ?? "",
      taxId: supplier?.taxId ?? "",
      phone: supplier?.phone ?? "",
      email: supplier?.email ?? "",
      notes: supplier?.notes ?? "",
    });
    if (supplier?.isDefault) this.form.controls.commercialName.disable();
    else this.form.controls.commercialName.enable();
    this.editorOpen.set(true);
    this.error.set("");
  }

  closeEditor(): void {
    if (!this.saving()) this.editorOpen.set(false);
  }

  save(): void {
    if (this.form.invalid || this.saving()) {
      this.form.markAllAsTouched();
      return;
    }
    const raw = this.form.getRawValue();
    const input = {
      commercialName: raw.commercialName.trim(),
      legalName: raw.legalName.trim() || null,
      taxId: raw.taxId.trim().toUpperCase() || null,
      phone: raw.phone.trim() || null,
      email: raw.email.trim().toLowerCase() || null,
      notes: raw.notes.trim() || null,
    };
    const current = this.editing();
    this.saving.set(true);
    this.error.set("");
    const request = current
      ? this.suppliersService.update(current.id, input)
      : this.suppliersService.create(input);
    request
      .pipe(
        finalize(() => this.saving.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: () => {
          this.editorOpen.set(false);
          this.showNotice(
            current ? "Proveedor actualizado." : "Proveedor registrado.",
          );
          this.load(1);
        },
        error: (error: unknown) =>
          this.error.set(
            apiErrorMessage(error, "No pudimos guardar el proveedor."),
          ),
      });
  }

  changeStatus(supplier: Supplier): void {
    if (supplier.isDefault || this.saving()) return;
    this.saving.set(true);
    this.error.set("");
    this.suppliersService
      .update(supplier.id, { isActive: !supplier.isActive })
      .pipe(
        finalize(() => this.saving.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: () => {
          this.showNotice(
            supplier.isActive
              ? "Proveedor desactivado."
              : "Proveedor reactivado.",
          );
          this.load(1);
        },
        error: (error: unknown) =>
          this.error.set(
            apiErrorMessage(error, "No pudimos cambiar el estatus."),
          ),
      });
  }

  private showNotice(message: string): void {
    this.notice.set(message);
    window.setTimeout(() => this.notice.set(""), 3000);
  }
}
