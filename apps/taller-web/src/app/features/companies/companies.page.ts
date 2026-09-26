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
import { finalize, forkJoin } from "rxjs";
import {
  CatalogItem,
  TimezoneCatalogItem,
} from "../../core/catalogs/catalog.models";
import { CatalogsService } from "../../core/catalogs/catalogs.service";
import { apiErrorMessage } from "../../core/http/api-error";
import { CompaniesService } from "./companies.service";
import { CompanyResponse, CreateCompanyInput } from "./company.models";

@Component({
  selector: "app-companies-page",
  imports: [ReactiveFormsModule],
  templateUrl: "./companies.page.html",
  styleUrl: "./companies.page.css",
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CompaniesPage implements OnInit {
  private readonly companies = inject(CompaniesService);
  private readonly catalogs = inject(CatalogsService);
  private readonly destroyRef = inject(DestroyRef);

  readonly loadingCatalogs = signal(true);
  readonly saving = signal(false);
  readonly error = signal("");
  readonly catalogError = signal("");
  readonly created = signal<CompanyResponse | null>(null);
  readonly companyTypes = signal<CatalogItem[]>([]);
  readonly personTypes = signal<CatalogItem[]>([]);
  readonly timezones = signal<TimezoneCatalogItem[]>([]);

  readonly form = new FormGroup({
    name: new FormControl("", {
      nonNullable: true,
      validators: [
        Validators.required,
        Validators.minLength(2),
        Validators.maxLength(150),
      ],
    }),
    schemaName: new FormControl("", {
      nonNullable: true,
      validators: [
        Validators.required,
        Validators.minLength(3),
        Validators.maxLength(50),
        Validators.pattern(/^[a-z][a-z0-9_]+$/),
      ],
    }),
    companyTypeCode: new FormControl("", {
      nonNullable: true,
      validators: [Validators.required],
    }),
    personTypeCode: new FormControl("", {
      nonNullable: true,
      validators: [Validators.required],
    }),
    withholdsIsr: new FormControl(false, { nonNullable: true }),
    withholdsIva: new FormControl(false, { nonNullable: true }),
    admin: new FormGroup({
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
        validators: [
          Validators.required,
          Validators.email,
          Validators.maxLength(254),
        ],
      }),
      password: new FormControl("", {
        nonNullable: true,
        validators: [
          Validators.required,
          Validators.minLength(12),
          Validators.maxLength(128),
        ],
      }),
      confirmPassword: new FormControl("", {
        nonNullable: true,
        validators: [Validators.required],
      }),
      timezoneCode: new FormControl("America/Mazatlan", {
        nonNullable: true,
        validators: [Validators.required],
      }),
    }),
  });

  ngOnInit(): void {
    this.form.controls.name.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((name) => {
        if (this.form.controls.schemaName.pristine) {
          this.form.controls.schemaName.setValue(this.slug(name));
        }
      });
    this.loadCatalogs();
  }

  loadCatalogs(): void {
    this.loadingCatalogs.set(true);
    this.catalogError.set("");
    forkJoin({
      companyTypes: this.catalogs.companyTypes(),
      personTypes: this.catalogs.personTypes(),
      timezones: this.catalogs.timezones(),
    })
      .pipe(
        finalize(() => this.loadingCatalogs.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: ({ companyTypes, personTypes, timezones }) => {
          this.companyTypes.set(companyTypes);
          this.personTypes.set(personTypes);
          this.timezones.set(timezones);
          if (!this.form.controls.companyTypeCode.value && companyTypes[0]) {
            this.form.controls.companyTypeCode.setValue(companyTypes[0].code);
          }
          if (!this.form.controls.personTypeCode.value && personTypes[0]) {
            this.form.controls.personTypeCode.setValue(personTypes[0].code);
          }
        },
        error: (error: unknown) =>
          this.catalogError.set(
            apiErrorMessage(error, "No pudimos cargar los catálogos."),
          ),
      });
  }

  submit(): void {
    if (this.form.invalid || !this.passwordsMatch() || this.saving()) {
      this.form.markAllAsTouched();
      return;
    }
    this.saving.set(true);
    this.error.set("");
    this.created.set(null);
    const raw = this.form.getRawValue();
    const input: CreateCompanyInput = {
      name: raw.name.trim(),
      schemaName: raw.schemaName.trim().toLowerCase(),
      companyTypeCode: raw.companyTypeCode,
      personTypeCode: raw.personTypeCode,
      withholdsIsr: raw.withholdsIsr,
      withholdsIva: raw.withholdsIva,
      admin: {
        fullName: raw.admin.fullName.trim(),
        email: raw.admin.email.trim().toLowerCase(),
        password: raw.admin.password,
        timezoneCode: raw.admin.timezoneCode,
      },
    };
    this.companies
      .create(input)
      .pipe(
        finalize(() => this.saving.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: (company) => {
          this.created.set(company);
          this.resetForm();
        },
        error: (error: unknown) =>
          this.error.set(
            apiErrorMessage(error, "No pudimos registrar la compañía."),
          ),
      });
  }

  passwordsMatch(): boolean {
    const admin = this.form.controls.admin.controls;
    return admin.password.value === admin.confirmPassword.value;
  }

  dismissSuccess(): void {
    this.created.set(null);
  }

  private resetForm(): void {
    this.form.reset({
      name: "",
      schemaName: "",
      companyTypeCode: this.companyTypes()[0]?.code ?? "",
      personTypeCode: this.personTypes()[0]?.code ?? "",
      withholdsIsr: false,
      withholdsIva: false,
      admin: {
        fullName: "",
        email: "",
        password: "",
        confirmPassword: "",
        timezoneCode: "America/Mazatlan",
      },
    });
    this.form.controls.schemaName.markAsPristine();
  }

  private slug(value: string): string {
    return value
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "_")
      .replace(/^_+|_+$/g, "")
      .slice(0, 50);
  }
}
