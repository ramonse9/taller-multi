import {
  ChangeDetectionStrategy,
  Component,
  inject,
  signal,
} from "@angular/core";
import {
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from "@angular/forms";
import { Router } from "@angular/router";
import { AuthService } from "../../core/auth/auth.service";
import { SessionUser } from "../../core/auth/auth.models";
import { ThemeService } from "../../core/theme/theme.service";

@Component({
  selector: "app-login-page",
  imports: [ReactiveFormsModule],
  templateUrl: "./login.page.html",
  styleUrl: "./login.page.css",
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LoginPage {
  private readonly auth = inject(AuthService);
  readonly theme = inject(ThemeService);
  private readonly router = inject(Router);
  readonly submitting = signal(false);
  readonly error = signal("");
  readonly navigationFailed = signal(false);
  readonly form = new FormGroup({
    identifier: new FormControl("", {
      nonNullable: true,
      validators: [
        Validators.required,
        Validators.pattern(/^[a-z0-9._-]+@[a-z0-9._-]+$/i),
      ],
    }),
    password: new FormControl("", {
      nonNullable: true,
      validators: [Validators.required, Validators.minLength(6)],
    }),
  });

  submit(): void {
    if (this.navigationFailed() && this.auth.user()) {
      void this.continueSession();
      return;
    }
    if (this.form.invalid || this.submitting()) {
      this.form.markAllAsTouched();
      return;
    }
    this.submitting.set(true);
    this.error.set("");
    this.navigationFailed.set(false);
    const { identifier, password } = this.form.getRawValue();
    this.auth.login(identifier, password).subscribe({
      next: ({ user }) => void this.navigateAfterLogin(user),
      error: () => {
        this.submitting.set(false);
        this.error.set("No pudimos iniciar sesión. Revisa tus credenciales.");
      },
    });
  }

  async continueSession(): Promise<void> {
    const user = this.auth.user();
    if (!user || this.submitting()) return;
    this.submitting.set(true);
    this.error.set("");
    await this.navigateAfterLogin(user);
  }

  private async navigateAfterLogin(user: SessionUser): Promise<void> {
    try {
      const navigated = await this.router.navigateByUrl(
        this.auth.homeUrl(user),
      );
      if (!navigated) {
        this.showNavigationError();
      }
    } catch (error: unknown) {
      console.error(
        "No se pudo completar la navegación después del login.",
        error,
      );
      this.showNavigationError();
    } finally {
      this.submitting.set(false);
    }
  }

  private showNavigationError(): void {
    this.navigationFailed.set(true);
    this.error.set(
      "Tu sesión inició correctamente, pero no pudimos abrir el sistema. Intenta continuar.",
    );
  }
}
