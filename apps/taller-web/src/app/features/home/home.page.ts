import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
} from "@angular/core";
import { RouterLink } from "@angular/router";
import { AuthService } from "../../core/auth/auth.service";
import { TenantNavigationService } from "../../core/navigation/tenant-navigation.service";

@Component({
  selector: "app-home-page",
  imports: [RouterLink],
  templateUrl: "./home.page.html",
  styleUrl: "./home.page.css",
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HomePage {
  readonly auth = inject(AuthService);
  private readonly navigation = inject(TenantNavigationService);

  readonly modules = computed(() =>
    this.navigation.items().filter(({ link }) => link !== "/home"),
  );
}
