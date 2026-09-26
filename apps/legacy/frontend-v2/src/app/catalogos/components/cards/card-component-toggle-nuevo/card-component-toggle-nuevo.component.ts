import { ChangeDetectionStrategy, Component, EventEmitter, input, linkedSignal, Output } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-card-component-toggle-nuevo',
  imports: [ CommonModule],
  templateUrl: './card-component-toggle-nuevo.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CardComponentToggleNuevoComponent {

  label= input.required<string>();
  nuevo = input.required<boolean>();

  nuevoLinked = linkedSignal( () => this.nuevo());

  @Output() nuevoValorEmit = new EventEmitter<boolean>();

  //entidad = input.required<string>();
  //id = input.required<string>();

  setNuevo(value: boolean){
    this.nuevoLinked.set(value);
    this.nuevoValorEmit.emit(value);
  }

}
