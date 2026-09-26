import { CommonModule } from '@angular/common';
import { Component, EventEmitter, input, Output } from '@angular/core';
import { FormArray, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { NgIcon } from '@ng-icons/core';
import { BadgeCodigoBarrasComponent } from "@shared/components/badges/badge-codigo-barras/badge-codigo-barras";
import { BadgePrecioVentaComponent } from "@shared/components/badges/badge-precio-venta/badge-precio-venta";
import { TextPreviewComponent } from "@shared/components/text-preview/text-preview.component";

@Component({
  selector: 'app-compras-productos-table',
  imports: [CommonModule, ReactiveFormsModule, NgIcon, BadgeCodigoBarrasComponent, BadgePrecioVentaComponent, TextPreviewComponent],
  templateUrl: './compras-productos-table.component.html',
  //changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ComprasProductosTableComponent {

  detalles = input.required<FormArray<FormGroup>>();

  @Output() removeDetalle = new EventEmitter<number>();

  onRemoveItem(index: number) {
    this.removeDetalle.emit(index);
  }

  obtenerClaseStock(itemGroup: FormGroup): string{
    const stockMinimo = Number(itemGroup.get('stockMinimo')?.value) || 0;
    const stockActual = Number(itemGroup.get('stockActual')?.value) || 0;

    if( stockActual === 0){
      return 'bg-red-600 dark:bg-red-600'
    }

    if (stockMinimo > 0 && stockActual <= stockMinimo) {
      return 'bg-yellow-600 dark:bg-yellow-600';
    }

    if ((stockMinimo === 0 && stockActual > 0) || (stockMinimo > 0 && stockActual > stockMinimo)) {
      return 'bg-green-600';
    }

    return 'bg-slate-600';

  }

  calcularTotal(): number {
    return this.detalles().controls.reduce((acc, control) => {
      const importe = control.get('importe')?.value || 0;
      return acc + importe;
    }, 0);
  }

}
