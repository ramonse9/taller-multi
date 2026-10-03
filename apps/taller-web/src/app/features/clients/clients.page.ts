import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  OnInit,
  inject,
  signal,
} from "@angular/core";
import {
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from "@angular/forms";
import { ActivatedRoute, RouterLink } from "@angular/router";
import { HttpErrorResponse } from "@angular/common/http";
import { debounceTime, distinctUntilChanged, finalize } from "rxjs";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import {
  Client,
  ClientInput,
  CustomerType,
  PaginatedClients,
} from "./client.models";
import { ClientsService } from "./clients.service";
import { ThemeService } from "../../core/theme/theme.service";
import { apiErrorMessage } from "../../core/http/api-error";
import { formatShortDate } from "../../core/dates/date-format";
import { AuthService } from "../../core/auth/auth.service";

@Component({
  selector: "app-clients-page",
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: "./clients.page.html",
  host: {
    class: "block min-h-screen",
    "[class.dark]": "theme.isDark()",
  },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ClientsPage implements OnInit {
  private readonly clients = inject(ClientsService);
  private readonly route = inject(ActivatedRoute);
  private readonly destroyRef = inject(DestroyRef);
  readonly theme = inject(ThemeService);
  readonly auth = inject(AuthService);
  readonly formatShortDate = formatShortDate;

  readonly loading = signal(true);
  readonly saving = signal(false);
  readonly error = signal("");
  readonly notice = signal("");
  readonly data = signal<PaginatedClients>({
    page: 1,
    limit: 20,
    totalItems: 0,
    totalPages: 0,
    hasNextPage: false,
    items: [],
  });
  readonly activeFilter = signal(true);
  readonly editorOpen = signal(false);
  readonly editing = signal<Client | null>(null);
  readonly search = new FormControl("", { nonNullable: true });
  readonly form = new FormGroup({
    type: new FormControl<CustomerType>("person", { nonNullable: true }),
    displayName: new FormControl("", {
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
    contactName: new FormControl("", {
      nonNullable: true,
      validators: [Validators.maxLength(180)],
    }),
    taxId: new FormControl("", {
      nonNullable: true,
      validators: [Validators.pattern(/^[A-ZÑ&]{3,4}\d{6}[A-Z0-9]{3}$/i)],
    }),
    email: new FormControl("", {
      nonNullable: true,
      validators: [Validators.email, Validators.maxLength(254)],
    }),
    phoneCountryCode: new FormControl("+52", {
      nonNullable: true,
      validators: [Validators.required, Validators.pattern(/^\+[1-9]\d{0,2}$/)],
    }),
    phone: new FormControl("", {
      nonNullable: true,
      validators: [Validators.pattern(/^\d{3} \d{3} \d{2} \d{2}$/)],
    }),
    notes: new FormControl("", {
      nonNullable: true,
      validators: [Validators.maxLength(2000)],
    }),
    isActive: new FormControl(true, { nonNullable: true }),
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
    if (this.route.snapshot.queryParamMap.get("new") === "true") this.openCreate();
  }

  load(page = this.data().page): void {
    this.loading.set(true);
    this.error.set("");
    this.clients
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
        error: () =>
          this.error.set("No pudimos cargar los clientes. Intenta nuevamente."),
      });
  }

  filterBy(isActive: boolean): void {
    if (this.activeFilter() === isActive) return;
    this.activeFilter.set(isActive);
    this.load(1);
  }

  openCreate(): void {
    this.editing.set(null);
    this.form.reset({
      type: "person",
      displayName: "",
      legalName: "",
      contactName: "",
      taxId: "",
      email: "",
      phoneCountryCode: "+52",
      phone: "",
      notes: "",
      isActive: true,
    });
    this.editorOpen.set(true);
  }

  openEdit(client: Client): void {
    const phone = this.splitPhone(client.phone);
    this.editing.set(client);
    this.form.reset({
      type: client.type,
      displayName: client.displayName,
      legalName: client.legalName ?? "",
      contactName: client.contactName ?? "",
      taxId: client.taxId ?? "",
      email: client.email ?? "",
      phoneCountryCode: phone.countryCode,
      phone: phone.national,
      notes: client.notes ?? "",
      isActive: client.isActive,
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
    const input: ClientInput = {
      type: raw.type,
      displayName: raw.displayName.trim(),
      legalName: raw.type === "company" ? raw.legalName.trim() || null : null,
      contactName:
        raw.type === "company" ? raw.contactName.trim() || null : null,
      taxId: raw.taxId.trim() || null,
      email: raw.email.trim() || null,
      phone: this.internationalPhone(raw.phoneCountryCode, raw.phone),
      notes: raw.notes.trim() || null,
    };
    const current = this.editing();
    const request = current
      ? this.clients.update(current.id, {
          ...input,
          ...(this.auth.hasPermission("clients.deactivate")
            ? { isActive: raw.isActive }
            : {}),
        })
      : this.clients.create(input);
    request
      .pipe(
        finalize(() => this.saving.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: () => {
          this.editorOpen.set(false);
          this.notice.set(current ? "Cliente actualizado." : "Cliente creado.");
          this.load(current ? this.data().page : 1);
          window.setTimeout(() => this.notice.set(""), 3000);
        },
        error: (error: unknown) => this.error.set(this.apiMessage(error)),
      });
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

  private internationalPhone(
    countryCode: string,
    nationalPhone: string,
  ): string | null {
    const digits = nationalPhone.replace(/\D/g, "");
    return digits ? `${countryCode.trim()}${digits}` : null;
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
      ? allDigits.slice(
          0,
          Math.max(0, allDigits.length - nationalDigits.length),
        )
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

  private apiMessage(error: unknown): string {
    if (error instanceof HttpErrorResponse && error.status === 409)
      return "Ya existe un cliente con ese RFC.";
    return apiErrorMessage(
      error,
      "No pudimos guardar el cliente. Intenta nuevamente.",
    );
  }
}
