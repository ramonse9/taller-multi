import { HttpErrorResponse } from "@angular/common/http";
import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  EventEmitter,
  HostListener,
  Input,
  OnInit,
  Output,
  inject,
  signal,
} from "@angular/core";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import {
  AbstractControl,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  ValidationErrors,
  ValidatorFn,
  Validators,
} from "@angular/forms";
import { finalize } from "rxjs";
import { AuthService } from "../../core/auth/auth.service";
import { apiErrorMessage } from "../../core/http/api-error";
import {
  CfdiUse,
  Client,
  ClientInput,
  CustomerType,
  FiscalRegime,
} from "./client.models";
import { ClientsService } from "./clients.service";

const RFC_PATTERN =
  /^[A-ZÑ&]{3,4}\d{2}(0[1-9]|1[0-2])(0[1-9]|[12]\d|3[01])[A-Z0-9]{2}[0-9A]$/;
const PERSON_RFC_PATTERN =
  /^[A-ZÑ&]{4}\d{2}(0[1-9]|1[0-2])(0[1-9]|[12]\d|3[01])[A-Z0-9]{2}[0-9A]$/;
const COMPANY_RFC_PATTERN =
  /^[A-ZÑ&]{3}\d{2}(0[1-9]|1[0-2])(0[1-9]|[12]\d|3[01])[A-Z0-9]{2}[0-9A]$/;
const GENERIC_RFCS = new Set(["XAXX010101000", "XEXX010101000"]);

