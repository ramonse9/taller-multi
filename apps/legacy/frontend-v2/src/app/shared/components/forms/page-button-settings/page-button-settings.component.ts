import { Component, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '@auth/services/auth.service';
import { NgIcon } from "@ng-icons/core";
import { EnumEstatusToast } from '@shared/enums/general-estatus.enum';
import { ToastService } from '@shared/services/toast.service';

@Component({
  selector: 'app-page-button-settings',
  imports: [NgIcon],
  templateUrl: './page-button-settings.component.html'
})
export class PageButtonSettingsComponent {

  isDropdownVisible = signal(false)
  authService = inject(AuthService)
  toastService = inject(ToastService)
  router = inject(Router)

  showDropdown(){

    this.isDropdownVisible.set( true )

  }

  hideDropDown(){
    setTimeout( () => {
      this.isDropdownVisible.set( false )
    }, 100)
  }

  onLogout(){
    this.authService.logout()

    this.toastService.showToast( "La sesión se cerró correctamente.", EnumEstatusToast.SUCCESS )

    this.router.navigateByUrl('/')

  }

  cambiarPassword(){
    this.router.navigateByUrl('/account/change-password')
    this.hideDropDown()
  }


}
