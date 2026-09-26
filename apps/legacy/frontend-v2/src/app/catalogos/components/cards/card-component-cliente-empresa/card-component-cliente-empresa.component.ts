import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Cliente } from '@catalogos/interfaces/cliente.interface';
import { CardComponentIconFondoComponent } from '../card-component-icon-fondo/card-component-icon-fondo.component';
import { Empresa } from '@catalogos/interfaces/empresa.interface';

@Component({
  selector: 'app-card-component-cliente-empresa',
  imports: [ CommonModule, CardComponentIconFondoComponent],
  templateUrl: './card-component-cliente-empresa.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CardComponentClienteEmpresaComponent {

    clienteEmpresa = input.required<Cliente | Empresa>();
    tipo = input.required<'cliente' | 'empresa'>();
    bgColor = input<string>("bg-white dark:bg-slate-900");

    get nombreCompleto(){
        return this.clienteEmpresa().nombre
    }

 }
