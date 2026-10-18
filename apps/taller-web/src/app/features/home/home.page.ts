import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
} from "@angular/core";
import { RouterLink } from "@angular/router";
import { AuthService } from "../../core/auth/auth.service";
import { TenantNavigationService } from "../../core/navigation/tenant-navigation.service";
import { NavigationIconComponent } from "../../shared/navigation-icon/navigation-icon.component";

@Component({
  selector: "app-home-page",
  imports: [RouterLink, NavigationIconComponent],
  templateUrl: "./home.page.html",
  styleUrl: "./home.page.css",
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HomePage {
  readonly auth = inject(AuthService);
  private readonly navigation = inject(TenantNavigationService);

  readonly actions = this.navigation.homeActions;
  readonly mainModules = computed(() =>
    this.navigation.items().filter(({ homeGroup }) => homeGroup === "main"),
  );
  readonly managementModules = computed(() =>
    this.navigation
      .items()
      .filter(({ homeGroup }) => homeGroup === "management"),
  );
}