@Component({
  selector: "app-client-editor",
  imports: [ReactiveFormsModule],
  templateUrl: "./client-editor.component.html",
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ClientEditorComponent implements OnInit {
  private readonly clients = inject(ClientsService);
  private readonly destroyRef = inject(DestroyRef);
  readonly auth = inject(AuthService);

  @Input({ required: true }) client: Client | null = null;
  @Output() readonly closed = new EventEmitter<void>();
  @Output() readonly saved = new EventEmitter<Client>();

  readonly saving = signal(false);
  readonly error = signal("");
  readonly catalogNotice = signal("");
  readonly regimes = signal<FiscalRegime[]>([]);
  readonly cfdiUses = signal<CfdiUse[]>([]);
  readonly regimesLoading = signal(false);
  readonly usesLoading = signal(false);
  readonly regimesError = signal("");
  readonly usesError = signal("");

  private regimeRequestId = 0;
  private useRequestId = 0;

  readonly form = new FormGroup({
    type: new FormControl<CustomerType>("person", { nonNullable: true }),
    displayName: new FormControl("", {
      nonNullable: true,
      validators: [Validators.required, Validators.minLength(2), Validators.maxLength(180)],
    }),
    legalName: new FormControl("", {
      nonNullable: true,
      validators: [Validators.maxLength(180)],
    }),
    contactName: new FormControl("", {
      nonNullable: true,
      validators: [Validators.maxLength(180)],
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
    taxId: new FormControl("", {
      nonNullable: true,
      validators: [Validators.maxLength(13)],
    }),
    fiscalName: new FormControl("", {
      nonNullable: true,
      validators: [Validators.minLength(2), Validators.maxLength(180)],
    }),
    fiscalPostalCode: new FormControl("", {
      nonNullable: true,
      validators: [Validators.pattern(/^\d{5}$/)],
    }),
    fiscalRegimeCode: new FormControl("", { nonNullable: true }),
    preferredCfdiUseCode: new FormControl("", { nonNullable: true }),
    isActive: new FormControl(true, { nonNullable: true }),
  });

  ngOnInit(): void {
    const phone = this.splitPhone(this.client?.phone ?? null);
    this.form.reset(
      {
        type: this.client?.type ?? "person",
        displayName: this.client?.displayName ?? "",
        legalName: this.client?.legalName ?? "",
        contactName: this.client?.contactName ?? "",
        email: this.client?.email ?? "",
        phoneCountryCode: phone.countryCode,
        phone: phone.national,
        notes: this.client?.notes ?? "",
        taxId: this.client?.taxId ?? "",
        fiscalName: this.client?.fiscalName ?? "",
        fiscalPostalCode: this.client?.fiscalPostalCode ?? "",
        fiscalRegimeCode: this.client?.fiscalRegimeCode ?? "",
        preferredCfdiUseCode: this.client?.preferredCfdiUseCode ?? "",
        isActive: this.client?.isActive ?? true,
      },
      { emitEvent: false },
    );
    this.updateRfcValidator(this.form.controls.type.value);

    this.form.controls.type.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((type) => {
        this.catalogNotice.set("");
        this.updateRfcValidator(type);
        this.loadFiscalRegimes(type, true);
      });
    this.form.controls.fiscalRegimeCode.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((code) => {
        this.catalogNotice.set("");
        this.loadCfdiUses(this.form.controls.type.value, code, true);
      });

    this.loadFiscalRegimes(this.form.controls.type.value, false);
  }

  @HostListener("document:keydown.escape")
  closeFromKeyboard(): void {
    this.close();
  }

  selectType(type: CustomerType): void {
    if (this.form.controls.type.value === type) return;
    this.form.controls.type.setValue(type);
  }

  close(): void {
    if (!this.saving()) this.closed.emit();
  }

  save(): void {
    if (this.form.invalid || this.saving()) {
      this.form.markAllAsTouched();
      return;
    }
    const raw = this.form.getRawValue();
    const input: ClientInput = {
      type: raw.type,
      displayName: raw.displayName.trim(),
      legalName: raw.type === "company" ? raw.legalName.trim() || null : null,
      contactName: raw.type === "company" ? raw.contactName.trim() || null : null,
      taxId: raw.taxId.trim().toUpperCase() || null,
      fiscalName: raw.fiscalName.trim() || null,
      fiscalPostalCode: raw.fiscalPostalCode.trim() || null,
      fiscalRegimeCode: raw.fiscalRegimeCode || null,
      preferredCfdiUseCode: raw.preferredCfdiUseCode || null,
      email: raw.email.trim() || null,
      phone: this.internationalPhone(raw.phoneCountryCode, raw.phone),
      notes: raw.notes.trim() || null,
    };
    const request = this.client
      ? this.clients.update(this.client.id, {
          ...input,
          ...(this.auth.hasPermission("clients.deactivate")
            ? { isActive: raw.isActive }
            : {}),
        })
      : this.clients.create(input);

    this.saving.set(true);
    this.error.set("");
    request
      .pipe(
        finalize(() => this.saving.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: (client) => this.saved.emit(client),
        error: (error: unknown) => this.error.set(this.apiMessage(error)),
      });
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

  formatRfc(): void {
    const control = this.form.controls.taxId;
    control.setValue(control.value.trim().toUpperCase().slice(0, 13), {
      emitEvent: false,
    });
    control.updateValueAndValidity({ emitEvent: false });
  }

  formatPostalCode(): void {
    const control = this.form.controls.fiscalPostalCode;
    control.setValue(control.value.replace(/\D/g, "").slice(0, 5), {
      emitEvent: false,
    });
  }

  copyClientName(): void {
    const raw = this.form.getRawValue();
    const source =
      raw.type === "company"
        ? raw.legalName.trim() || raw.displayName.trim()
        : raw.displayName.trim();
    if (!source) {
      this.catalogNotice.set("Captura primero el nombre del cliente para poder copiarlo.");
      return;
    }
    this.form.controls.fiscalName.setValue(source);
    this.form.controls.fiscalName.markAsDirty();
    this.catalogNotice.set(
      "Nombre copiado. Confirma que coincida exactamente con la constancia fiscal.",
    );
  }

  retryFiscalRegimes(): void {
    this.loadFiscalRegimes(this.form.controls.type.value, false);
  }

  retryCfdiUses(): void {
    this.loadCfdiUses(
      this.form.controls.type.value,
      this.form.controls.fiscalRegimeCode.value,
      false,
    );
  }

  private loadFiscalRegimes(type: CustomerType, announceClear: boolean): void {
    const requestId = ++this.regimeRequestId;
    ++this.useRequestId;
    this.regimesLoading.set(true);
    this.regimesError.set("");
    this.usesError.set("");
    this.usesLoading.set(false);
    this.cfdiUses.set([]);
    this.clients
      .listFiscalRegimes(type)
      .pipe(
        finalize(() => {
          if (requestId === this.regimeRequestId) this.regimesLoading.set(false);
        }),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: (regimes) => {
          if (requestId !== this.regimeRequestId) return;
          const ordered = [...regimes].sort((left, right) => {
            if (type === "company") {
              if (left.code === "601" && right.code !== "601") return -1;
              if (right.code === "601" && left.code !== "601") return 1;
            }
            return left.code.localeCompare(right.code, "es-MX");
          });
          this.regimes.set(ordered);
          const selected = this.form.controls.fiscalRegimeCode.value;
          if (selected && !ordered.some(({ code }) => code === selected)) {
            this.form.controls.fiscalRegimeCode.setValue("", { emitEvent: false });
            this.form.controls.preferredCfdiUseCode.setValue("", { emitEvent: false });
            if (announceClear) {
              this.catalogNotice.set(
                "El régimen y el Uso de CFDI se limpiaron porque no son compatibles con el nuevo tipo de cliente.",
              );
            }
            return;
          }
          this.loadCfdiUses(type, selected, announceClear);
        },
        error: () => {
          if (requestId !== this.regimeRequestId) return;
          this.regimes.set([]);
          this.regimesError.set(
            "No pudimos cargar los regímenes fiscales. Puedes reintentar sin perder lo capturado.",
          );
        },
      });
  }

  private loadCfdiUses(
    type: CustomerType,
    regimeCode: string,
    announceClear: boolean,
  ): void {
    const requestId = ++this.useRequestId;
    this.usesError.set("");
    this.cfdiUses.set([]);
    const selectedUse = this.form.controls.preferredCfdiUseCode.value;
    if (!regimeCode) {
      this.usesLoading.set(false);
      if (selectedUse) {
        this.form.controls.preferredCfdiUseCode.setValue("", { emitEvent: false });
        if (announceClear) {
          this.catalogNotice.set(
            "El Uso de CFDI se limpió porque necesita un régimen fiscal compatible.",
          );
        }
      }
      return;
    }

    this.usesLoading.set(true);
    this.clients
      .listCfdiUses(type, regimeCode)
      .pipe(
        finalize(() => {
          if (requestId === this.useRequestId) this.usesLoading.set(false);
        }),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: (uses) => {
          if (requestId !== this.useRequestId) return;
          this.cfdiUses.set(uses);
          if (selectedUse && !uses.some(({ code }) => code === selectedUse)) {
            this.form.controls.preferredCfdiUseCode.setValue("", { emitEvent: false });
            if (announceClear) {
              this.catalogNotice.set(
                "El Uso de CFDI se limpió porque no es compatible con el régimen seleccionado.",
              );
            }
          }
        },
        error: () => {
          if (requestId !== this.useRequestId) return;
          this.cfdiUses.set([]);
          this.usesError.set(
            "No pudimos cargar los usos de CFDI compatibles. Intenta nuevamente.",
          );
        },
      });
  }

  private updateRfcValidator(type: CustomerType): void {
    this.form.controls.taxId.setValidators([
      Validators.maxLength(13),
      this.rfcValidator(type),
    ]);
    this.form.controls.taxId.updateValueAndValidity({ emitEvent: false });
  }

  private rfcValidator(type: CustomerType): ValidatorFn {
    return (control: AbstractControl<string>): ValidationErrors | null => {
      const rfc = control.value.trim().toUpperCase();
      if (!rfc) return null;
      if (!RFC_PATTERN.test(rfc)) return { rfcStructure: true };
      if (GENERIC_RFCS.has(rfc)) return null;
      if (type === "person" && COMPANY_RFC_PATTERN.test(rfc)) {
        return { companyRfcForPerson: true };
      }
      if (type === "company" && PERSON_RFC_PATTERN.test(rfc)) {
        return { personRfcForCompany: true };
      }
      return null;
    };
  }

  private internationalPhone(countryCode: string, nationalPhone: string): string | null {
    const digits = nationalPhone.replace(/\D/g, "");
    return digits ? `${countryCode.trim()}${digits}` : null;
  }

  private splitPhone(value: string | null): { countryCode: string; national: string } {
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

  private apiMessage(error: unknown): string {
    if (error instanceof HttpErrorResponse && error.status === 409) {
      return "Ya existe un cliente con ese RFC.";
    }
    return apiErrorMessage(
      error,
      "No pudimos guardar el cliente. Revisa los datos e intenta nuevamente.",
    );
  }
}
