import { NgTemplateOutlet, NgClass } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, input, linkedSignal, output, TemplateRef } from '@angular/core';

@Component({
  selector: 'app-cards-container',
  imports: [NgTemplateOutlet, NgClass],
  templateUrl: './cards-container.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CardsContainerComponent<T extends {id: string}> {

  listado           = input.required<T[]>();

  cardTemplate      = input.required<TemplateRef<{ $implicit: T, seleccionado: boolean}>>();

  idSeleccionado    = input<string | null>(null);

  listMode        = input<boolean>(false);

  idSeleccionarEmit = output<string>()

  seleccionarEmit(id: string){
    this.idSeleccionarEmit.emit( id )
  }

 }
