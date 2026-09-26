import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, EventEmitter, input, OnInit, Output, SimpleChanges } from '@angular/core';
import { FormArray, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { NgIcon } from '@ng-icons/core';
import { BadgeMessageComponent } from '@shared/components/badges/badge-message/badge-message.component';

@Component({
  selector: 'app-conceptos-table',
  imports: [CommonModule, ReactiveFormsModule, BadgeMessageComponent, NgIcon],
  templateUrl: './conceptos-table.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ConceptosTableComponent implements OnInit {

  conceptos = input.required<FormArray>();

  @Output() removeConcepto = new EventEmitter<number>();

  parentFormGroup: FormGroup

  constructor(){
    this.parentFormGroup = new FormGroup({
      conceptos: new FormArray([])
    })
  }

  ngOnInit(){
    if( this.conceptos() ){
      this.parentFormGroup.setControl('conceptos', this.conceptos())
    }
  }

  ngOnChanges( changes: SimpleChanges) {
    // Si el FormArray se reemplaza por completo (menos común pero posible)
    // necesitamos actualizar la referencia en el FormGroup ficticio.
    if( changes['conceptos'] && this.conceptos()){
      this.parentFormGroup.setControl('conceptos', this.conceptos());
    }
  }

  onRemoveItem(index: number) {
    this.removeConcepto.emit(index);
  }

  calcularTotal(): number {
    return this.conceptos().controls.reduce((acc, control) => {
      const importe = control.get('importe')?.value || 0;
      return acc + importe;
    }, 0);
  }

}
