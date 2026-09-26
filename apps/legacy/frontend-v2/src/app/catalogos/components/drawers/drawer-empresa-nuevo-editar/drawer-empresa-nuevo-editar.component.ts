import { rxResource, toSignal } from '@angular/core/rxjs-interop';
import { ChangeDetectionStrategy, Component, effect, inject, input, output } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { firstValueFrom, of } from 'rxjs';
import { CommonModule } from '@angular/common';
import { Empresa } from '@catalogos/interfaces/empresa.interface';
import { EmpresasService } from '@catalogos/services/empresas.service';
import { ToastService } from '@shared/services/toast.service';
import { FormUtils } from '@shared/utils/form-utils';
import { FormErrorLabelComponent } from '@shared/components/forms/form-error-label/form-error-label.component';
import { PageFormControlListComponent } from "@shared/components/forms/page-form-control-list/page-form-control-list.component";
import { SatService } from '@catalogos/services/sat.service';
import { EnumBorderColor, EnumEntidadesVoice, EnumEstatusToast, EnumPaginasTitulo, EnumSatTipoPersona } from '@shared/enums/general-estatus.enum';
import { ProductosServiciosService } from '@catalogos/services/productosServicios.service';
import { VoiceDatosEmpresa } from '@shared/interfaces/voice.interface';
import { VoiceButtonComponent } from '@shared/components/voice/voice-button/voice-button.component';
import { SpinnerService } from '@shared/services/spinner.service';

@Component({
  selector: 'app-drawer-empresa-nuevo-editar',
  imports: [ReactiveFormsModule, FormErrorLabelComponent, CommonModule, PageFormControlListComponent, VoiceButtonComponent],
  templateUrl: './drawer-empresa-nuevo-editar.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DrawerEmpresaNuevoEditarComponent {

  empresa                 = input.required<Empresa | null>()
  mostrarHeader           = input<boolean>(true);
  mostrarEspacioInferior  = input<boolean>(false);

  guardadoCorrectoEmit = output<void>()

  fb = inject(FormBuilder)
  router = inject(Router)
  empresasService = inject(EmpresasService)
  productosServiciosService = inject(ProductosServiciosService)
  satService = inject(SatService)

  toastService = inject(ToastService)

  spinnerService = inject(SpinnerService);

  isLoading = this.spinnerService.isLoading$

  isFiscalOpenEmpresa = false;

  empresaForm = this.fb.group({
    nombre: [ '', [Validators.required]],
    telefono: ['', [Validators.required, Validators.pattern( FormUtils.phonePattern )]],
    email: ['', [Validators.required, Validators.pattern(FormUtils.emailPattern)]],
    rfc: [ '', []],
    razonSocial: [ '', []],
    claveSatRegimenFiscal: [ '',[]],
    claveSatUsoCFDI: ['',[]],
    codigoPostal: ['',[]],
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

  claveSatRegimenFiscalToSignal = toSignal(
    this.empresaForm.get('claveSatRegimenFiscal')!.valueChanges,
    {
      initialValue: this.empresaForm.get('claveSatRegimenFiscal')!.value
    }
  )

  constructor() {

    effect( () => {
      this.setFormValue()
    })

  }

  setFormValue(){

    const empresa = this.empresa()

    if( !empresa ){
      this.empresaForm.reset();
      return
    }

    this.empresaForm.patchValue({
      ...empresa,
      claveSatRegimenFiscal:  this.empresa()?.satRegimenFiscal?.clave ?? '',
      claveSatUsoCFDI: this.empresa()?.satUsoCFDI?.clave ?? ''
    })

  }

  onlyNumbers(event: any){

    this.empresaForm.patchValue({
      telefono: event.target.value.replace(/\D/g, '')
    })

  }


  optionSelectedRegimenFiscal(optionClave: string){

    this.empresaForm.patchValue({
      claveSatRegimenFiscal: optionClave,
      claveSatUsoCFDI: ''
    })

  }

  optionSelectedUsoCFDI(optionClave: string){

    this.empresaForm.patchValue({
      claveSatUsoCFDI: optionClave
    })

  }

  async onSubmit(){

    this.empresaForm.markAllAsTouched()

    const isValid = this.empresaForm.valid

    if( !isValid ) {
      this.toastService.showToast("Debes capturar la informacion solicitada", EnumEstatusToast.WARNING);
      return;
    }

    const formValue = this.empresaForm.value

    const empresaLike: Partial<Empresa> = {
      ...(formValue as any)
    }

    if( !this.empresa() ){

      try{

        const empresa = await firstValueFrom(
          this.empresasService.createEmpresa( empresaLike )
        )

        this.guardadoCorrectoEmit.emit()

        this.toastService.showToast("Se guardó correctamente la nueva empresa")

      }catch(error: any){
        this.toastService.showToastErrors(error)
      }

    }else{

      try{

        const empresa = await firstValueFrom(
          this.empresasService.updateEmpresa( this.empresa()!.id, empresaLike)
        )

        this.guardadoCorrectoEmit.emit()

        this.toastService.showToast("Se actualizó correctamente la empresa")

      }catch(error: any){
        this.toastService.showToastErrors(error)
      }

    }

  }

  satRegimenFiscalRxResource = rxResource({

    params: () => ({page: 1, limit: 24, filtro: ''}),
    stream: ({params}) => {

      return this.satService.getSatRegimenesFiscalesByTipoPersona({
        page: params.page,
        limit: params.limit,
        filtro: params.filtro
      },
      EnumSatTipoPersona.MORAL
      )
    }

  })

  satUsoCfdiRxResource = rxResource({

    params: () => ({page: 1, limit: 24, filtro: '', regimenFiscal: this.claveSatRegimenFiscalToSignal() }),
    stream: ({params}) => {

      //const regimenFiscal = this.empresaForm.value.claveSatRegimenFiscal ? this.empresaForm.value.claveSatRegimenFiscal : ''

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
      EnumSatTipoPersona.MORAL,
      params.regimenFiscal
      )
    }

  })

  voiceDatosEmpresa(datos: VoiceDatosEmpresa){

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

    this.empresaForm.patchValue(updates);

  }

}
