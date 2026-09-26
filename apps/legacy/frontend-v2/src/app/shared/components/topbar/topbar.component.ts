import { ChangeDetectionStrategy, Component, inject, OnInit } from '@angular/core';
import { AuthService, EnumAuthStatus } from '../../../auth/services/auth.service';
import { ToastService } from '../../services/toast.service';
import { Router, RouterLink } from '@angular/router';
import { EnumEstatusToast } from '@shared/enums/general-estatus.enum';
import { NgIcon } from "@ng-icons/core";
import { environment } from '@env/environment';
import { UiService } from '@shared/services/ui.service';
import { PageButtonSettingsComponent } from '../forms/page-button-settings/page-button-settings.component';

@Component({
  selector: 'app-topbar',
  imports: [RouterLink, NgIcon, PageButtonSettingsComponent],
  templateUrl: './topbar.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TopbarComponent implements OnInit {

  isDarkMode = true;

  authService = inject( AuthService )
  toastService = inject( ToastService )
  router = inject(Router)
  uiService = inject(UiService);

  version = environment.version;


  ngOnInit(): void {

    const theme = localStorage.getItem('darkMode');

    if( theme ){
      this.isDarkMode = (theme === 'dark');
      this.updateTheme()
    }

  }

  toggleSidebar(){
    this.uiService.toggleSidebar();
  }

  toggleTheme(){

    this.isDarkMode = !this.isDarkMode;

    localStorage.setItem('darkMode', this.isDarkMode ? 'dark' : 'light' )

    this.updateTheme()

  }

  updateTheme(){
    if( this.isDarkMode){
      document.documentElement.classList.add('dark')
    }else{
      document.documentElement.classList.remove('dark')
    }
  }

  onLogout(){
    this.authService.logout()

    this.toastService.showToast( "La sesión se cerró correctamente.", EnumEstatusToast.SUCCESS )

    this.router.navigateByUrl('/')

  }

  get EnumAuthStatus(){
    return EnumAuthStatus
  }

}
