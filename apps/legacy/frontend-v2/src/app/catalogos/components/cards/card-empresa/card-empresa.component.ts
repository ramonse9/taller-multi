import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Empresa } from '@catalogos/interfaces/empresa.interface';
import { EnumEntidad, EnumLinks } from '@shared/enums/general-estatus.enum';
import { NgIcon } from '@ng-icons/core';
import { CardComponentIdComponent } from '../../../../catalogos/components/cards/card-component-id/card-component-id.component';

@Component({
  selector: 'app-card-empresa',
  imports: [CommonModule, NgIcon, CardComponentIdComponent ],
  templateUrl: './card-empresa.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CardEmpresaComponent {

  empresa = input.required<Empresa>()

  seleccionado = input<boolean>(false);

  get EnumLinks(){
    return EnumLinks;
  }

  get EnumEntidad(){
    return EnumEntidad;
  }

  get tieneDatosFiscales(){
    return this.empresa().razonSocial || this.empresa().rfc || this.empresa().codigoPostal || this.empresa().satRegimenFiscal
  }

  getRegimenFiscalLabel(empresa: Empresa): string {

    return !empresa.satRegimenFiscal ? '' : `${empresa.satRegimenFiscal?.clave} - ${empresa.satRegimenFiscal?.descripcion.toUpperCase()}`;

  }

  getUsoCFDILabel(empresa: Empresa): string {

    return !empresa.satUsoCFDI ? '' : `${empresa.satUsoCFDI?.clave} - ${empresa.satUsoCFDI?.descripcion.toUpperCase()}`;

  }

}
