import { CommonModule } from '@angular/common';
import { Component, computed, inject, OnInit } from '@angular/core';
import { ActivatedRoute, NavigationEnd, Router, RouterLink, RouterLinkActive } from '@angular/router';
import { filter } from 'rxjs';
import { NgIcon } from '@ng-icons/core';
import { animate, state, style, transition, trigger } from '@angular/animations';
import { AuthService, CompaniaModulos } from '@auth/services/auth.service';
import { EnumMenuOption, EnumRole } from '@shared/enums/general-estatus.enum';
import { hasRoleOrHigher } from '@shared/helpers/has-role-or-higher.helper';
import { MenuItem } from '@shared/interfaces/menu-item.interface';
import { UiService } from '@shared/services/ui.service';
import { menuLateral } from '../../constants/menu-lateral';

@Component({
  selector: 'app-side-menu',
  imports: [RouterLink, RouterLinkActive, CommonModule, NgIcon],
  templateUrl: './side-menu.component.html',
  animations: [

    trigger('expandCollapse', [
      state(
        'collapsed',
        style({ height: '0px', opacity: 0, overflow: 'hidden' })
      ),
      state(
        'expanded',
        style({ height: '*', opacity: 1, overflow: 'hidden' })
      ),
      transition('collapsed <=> expanded', [
        animate('600ms ease-in-out')
      ]),
    ])

  ]

})
export class SideMenuComponent implements OnInit {

  uiService = inject(UiService)
  router = inject(Router);
  route = inject(ActivatedRoute)
  authService = inject(AuthService)

  get EnumMenuOption(){
    return EnumMenuOption;
  }

  menuFiltrado = computed( () => {
    return this.filtrarMenu( menuLateral, this.authService.role()!, this.authService.companiaModulos() )
  })

  public showSubMenu: Record<EnumMenuOption, boolean> = {
    [EnumMenuOption.INICIO]:              true,
    [EnumMenuOption.DASHBOARD]:           false,
    [EnumMenuOption.OPERACIONES]:         true,
    [EnumMenuOption.CATALOGOS]:           false,
    [EnumMenuOption.PAGOS]:               false,
    [EnumMenuOption.INVENTARIO]:          false,
    [EnumMenuOption.FACTURAS]:            false,
  };

  ngOnInit(): void {

    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe(() => {
      this.uiService.closeSidebar();

      Object.values(EnumMenuOption).forEach( key => this.showSubMenu[key] = false);

      let currentRoute = this.route.root;
      while( currentRoute.firstChild ){
        currentRoute = currentRoute.firstChild;
      }

      const menuKey: EnumMenuOption = currentRoute.snapshot.data['menu'];

      if(menuKey){
        this.showSubMenu[menuKey] = true;
      }

    });

  }

  toggleSubMenu(key: EnumMenuOption){
    this.showSubMenu[key] = !this.showSubMenu[key]
  }

  filtrarMenu(
    menu: MenuItem[],
    userRole: EnumRole,
    modulos: CompaniaModulos
  ): MenuItem[] {

    return menu
      .filter(item => {

        const hasRole = hasRoleOrHigher(userRole, item.minRole)

        if(!hasRole) return false

        if( item.moduleKey ){

          const key = item.moduleKey as keyof CompaniaModulos

          if( modulos && modulos[key] === false){
            return false
          }

        }

        return true;
      })
      .map(item => {

        const children = item.children
          ? this.filtrarMenu(item.children, userRole, modulos)
          : [];

        return {
          ...item,
          children
        };
      })
      .filter(item => {
        // 👇 evitar padres vacíos
        if (item.children && item.children.length === 0 && !item.path) {
          return false;
        }
        return true;
      });
  }

 }
