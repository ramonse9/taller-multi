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
  ReactiveFormsModule,
} from "@angular/forms";
import { ActivatedRoute, RouterLink } from "@angular/router";
import { debounceTime, distinctUntilChanged, finalize } from "rxjs";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { Client, PaginatedClients } from "./client.models";
import { ClientsService } from "./clients.service";
import { ThemeService } from "../../core/theme/theme.service";
import { formatShortDate } from "../../core/dates/date-format";
import { AuthService } from "../../core/auth/auth.service";
import { ClientEditorComponent } from "./client-editor.component";

@Component({
  selector: "app-clients-page",
  imports: [ReactiveFormsModule, RouterLink, ClientEditorComponent],
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
    this.editorOpen.set(true);
  }

  openEdit(client: Client): void {
    this.editing.set(client);
    this.editorOpen.set(true);
  }

  closeEditor(): void {
    this.editorOpen.set(false);
  }

  clientSaved(): void {
    const wasEditing = this.editing() !== null;
    this.editorOpen.set(false);
    this.notice.set(wasEditing ? "Cliente actualizado." : "Cliente creado.");
    this.load(wasEditing ? this.data().page : 1);
    window.setTimeout(() => this.notice.set(""), 3000);
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

}
