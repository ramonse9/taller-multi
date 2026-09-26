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
import { OrdenNota } from '@operaciones/interfaces/orden-nota.interface';
import { UpdateOrdenEstatusDto } from '@operaciones/interfaces/update-orden-estatus.dto';

@Component({
  selector: 'app-modal-ordenes-estatus-update',
  imports: [CommonModule, EstatusBadgeComponent, PageFormSelectEstatusComponent, ReactiveFormsModule],
  templateUrl: './modal-ordenes-estatus-update.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ModalOrdenesEstatusUpdateComponent implements OnInit {

  orden = input.required<Orden>();

  @Output() ordenEstatusActualizadaEmit = new EventEmitter<Partial<Orden>>()

  estatus = linkedSignal( () => this.orden().estatus )
  isVisible = signal(false)

  fb = inject(FormBuilder)
  toastService = inject(ToastService)
  ordenesService = inject(OrdenesService);

  estatusForm = this.fb.group({
    estatus: ['', [Validators.required]]
  })

  ngOnInit(): void {
    this.setFormValueEstatus( this.orden().estatus )
  }

  setFormValueEstatus( clave: string  ){

    this.estatusForm.patchValue({
      estatus: clave
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

    const updateOrdenEstatusDto: UpdateOrdenEstatusDto = this.estatusForm.value as UpdateOrdenEstatusDto

    if( updateOrdenEstatusDto.estatus === this.orden().estatus){
      this.toastService.showToast("Necesitas modificar el estatus para poder actualizarlo.", EnumEstatusToast.WARNING);
      return;
    }

    try{

      const nuevaNota = await firstValueFrom(
        this.ordenesService.updateOrdenEstatus( this.orden().id, updateOrdenEstatusDto)
      )

      this.toastService.showToast( "Se actualizó correctamente el estatus" )
      this.isVisible.set( false )

      const ordenNota: OrdenNota = { ...nuevaNota, imagenes: [] }

      const nuevoEstatusNota: Partial<Orden> = {
        id: this.orden().id,
        estatus: updateOrdenEstatusDto.estatus,
        notas: [ ordenNota ]
      }

      this.ordenEstatusActualizadaEmit.emit( nuevoEstatusNota )

    }catch(error: any){

      this.toastService.showToastErrors( error )

    }

  }

}
