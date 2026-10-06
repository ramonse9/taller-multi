import { ChangeDetectionStrategy, Component, inject } from "@angular/core";
import { RouterLink, RouterLinkActive, RouterOutlet } from "@angular/router";
import { AuthService } from "../auth/auth.service";
import { ThemeService } from "../theme/theme.service";

@Component({
  selector: "app-shell",
  imports: [RouterLink, RouterLinkActive, RouterOutlet],
  templateUrl: "./app-shell.component.html",
  styleUrl: "./app-shell.component.css",
  host: { "[class.dark]": "theme.isDark()" },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppShellComponent {
  readonly auth = inject(AuthService);
  readonly theme = inject(ThemeService);

  companyName(): string {
    return this.auth.user()?.companyName ?? "Taller Multi";
  }

  companyInitials(): string {
    const initials = this.companyName()
      .trim()
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 3)
      .map((part) => Array.from(part)[0]?.toLocaleUpperCase("es-MX") ?? "")
      .join("");
    return initials || "TM";
  }

  initials(name: string): string {
    return name
      .split(/\s+/)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase() ?? "")
      .join("");
  }

  roleName(): string {
    switch (this.auth.user()?.role) {
      case "platform_admin":
        return "Plataforma";
      case "company_admin":
        return "Administrador principal";
      case "admin":
        return "Administrador";
      default:
        return "Usuario";
    }
  }
}
