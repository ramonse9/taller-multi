import { ChangeDetectionStrategy, Component, EventEmitter, inject, input, linkedSignal, OnInit, Output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { firstValueFrom } from 'rxjs';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { EstatusBadgeComponent } from '@shared/components/estatus-badge/estatus-badge.component';
import { PageFormSelectEstatusComponent } from '@shared/components/forms/page-form-select-estatus/page-form-select-estatus.component';
import { Orden } from '@operaciones/interfaces/orden.interface';
import { ToastService } from '@shared/services/toast.service';
import { OrdenesService } from '@operaciones/services/ordenes.service';
import { EnumCategoria, EnumEstatusToast } from '@shared/enums/general-estatus.enum';
import { UpdateOrdenPagoDto } from '../../../interfaces/update-orden-pago.dto';

@Component({
  selector: 'app-modal-ordenes-pago-update',
  imports: [CommonModule, EstatusBadgeComponent, PageFormSelectEstatusComponent, ReactiveFormsModule],
  templateUrl: './modal-ordenes-pago-update.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ModalOrdenesPagoUpdateComponent implements OnInit {

  orden = input.required<Orden>();

  //@Output() ordenEstatusActualizadaEmit = new EventEmitter<Partial<Orden>>()
  @Output() ordenPagoActualizadaEmit = new EventEmitter<Partial<Orden>>()

  //estatus = linkedSignal( () => this.orden().estatus )

  isVisible = signal(false)

  fb = inject(FormBuilder)
  toastService = inject(ToastService)
  ordenesService = inject(OrdenesService);

  pagoForm = this.fb.group({
    pagada: [false, [Validators.required]],
    fechaPago: ['', []],
  })

  ngOnInit(): void {
    this.setFormValue( this.orden() )
  }

  setFormValue( orden: Orden  ){

    this.pagoForm.patchValue({
      pagada: orden.pagada
    })

  }

  get EnumCategoria(){
    return EnumCategoria;
  }

  showModal(){
    this.isVisible.set(true)
  }

  closeModal() {

    this.toastService.showToast( "No se hicieron cambios al estatus.", EnumEstatusToast.WARNING )

    this.isVisible.set(false)
  }

  async onSubmit(){

    const updateOrdenPagoDto: UpdateOrdenPagoDto = this.pagoForm.value as UpdateOrdenPagoDto

    /*
    if( updateOrdenEstatusDto.estatus === this.orden().estatus){
      this.toastService.showToast("Necesitas modificar el estatus para poder actualizarlo.", EnumEstatusToast.WARNING);
      return;
    }*/

    if( updateOrdenPagoDto.pagada === this.orden().pagada && updateOrdenPagoDto.fechaPago === this.orden().fechaPago ){
      this.toastService.showToast("Necesitas modificar el pago para poder actualizarlo.", EnumEstatusToast.WARNING);
      return;
    }

    try{

      const ordenActualizada = await firstValueFrom(
        this.ordenesService.updateOrdenPago( this.orden().id, updateOrdenPagoDto)
      )

      this.toastService.showToast( "Se actualizó correctamente el pago" )
      this.isVisible.set( false )

      //const ordenNota: OrdenNota = { ...nuevaNota, imagenes: [] }

      /*const nuevoEstatusNota: Partial<Orden> = {
        id: this.orden().id,
        estatus: updateOrdenEstatusDto.estatus,
        notas: [ ordenNota ]
      }*/

      //this.ordenEstatusActualizadaEmit.emit( nuevoEstatusNota )
      //TODO
      //this.ordenPagoActualizadaEmit.emit( nuevoEstatusNota )

    }catch(error: any){

      this.toastService.showToastErrors( error )

    }

  }

}
