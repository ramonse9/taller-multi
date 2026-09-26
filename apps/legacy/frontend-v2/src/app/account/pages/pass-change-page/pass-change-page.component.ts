import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../../auth/services/auth.service';
import { BadgeMessageComponent } from "@shared/components/badges/badge-message/badge-message.component";
import { EnumEstatusToast } from '@shared/enums/general-estatus.enum';
import { trigger, transition, style, animate } from '@angular/animations';
import { SpinnerService } from '@shared/services/spinner.service';
import { AsyncPipe } from '@angular/common';
import { ToastService } from '@shared/services/toast.service';
import { PageButtonInicioComponent } from '@shared/components/forms/page-button-inicio/page-button-inicio.component';

@Component({
  selector: 'app-pass-change-page',
  imports: [ReactiveFormsModule, BadgeMessageComponent, AsyncPipe, PageButtonInicioComponent],
  templateUrl: './pass-change-page.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  animations: [
    trigger('fadeAnimation', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateX(15px)' }),
        animate('500ms ease-out', style({ opacity: 1, transform: 'translateX(0)' }))
      ]),
      transition(':leave', [
        animate('400ms ease-in', style({ opacity: 0, transform: 'translateX(-15px)' }))
      ])
    ])
  ]
})
export class PassChangePageComponent {

  fb = inject(FormBuilder);
  hasError = signal(false);
  isPosting = signal(false);
  router = inject(Router);

  authService = inject(AuthService)
  spinnerService = inject(SpinnerService);
  toastService = inject(ToastService);

  isLoading = this.spinnerService.isLoading$

  get EnumEstatusToast(){
    return EnumEstatusToast;
  }

  /*
  loginForm = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required ]]
  })*/

  changePassForm = this.fb.group({
    currentPassword: ['', [Validators.required]],
    newPassword: ['', [Validators.required, Validators.minLength(6)]],
    confirmPassword: ['', [Validators.required]]
  }, {
    validators: [this.passwordsMatchValidator]
  });

  passwordsMatchValidator(form: any) {
    const newPassword = form.get('newPassword')?.value;
    const confirmPassword = form.get('confirmPassword')?.value;

    return newPassword === confirmPassword ? null : { passwordMismatch: true };
  }

  onSubmit() {

    if (this.changePassForm.invalid) {

      this.authService.hasErrorMessage.set("Completa correctamente el formulario");

      this.showErrorTemporarily(this.authService.hasErrorMessage());

      return;
    }

    const { currentPassword, newPassword } = this.changePassForm.value;

    this.authService.changePassword(currentPassword!, newPassword!)
      .subscribe((resp) => {

        if (resp) {
          this.toastService.showToast("Contraseña actualizada correctamente", EnumEstatusToast.SUCCESS);      
          this.changePassForm.reset();
          this.router.navigateByUrl('/')
          return;
        }

        this.showErrorTemporarily(this.authService.hasErrorMessage());

      });
  }

  private showErrorTemporarily( message: string | null) {

    this.hasError.set(true);

    setTimeout(() => {
      this.hasError.set(false);
      this.authService.hasErrorMessage.set(null);
    }, 3000);
  }

}

export default PassChangePageComponent;
