import { ChangeDetectionStrategy, Component, inject, input, output } from '@angular/core';
import { Empresa } from '../../../interfaces/empresa.interface';
import { CommonModule } from '@angular/common';
import { EnumCeroRegistros } from '@shared/enums/general-estatus.enum';
import { BadgeMessageComponent } from '@shared/components/badges/badge-message/badge-message.component';

@Component({
  selector: 'app-empresas-table',
  imports: [CommonModule, BadgeMessageComponent],
  templateUrl: './empresas-table.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EmpresasTableComponent {

  empresas = input.required<Empresa[]>()

  idSeleccionado = input<string | null>(null);

  idSeleccionarEmit = output<string>()

  get EnumCeroRegistros(){
    return EnumCeroRegistros;
  }

  seleccionarEmit(id: string){
    this.idSeleccionarEmit.emit( id )
  }

  getRegimenFiscalLabel(empresa: Empresa): string {

    return !empresa.satRegimenFiscal ? '' : `${empresa.satRegimenFiscal?.clave} - ${empresa.satRegimenFiscal?.descripcion.toUpperCase()}`;

  }

  getUsoCFDILabel(empresa: Empresa): string {

    return !empresa.satUsoCFDI ? '' : `${empresa.satUsoCFDI?.clave} - ${empresa.satUsoCFDI?.descripcion.toUpperCase()}`;

  }


}
