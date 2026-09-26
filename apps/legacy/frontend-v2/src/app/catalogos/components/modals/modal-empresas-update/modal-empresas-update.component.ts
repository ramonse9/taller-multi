import { ChangeDetectionStrategy, Component, ElementRef, inject, input, signal, ViewChild, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { firstValueFrom } from 'rxjs';
import { ToastService } from '@shared/services/toast.service';
import { EnumEstatusToast } from '@shared/enums/general-estatus.enum';
import { NgIcon } from '@ng-icons/core';
import { Empresa } from '@catalogos/interfaces/empresa.interface';
import { EmpresaDetailsComponent } from '@catalogos/pages/empresa-page/empresa-details/empresa-details.component';
import { EmpresasService } from '@catalogos/services/empresas.service';

@Component({
  selector: 'app-modal-empresas-update',
  imports: [CommonModule, NgIcon, ReactiveFormsModule, EmpresaDetailsComponent,],
  templateUrl: './modal-empresas-update.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ModalEmpresasUpdateComponent {

  empresa = input.required<Empresa>();

  @Output() actualizarEmpresaEmit = new EventEmitter<Empresa>();

  @ViewChild('scrollContainer') scrollContainer!: ElementRef<HTMLDivElement>
  @ViewChild(EmpresaDetailsComponent) empresaDetailsComponent!: EmpresaDetailsComponent;

  isVisible = signal(false);

  fb = inject(FormBuilder)
  toastService = inject(ToastService)
  empresasService = inject(EmpresasService)

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

    if( !this.empresaDetailsComponent.empresaForm.valid){
      this.toastService.showToast("Debes llenar el formulario para continuar", EnumEstatusToast.WARNING )
      return
    }

    const empresaLike: Partial<Empresa> = {
      ...( this.empresaDetailsComponent.empresaForm.value as any ),
    }

    try{

      const empresaActualizado = await firstValueFrom(
        this.empresasService.updateEmpresa( this.empresa().id, empresaLike )
      )

      this.toastService.showToast( "Se modificó correctamente la Empresa" );

      this.actualizarEmpresaEmit.emit( empresaActualizado );

      this.closeModal();

    }catch(error: any){

      this.toastService.showToastErrors( error )

    }

  }

}
