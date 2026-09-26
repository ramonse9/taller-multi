import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService, EnumAuthStatus } from '../../services/auth.service';
import { BadgeMessageComponent } from "@shared/components/badges/badge-message/badge-message.component";
import { EnumEstatusToast } from '@shared/enums/general-estatus.enum';
import { trigger, transition, style, animate } from '@angular/animations';
import { SpinnerService } from '@shared/services/spinner.service';
import { AsyncPipe } from '@angular/common';

@Component({
  selector: 'app-login-page',
  imports: [ReactiveFormsModule, BadgeMessageComponent, AsyncPipe],
  templateUrl: './login-page.component.html',
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
export class LoginPageComponent {

  fb = inject(FormBuilder);
  hasError = signal(false);
  isPosting = signal(false);
  router = inject(Router);

  authService = inject(AuthService)
  spinnerService = inject(SpinnerService);

  isLoading = this.spinnerService.isLoading$

  get EnumEstatusToast(){
    return EnumEstatusToast;
  }

  loginForm = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required ]]
  })

  onSubmit(){

    if( this.loginForm.invalid){

      this.authService.hasErrorMessage.set("Ingresa el correo y contraseña para hacer login");

      this.showErrorTemporarily(this.authService.hasErrorMessage())

      return
    }

    const { email = '', password = ''} = this.loginForm.value

    this.authService.login( email!, password!).subscribe( (isAuthenticated) => {

      if( isAuthenticated == EnumAuthStatus.Authenticated ){
        this.router.navigateByUrl('/inicio/accesos');
        return
      }

      this.showErrorTemporarily( this.authService.hasErrorMessage() );

    })
  }

  private showErrorTemporarily( message: string | null) {

    this.hasError.set(true);

    setTimeout(() => {
      this.hasError.set(false);
      this.authService.hasErrorMessage.set(null);
    }, 3000);
  }


  // Check authentication

  // Registro

  // Logout

}
