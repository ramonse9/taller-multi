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
import { Router, RouterLink } from "@angular/router";
import { finalize } from "rxjs";
import { AuthService } from "../../core/auth/auth.service";
import { ThemeService } from "../../core/theme/theme.service";

@Component({
  selector: "app-login-page",
  imports: [ReactiveFormsModule, RouterLink],
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
    if (this.form.invalid || this.submitting()) {
      this.form.markAllAsTouched();
      return;
    }
    this.submitting.set(true);
    this.error.set("");
    const { identifier, password } = this.form.getRawValue();
    this.auth
      .login(identifier, password)
      .pipe(finalize(() => this.submitting.set(false)))
      .subscribe({
        next: ({ user }) =>
          void this.router.navigateByUrl(this.auth.homeUrl(user)),
        error: () =>
          this.error.set("No pudimos iniciar sesión. Revisa tus credenciales."),
      });
  }
}
