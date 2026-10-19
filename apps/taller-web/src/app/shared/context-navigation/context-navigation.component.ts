import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
} from "@angular/core";
import { toSignal } from "@angular/core/rxjs-interop";
import { NavigationEnd, Router, RouterLink } from "@angular/router";
import { filter, map, startWith } from "rxjs";
import { AuthService } from "../../core/auth/auth.service";
import { tenantSectionForUrl } from "../../core/navigation/tenant-navigation.config";
import { TenantNavigationService } from "../../core/navigation/tenant-navigation.service";
import { NavigationIconComponent } from "../navigation-icon/navigation-icon.component";

@Component({
  selector: "app-context-navigation",
  imports: [RouterLink, NavigationIconComponent],
  templateUrl: "./context-navigation.component.html",
  styleUrl: "./context-navigation.component.css",
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ContextNavigationComponent {
  private readonly router = inject(Router);
  private readonly auth = inject(AuthService);
  private readonly navigation = inject(TenantNavigationService);
  private readonly currentUrl = toSignal(
    this.router.events.pipe(
      filter((event): event is NavigationEnd => event instanceof NavigationEnd),
      map((event) => event.urlAfterRedirects),
      startWith(this.router.url),
    ),
    { initialValue: this.router.url },
  );

  readonly section = computed(() => {
    const user = this.auth.user();
    if (!user || user.role === "platform_admin") return null;
    return tenantSectionForUrl(this.currentUrl(), this.navigation.items());
  });
}
