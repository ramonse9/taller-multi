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
import { AuthService } from "../../core/auth/auth.service";
import { apiErrorMessage } from "../../core/http/api-error";
import { ThemeService } from "../../core/theme/theme.service";
import { UsersService } from "../users/users.service";

@Component({
  selector: "app-account-page",
  imports: [ReactiveFormsModule],
  templateUrl: "./account.page.html",
  styleUrl: "./account.page.css",
  host: { class: "block min-h-screen", "[class.dark]": "theme.isDark()" },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AccountPage {
  readonly auth = inject(AuthService);
  readonly theme = inject(ThemeService);
  private readonly users = inject(UsersService);
  private readonly destroyRef = inject(DestroyRef);

  readonly saving = signal(false);
  readonly error = signal("");
  readonly notice = signal("");
  readonly form = new FormGroup({
    currentPassword: new FormControl("", {
      nonNullable: true,
      validators: [
        Validators.required,
        Validators.minLength(6),
        Validators.maxLength(128),
      ],
    }),
    newPassword: new FormControl("", {
      nonNullable: true,
      validators: [
        Validators.required,
        Validators.minLength(6),
        Validators.maxLength(10),
        Validators.pattern(/^(?=.*[A-Za-z])(?=.*\d).+$/),
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
          this.form.reset({
            currentPassword: "",
            newPassword: "",
            confirmation: "",
          });
          this.auth.finishPasswordChange();
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
