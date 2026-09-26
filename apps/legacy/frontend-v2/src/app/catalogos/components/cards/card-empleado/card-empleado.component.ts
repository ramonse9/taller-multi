import { Component, inject, input } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { animate, state, style, transition, trigger } from '@angular/animations';
import { ToastService } from '@shared/services/toast.service';
import { CardComponentIdComponent } from "../card-component-id/card-component-id.component";
import { EnumEntidad } from '@shared/enums/general-estatus.enum';
import { Empleado } from '@pagos/interfaces/empleado.interface';
import { BadgeSiNoComponent } from "@shared/components/badges/badge-si-no/badge-si-no";

@Component({
  selector: 'app-card-empleado',
  templateUrl: './card-empleado.component.html',
  imports: [CommonModule, ReactiveFormsModule, CardComponentIdComponent, BadgeSiNoComponent],
  animations: [
    trigger('formularioAnim',[
      state('hidden', style({opacity: 0, height: '0px', overflow: 'hidden'})),
      state('visible', style({opacity: 1, height: '*'})),
      transition('hidden => visible', [
        animate('300ms ease-out')
      ]),
      transition('visible => hidden', [
        animate('200ms ease-in')
      ])
    ])
  ]
})
export class CardEmpleadoComponent {

  empleado = input.required<Empleado>();

  seleccionado = input<boolean>(false);

  toastService = inject(ToastService);

  get EnumEntidad(){
    return EnumEntidad
  }

}
