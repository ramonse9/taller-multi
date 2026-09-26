import { ChangeDetectionStrategy, Component, ElementRef, inject, input, signal, ViewChild, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { firstValueFrom } from 'rxjs';
import { ToastService } from '@shared/services/toast.service';
import { EnumEstatusToast } from '@shared/enums/general-estatus.enum';
import { NgIcon } from '@ng-icons/core';
import { Vehiculo } from '@catalogos/interfaces/vehiculo.interface';
import { VehiculoDetailsComponent } from '@catalogos/pages/vehiculo-page/vehiculo-details/vehiculo-details.component';
import { VehiculosService } from '@catalogos/services/vehiculos.service';

@Component({
  selector: 'app-modal-vehiculos-update',
  imports: [CommonModule, NgIcon, ReactiveFormsModule, VehiculoDetailsComponent,],
  templateUrl: './modal-vehiculos-update.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ModalVehiculosUpdateComponent {

  vehiculo = input.required<Vehiculo>();

  @Output() actualizarVehiculoEmit = new EventEmitter<Vehiculo>();

  @ViewChild('scrollContainer') scrollContainer!: ElementRef<HTMLDivElement>
  @ViewChild(VehiculoDetailsComponent) vehiculoDetailsComponent!: VehiculoDetailsComponent;

  isVisible = signal(false);

  fb = inject(FormBuilder)
  toastService = inject(ToastService)
  vehiculosService = inject(VehiculosService)

  scrollToBottom() {

    if (this.scrollContainer?.nativeElement) {
      this.scrollContainer.nativeElement.scrollTo({
        top: this.scrollContainer.nativeElement.scrollHeight,
        behavior: 'smooth'
      });
    }
  }

  showModal(){
    this.isVisible.set(true)

    setTimeout(() => {

      this.scrollToBottom()

    }, 100);

  }

  closeModal() {
    this.isVisible.set(false)
  }

  async onSubmit(){

    if( !this.vehiculoDetailsComponent.vehiculoForm.valid){
      this.toastService.showToast("Debes llenar el formulario para continuar", EnumEstatusToast.WARNING )
      return
    }

    const vehiculoLike: Partial<Vehiculo> = {
      ...( this.vehiculoDetailsComponent.vehiculoForm.value as any ),
    }

    try{

      const vehiculoActualizado = await firstValueFrom(
        this.vehiculosService.updateVehiculo( this.vehiculo().id, vehiculoLike )
      )

      this.toastService.showToast( "Se modificó correctamente el Vehiculo" );

      this.actualizarVehiculoEmit.emit( vehiculoActualizado );

      this.closeModal();

    }catch(error: any){

      this.toastService.showToastErrors( error )

    }

  }

}
