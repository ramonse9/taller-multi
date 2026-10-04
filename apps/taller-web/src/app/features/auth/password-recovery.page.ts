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
import { RouterLink } from "@angular/router";
import { finalize } from "rxjs";
import { AuthService } from "../../core/auth/auth.service";
import { ThemeService } from "../../core/theme/theme.service";

type RecoveryStep = "request" | "verify" | "password" | "done";

@Component({
  selector: "app-password-recovery-page",
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: "./password-recovery.page.html",
  styleUrl: "./password-recovery.page.css",
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PasswordRecoveryPage {
  private readonly auth = inject(AuthService);
  readonly theme = inject(ThemeService);
  readonly step = signal<RecoveryStep>("request");
  readonly submitting = signal(false);
  readonly error = signal("");
  readonly information = signal("");
  readonly developmentCode = signal("");
  private resetToken = "";

  readonly requestForm = new FormGroup({
    identifier: new FormControl("", {
      nonNullable: true,
      validators: [
        Validators.required,
        Validators.pattern(/^[a-z0-9._-]+@[a-z0-9._-]+$/i),
      ],
    }),
    channel: new FormControl<"sms" | "whatsapp">("sms", {
      nonNullable: true,
      validators: [Validators.required],
    }),
  });

  readonly verifyForm = new FormGroup({
    code: new FormControl("", {
      nonNullable: true,
      validators: [Validators.required, Validators.pattern(/^\d{6}$/)],
    }),
  });

  readonly passwordForm = new FormGroup({
    password: new FormControl("", {
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

  requestCode(): void {
    if (this.requestForm.invalid || this.submitting()) {
      this.requestForm.markAllAsTouched();
      return;
    }
    const { identifier, channel } = this.requestForm.getRawValue();
    this.startRequest();
    this.auth
      .requestPasswordRecovery(identifier, channel)
      .pipe(finalize(() => this.submitting.set(false)))
      .subscribe({
        next: (response) => {
          this.information.set(response.message);
          this.developmentCode.set(response.developmentCode ?? "");
          this.step.set("verify");
        },
        error: () =>
          this.error.set(
            "No pudimos enviar otro código todavía. Espera un momento e inténtalo de nuevo.",
          ),
      });
  }

  verifyCode(): void {
    if (this.verifyForm.invalid || this.submitting()) {
      this.verifyForm.markAllAsTouched();
      return;
    }
    this.startRequest();
    this.auth
      .verifyPasswordRecovery(
        this.requestForm.controls.identifier.value,
        this.verifyForm.controls.code.value,
      )
      .pipe(finalize(() => this.submitting.set(false)))
      .subscribe({
        next: ({ resetToken }) => {
          this.resetToken = resetToken;
          this.step.set("password");
        },
        error: () =>
          this.error.set(
            "El código es incorrecto, expiró o agotó sus intentos.",
          ),
      });
  }

  setPassword(): void {
    if (this.passwordForm.invalid || this.submitting()) {
      this.passwordForm.markAllAsTouched();
      return;
    }
    const { password, confirmation } = this.passwordForm.getRawValue();
    if (password !== confirmation) {
      this.error.set("Las contraseñas no coinciden.");
      return;
    }
    this.startRequest();
    this.auth
      .completePasswordRecovery(this.resetToken, password)
      .pipe(finalize(() => this.submitting.set(false)))
      .subscribe({
        next: () => this.step.set("done"),
        error: () =>
          this.error.set("La recuperación expiró. Solicita un código nuevo."),
      });
  }

  resend(): void {
    this.requestCode();
  }

  restart(): void {
    this.verifyForm.reset({ code: "" });
    this.passwordForm.reset({ password: "", confirmation: "" });
    this.error.set("");
    this.information.set("");
    this.developmentCode.set("");
    this.resetToken = "";
    this.step.set("request");
  }

  private startRequest(): void {
    this.submitting.set(true);
    this.error.set("");
  }
}
