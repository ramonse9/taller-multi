import { ChangeDetectionStrategy, Component, effect, inject, input, OnInit, output } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { firstValueFrom, of } from 'rxjs';
import { Router } from '@angular/router';
import { FormUtils } from '@shared/utils/form-utils';
import { FormErrorLabelComponent } from '@shared/components/forms/form-error-label/form-error-label.component';
import { ToastService } from '@shared/services/toast.service';
import { SatService } from '@catalogos/services/sat.service';
import { EnumBorderColor, EnumEntidadesVoice, EnumEstatusToast, EnumPaginasTitulo, EnumSatTipoPersona } from '@shared/enums/general-estatus.enum';
import { ProductosServiciosService } from '@catalogos/services/productosServicios.service';

import { ProveedoresService } from '@catalogos/services/proveedores.service';
import { Proveedor } from '@catalogos/interfaces/proveedor.interface';
import { SpinnerService } from '@shared/services/spinner.service';

@Component({
  selector: 'app-drawer-proveedor-nuevo-editar',
  imports: [ReactiveFormsModule, FormErrorLabelComponent, CommonModule],
  templateUrl: './drawer-proveedor-nuevo-editar.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DrawerProveedorNuevoEditarComponent{

  proveedor = input.required<Proveedor | null>()
  mostrarHeader = input<boolean>(true);

  guardadoCorrectoEmit = output<void>();

  fb = inject(FormBuilder)
  router = inject(Router)
  proveedorService = inject(ProveedoresService)
  productosServiciosService = inject(ProductosServiciosService)
  satService = inject(SatService)

  toastService = inject(ToastService)

  spinnerService = inject(SpinnerService);

  isLoading = this.spinnerService.isLoading$

  isFiscalOpen = false;

  proveedorForm = this.fb.group({
    nombre: [ '', [Validators.required]],
    telefono: ['', [Validators.pattern( FormUtils.phonePattern )]],
    email: ['', [Validators.pattern(FormUtils.emailPattern)]],
    contacto: [ '', []],
    direccion: [ '', []],
    rfc: [ '', []],
    activo: [false, []]
  })

  get EnumPaginasTitulo(){
    return EnumPaginasTitulo;
  }

  get EnumBorderColor(){
    return EnumBorderColor;
  }

  get EnumEntidadesVoice(){
    return EnumEntidadesVoice;
  }

  constructor(){
    effect( () => {
      this.setFormValue();
    })
  }

  setFormValue(){

    const proveedor = this.proveedor()

    if( !proveedor ){
      this.proveedorForm.reset();
      return
    }

    this.proveedorForm.patchValue({
      ...proveedor,
      //claveSatRegimenFiscal:  this.proveedor()?.satRegimenFiscal?.clave ?? '',
      //claveSatUsoCFDI: this.proveedor()?.satUsoCFDI?.clave ?? ''
    })

  }

  onlyNumbers(event: any){

    this.proveedorForm.patchValue({
      telefono: event.target.value.replace(/\D/g, '')
    })

  }

  async onSubmit(){

    this.proveedorForm.markAllAsTouched()

    const isValid = this.proveedorForm.valid

    if( !isValid ) {
      this.toastService.showToast("Debes capturar la informacion solicitada", EnumEstatusToast.WARNING);
      return;
    }

    const formValue = this.proveedorForm.value

    const proveedorLike: Partial<Proveedor> = {
      ...(formValue as any)
    }

    if( !this.proveedor() ){

      try{

        await firstValueFrom(
          this.proveedorService.createProveedor( proveedorLike )
        )

        this.guardadoCorrectoEmit.emit()

        this.toastService.showToast("Se guardó correctamente el nuevo proveedor")

      }catch(error: any){
        this.toastService.showToastErrors(error)
      }

    }else{

      try{

        const proveedor = await firstValueFrom(
          this.proveedorService.updateProveedor( this.proveedor()!.id, proveedorLike)
        )

        this.guardadoCorrectoEmit.emit()

        this.toastService.showToast("Se actualizó correctamente el proveedor")

      }catch(error: any){
        this.toastService.showToastErrors(error)
      }

    }

  }

}
