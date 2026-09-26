import { CommonModule } from '@angular/common';
import { Component, EventEmitter, input, OnInit, Output } from '@angular/core';
import { FormArray, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { NgIcon } from '@ng-icons/core';
import { BadgeCodigoBarrasComponent } from "@shared/components/badges/badge-codigo-barras/badge-codigo-barras";
import { BadgePrecioVentaComponent } from "@shared/components/badges/badge-precio-venta/badge-precio-venta";
import { BadgeProductoServicioComponent } from '@shared/components/badges/badge-producto-servicio/badge-producto-servicio';
import { TextPreviewComponent } from "@shared/components/text-preview/text-preview.component";

@Component({
  selector: 'app-ordenes-productos-servicios-table',
  imports: [CommonModule, ReactiveFormsModule, NgIcon, BadgeCodigoBarrasComponent, BadgePrecioVentaComponent, TextPreviewComponent, BadgeProductoServicioComponent],
  templateUrl: './ordenes-productos-servicios-table.component.html',
  //changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OrdenesProductosServiciosTableComponent implements OnInit {
  

  detalles = input.required<FormArray<FormGroup>>();

  @Output() removeDetalle = new EventEmitter<number>();

  ngOnInit(): void {

    this.detalles().valueChanges.subscribe(() => {
      console.log('Detalles actuales:', this.detalles().value);
    });

  }

  validarCantidad( itemGroup: FormGroup){
    const control = itemGroup.get('cantidad')
    if( control && (!control.value || control.value < 1 )){
      control.setValue(1)
    }

  }

  getImporte(itemGroup: FormGroup): number{

    const cantidad = itemGroup.get('cantidad')?.value || 0;
    const precioVenta = itemGroup.get('precioVenta')?.value || 0;

    return cantidad * precioVenta;
  }

  onRemoveItem(index: number) {
    this.removeDetalle.emit(index);
  }

  tieneStockInfo(itemGroup: FormGroup): boolean {
    const stockActual = itemGroup.get('stockActual')?.value;
    return stockActual !== null && stockActual !== undefined && stockActual !== '';
  }

  obtenerClaseStock(itemGroup: FormGroup): string{
    if (!this.tieneStockInfo(itemGroup)) {
      return 'bg-slate-600';
    }
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
      const importe = control.get('cantidad')?.value || 0;
      const precioVenta = control.get('precioVenta')?.value || 0;
      return acc + ( importe * precioVenta);
    }, 0);
  }

}
