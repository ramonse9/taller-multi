import { ChangeDetectionStrategy, Component, EventEmitter, inject, input, linkedSignal, Output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Estatus } from '@shared/interfaces/estatus.interface';
import { EstatusService } from '@shared/services/estatus.service';
import { EstatusIndicatorComponent } from '@shared/components/estatus-indicator/estatus-indicator.component';
import { EstatusBadgeComponent } from '@shared/components/estatus-badge/estatus-badge.component';
import { EnumCategoria } from '@shared/enums/general-estatus.enum';

@Component({
  selector: 'app-page-form-select-estatus',
  imports: [CommonModule, EstatusIndicatorComponent, EstatusBadgeComponent],
  templateUrl: './page-form-select-estatus.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PageFormSelectEstatusComponent {

  clave = input<string>('');
  categoria = input.required<EnumCategoria>();

  @Output() estatusSeleccionadoEmit = new EventEmitter<string>();

  claveSelected = linkedSignal( () => this.clave() )

  isDropdownVisible = signal(false)

  private estatusService = inject(EstatusService)

  get estatusList(){
    return this.estatusService.getEstatusByCategoria( this.categoria() ) || []
  }

  showHideDropdown(){
    this.isDropdownVisible.set( !this.isDropdownVisible() );
  }

  selectOption(estatus: Estatus){
    this.claveSelected.set( estatus.clave );
    this.estatusSeleccionadoEmit.emit( estatus.clave );
    this.showHideDropdown();
  }

 }
