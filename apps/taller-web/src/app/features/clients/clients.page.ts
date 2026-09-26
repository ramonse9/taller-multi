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
import { DatePipe } from "@angular/common";
import { HttpErrorResponse } from "@angular/common/http";
import { debounceTime, distinctUntilChanged, finalize } from "rxjs";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { Client, ClientInput, PaginatedClients } from "./client.models";
import { ClientsService } from "./clients.service";

@Component({
  selector: "app-clients-page",
  imports: [ReactiveFormsModule, DatePipe],
  templateUrl: "./clients.page.html",
  styleUrl: "./clients.page.css",
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ClientsPage implements OnInit {
  private readonly clients = inject(ClientsService);
  private readonly destroyRef = inject(DestroyRef);

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
    fullName: new FormControl("", {
      nonNullable: true,
      validators: [
        Validators.required,
        Validators.minLength(2),
        Validators.maxLength(180),
      ],
    }),
    taxId: new FormControl("", {
      nonNullable: true,
      validators: [Validators.pattern(/^[A-ZÑ&]{3,4}\d{6}[A-Z0-9]{3}$/i)],
    }),
    email: new FormControl("", {
      nonNullable: true,
      validators: [Validators.email, Validators.maxLength(254)],
    }),
    phone: new FormControl("", {
      nonNullable: true,
      validators: [Validators.maxLength(30)],
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
      fullName: "",
      taxId: "",
      email: "",
      phone: "",
      notes: "",
      isActive: true,
    });
    this.editorOpen.set(true);
  }

  openEdit(client: Client): void {
    this.editing.set(client);
    this.form.reset({
      fullName: client.fullName,
      taxId: client.taxId ?? "",
      email: client.email ?? "",
      phone: client.phone ?? "",
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
      fullName: raw.fullName.trim(),
      taxId: raw.taxId.trim() || null,
      email: raw.email.trim() || null,
      phone: raw.phone.trim() || null,
      notes: raw.notes.trim() || null,
      isActive: raw.isActive,
    };
    const current = this.editing();
    const request = current
      ? this.clients.update(current.id, input)
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

  private apiMessage(error: unknown): string {
    if (error instanceof HttpErrorResponse && error.status === 409)
      return "Ya existe un cliente con ese RFC.";
    if (error instanceof HttpErrorResponse && error.status === 400)
      return "Revisa los datos capturados.";
    return "No pudimos guardar el cliente. Intenta nuevamente.";
  }
}
