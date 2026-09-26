import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { SideMenuComponent } from "../../shared/components/side-menu/side-menu.component";
import { TopbarComponent } from "../../shared/components/topbar/topbar.component";

@Component({
  selector: 'app-main-layout',
  imports: [RouterOutlet, SideMenuComponent, TopbarComponent],
  templateUrl: './main-layout.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MainLayoutComponent { }
