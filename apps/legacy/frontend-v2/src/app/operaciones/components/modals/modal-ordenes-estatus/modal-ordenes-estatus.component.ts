import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, EventEmitter, input, linkedSignal, Output, signal } from '@angular/core';
import { EstatusBadgeComponent } from '@shared/components/estatus-badge/estatus-badge.component';
import { Orden } from '@operaciones/interfaces/orden.interface';

@Component({
  selector: 'app-modal-ordenes-estatus',
  imports: [CommonModule, EstatusBadgeComponent],
  templateUrl: './modal-ordenes-estatus.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ModalOrdenesEstatusComponent {

  orden = input.required<Orden>();
  show = input<boolean>(false)
  @Output() close = new EventEmitter<void>();


  estatus = linkedSignal( () => this.orden().estatus )
  isVisible = signal(false)

  //get EnumEstatus(){
  //  return EnumEstatus;
  //}

  showModal(){
    this.isVisible.set(true)
  }

  closeModal() {
    this.close.emit();
  }

}
