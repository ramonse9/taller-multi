import { ChangeDetectionStrategy, Component, input, linkedSignal, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { EnumCeroRegistros } from '@shared/enums/general-estatus.enum';
import { BadgeMessageComponent } from '@shared/components/badges/badge-message/badge-message.component';
import { Proveedor } from '@catalogos/interfaces/proveedor.interface';
import { NgIcon } from "@ng-icons/core";
import { BadgeSiNoComponent } from "@shared/components/badges/badge-si-no/badge-si-no";

@Component({
  selector: 'app-proveedores-table',
  imports: [CommonModule, RouterLink, BadgeMessageComponent, NgIcon, BadgeSiNoComponent],
  templateUrl: './proveedores-table.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProveedoresTableComponent {

  proveedores = input.required<Proveedor[]>();

  idSeleccionado = input<string | null>(null);

  idSeleccionarEmit = output<string>()

  proveedoresListado = linkedSignal( () => this.proveedores() )

  get EnumCeroRegistros(){
    return EnumCeroRegistros;
  }

}
