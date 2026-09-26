import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  inject,
  signal,
} from "@angular/core";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import {
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from "@angular/forms";
import { finalize } from "rxjs";
import { Router } from "@angular/router";
import { AuthService } from "../../core/auth/auth.service";
import { apiErrorMessage } from "../../core/http/api-error";
import { UsersService } from "../users/users.service";

@Component({
  selector: "app-account-page",
  imports: [ReactiveFormsModule],
  templateUrl: "./account.page.html",
  styleUrl: "./account.page.css",
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AccountPage {
  readonly auth = inject(AuthService);
  private readonly users = inject(UsersService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly router = inject(Router);

  readonly saving = signal(false);
  readonly error = signal("");
  readonly notice = signal("");
  readonly form = new FormGroup({
    currentPassword: new FormControl("", {
      nonNullable: true,
      validators: [
        Validators.required,
        Validators.minLength(8),
        Validators.maxLength(128),
      ],
    }),
    newPassword: new FormControl("", {
      nonNullable: true,
      validators: [
        Validators.required,
        Validators.minLength(12),
        Validators.maxLength(128),
      ],
    }),
    confirmation: new FormControl("", {
      nonNullable: true,
      validators: [Validators.required],
    }),
  });

  submit(): void {
    if (this.form.invalid || !this.passwordsMatch() || this.saving()) {
      this.form.markAllAsTouched();
      return;
    }
    this.saving.set(true);
    this.error.set("");
    this.notice.set("");
    const raw = this.form.getRawValue();
    this.users
      .changeOwnPassword(raw.currentPassword, raw.newPassword)
      .pipe(
        finalize(() => this.saving.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: () => {
          const wasTemporary = this.auth.user()?.mustChangePassword === true;
          this.auth.completePasswordChange();
          this.form.reset({
            currentPassword: "",
            newPassword: "",
            confirmation: "",
          });
          this.notice.set(
            "Tu contraseña fue actualizada. La sesión actual permanece activa.",
          );
          if (wasTemporary) void this.router.navigateByUrl(this.auth.homeUrl());
        },
        error: (error: unknown) =>
          this.error.set(
            apiErrorMessage(error, "No pudimos cambiar tu contraseña."),
          ),
      });
  }

  passwordsMatch(): boolean {
    return (
      this.form.controls.newPassword.value ===
      this.form.controls.confirmation.value
    );
  }
}
