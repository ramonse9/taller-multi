import { ChangeDetectionStrategy, Component, effect, inject, input, OnInit } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { firstValueFrom, of } from 'rxjs';
import { Router } from '@angular/router';
import { FormUtils } from '@shared/utils/form-utils';
import { PageFormHeaderComponent } from '@shared/components/forms/page-form-header/page-form-header.component';
import { PageFormBodyComponent } from '@shared/components/forms/page-form-body/page-form-body.component';
import { FormErrorLabelComponent } from '@shared/components/forms/form-error-label/form-error-label.component';
import { ToastService } from '@shared/services/toast.service';
import { SatService } from '@catalogos/services/sat.service';
import { EnumBorderColor, EnumEntidadesVoice, EnumEstatusToast, EnumPaginasTitulo, EnumSatTipoPersona } from '@shared/enums/general-estatus.enum';
import { ProductosServiciosService } from '@catalogos/services/productosServicios.service';
import { ProveedoresService } from '@catalogos/services/proveedores.service';
import { Proveedor } from '@catalogos/interfaces/proveedor.interface';

@Component({
  selector: 'app-proveedor-details',
  imports: [ReactiveFormsModule, PageFormHeaderComponent, PageFormBodyComponent, FormErrorLabelComponent, CommonModule ],
  templateUrl: './proveedor-details.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProveedorDetailsComponent{

  proveedor = input.required<Proveedor | null>()
  mostrarHeader = input<boolean>(true);
  mostrarEspacioInferior = input<boolean>(false);

  fb = inject(FormBuilder)
  router = inject(Router)
  proveedorService = inject(ProveedoresService)
  productosServiciosService = inject(ProductosServiciosService)
  satService = inject(SatService)

  toastService = inject(ToastService)

  isFiscalOpen = false;

  proveedorForm = this.fb.group({
    nombre: [ '', [Validators.required]],
    telefono: ['', [Validators.required, Validators.pattern( FormUtils.phonePattern )]],
    email: ['', [Validators.pattern(FormUtils.emailPattern)]],
    contacto: [ '', []],
    direccion: [ '', []],
    rfc: [ '', []],
    //razonSocial: [ '', []],
    //claveSatRegimenFiscal: [ '', []],
    //claveSatUsoCFDI: ['',[]],
    //codigoPostal: ['', [
    //  Validators.pattern(/^\d{5}$/)
    //]],
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

  /*
  claveSatRegimenFiscalToSignal = toSignal(
    this.proveedorForm.get('claveSatRegimenFiscal')!.valueChanges,
    {
      initialValue: this.proveedorForm.get('claveSatRegimenFiscal')!.value
    }
  )*/

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

  /*
  optionSelectedRegimenFiscal(optionClave: string){

    this.proveedorForm.patchValue({
      claveSatRegimenFiscal: optionClave,
      claveSatUsoCFDI: ''
    })

  }*/

  /*
  optionSelectedUsoCFDI(optionClave: string){
    this.proveedorForm.patchValue({
      claveSatUsoCFDI: optionClave
    })

  }*/

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

        this.router.navigate(['/catalogos/proveedores'])

        this.toastService.showToast("Se guardó correctamente el nuevo proveedor")

      }catch(error: any){
        this.toastService.showToastErrors(error)
      }

    }else{

      try{

        const proveedor = await firstValueFrom(
          this.proveedorService.updateProveedor( this.proveedor()!.id, proveedorLike)
        )

        this.toastService.showToast("Se actualizó correctamente el proveedor")

      }catch(error: any){
        this.toastService.showToastErrors(error)
      }

    }

  }

  /*
  satRegimenFiscalRxResource = rxResource({

    params: () => ({page: 1, limit: 24, filtro: ''}),
    stream: ({params}) => {

      return this.satService.getSatRegimenesFiscalesByTipoPersona({
        page: params.page,
        limit: params.limit,
        filtro: params.filtro
      },
      EnumSatTipoPersona.FISICA
      )
    }

  })*/

  /*satUsoCfdiRxResource = rxResource({

    params: () => ({page: 1, limit: 24, filtro: '', regimenFiscal: this.claveSatRegimenFiscalToSignal() }),
    stream: ({params}) => {

      if(!params.regimenFiscal){
        return of({
          page: 1,
          limit: params.limit,
          totalItems: 0,
          totalPages: 0,
          hasNextPage: false,
          satUsosCFDIs: []
        })
      }

      return this.satService.getSatUsoCFDIByTipoPersonaRegimenFiscal({
        page: params.page,
        limit: params.limit,
        filtro: params.filtro
      },
      EnumSatTipoPersona.FISICA,
      params.regimenFiscal
      )
    }

  })*/

  /*voiceDatosProveedor(datos: VoiceDatosProveedor){

    const mapping: Record<string, string> = {
      "nombre": "nombre",
      "telefono": "telefono",
      "email": "email"
    };

    const updates: any = {};

    Object.keys(mapping).forEach(key => {
      const valorVoz = (datos as any)[key];

      if (valorVoz !== undefined && valorVoz !== null && valorVoz !== '') {
        updates[mapping[key]] = valorVoz;
      }
    });

    this.proveedorForm.patchValue(updates);

  }*/

}
