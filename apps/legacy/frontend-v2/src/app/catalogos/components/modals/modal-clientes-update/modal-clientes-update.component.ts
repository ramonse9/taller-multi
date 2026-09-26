import { ChangeDetectionStrategy, Component, ElementRef, inject, input, signal, ViewChild, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { firstValueFrom } from 'rxjs';
import { ToastService } from '@shared/services/toast.service';
import { EnumEstatusToast } from '@shared/enums/general-estatus.enum';
import { NgIcon } from '@ng-icons/core';
import { Cliente } from '@catalogos/interfaces/cliente.interface';
import { ClienteDetailsComponent } from '@catalogos/pages/cliente-page/cliente-details/cliente-details.component';
import { ClientesService } from '@catalogos/services/clientes.service';

@Component({
  selector: 'app-modal-clientes-update',
  imports: [CommonModule, NgIcon, ReactiveFormsModule, ClienteDetailsComponent,],
  templateUrl: './modal-clientes-update.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ModalClientesUpdateComponent {

  cliente = input.required<Cliente>();

  @Output() actualizarClienteEmit = new EventEmitter<Cliente>();

  @ViewChild('scrollContainer') scrollContainer!: ElementRef<HTMLDivElement>
  @ViewChild(ClienteDetailsComponent) clienteDetailsComponent!: ClienteDetailsComponent;

  isVisible = signal(false);

  fb = inject(FormBuilder)
  toastService = inject(ToastService)
  clientesService = inject(ClientesService)

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

    if( !this.clienteDetailsComponent.clienteForm.valid){
      this.toastService.showToast("Debes llenar el formulario para continuar", EnumEstatusToast.WARNING )
      return
    }

    const clienteLike: Partial<Cliente> = {
      ...( this.clienteDetailsComponent.clienteForm.value as any ),
    }

    try{

      const clienteActualizado = await firstValueFrom(
        this.clientesService.updateCliente( this.cliente().id, clienteLike )
      )

      this.toastService.showToast( "Se modificó correctamente el Cliente" );

      this.actualizarClienteEmit.emit( clienteActualizado );

      this.closeModal();

    }catch(error: any){

      this.toastService.showToastErrors( error )

    }

  }

}
