import { ChangeDetectionStrategy, Component, effect, inject, input, OnInit } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { firstValueFrom, of } from 'rxjs';
import { Router } from '@angular/router';
import { ClientesService } from '@catalogos/services/clientes.service';
import { Cliente } from '@catalogos/interfaces/cliente.interface';
import { FormUtils } from '@shared/utils/form-utils';
import { PageFormHeaderComponent } from '@shared/components/forms/page-form-header/page-form-header.component';
import { PageFormBodyComponent } from '@shared/components/forms/page-form-body/page-form-body.component';
import { FormErrorLabelComponent } from '@shared/components/forms/form-error-label/form-error-label.component';
import { ToastService } from '@shared/services/toast.service';
import { PageFormControlListComponent } from '@shared/components/forms/page-form-control-list/page-form-control-list.component';
import { rxResource, toSignal } from '@angular/core/rxjs-interop';
import { SatService } from '@catalogos/services/sat.service';
import { EnumBorderColor, EnumEntidadesVoice, EnumEstatusToast, EnumPaginasTitulo, EnumSatTipoPersona } from '@shared/enums/general-estatus.enum';
import { ProductosServiciosService } from '@catalogos/services/productosServicios.service';
import { VoiceDatosCliente } from '@shared/interfaces/voice.interface';
import { VoiceButtonComponent } from '@shared/components/voice/voice-button/voice-button.component';

@Component({
  selector: 'app-cliente-details',
  imports: [ReactiveFormsModule, PageFormHeaderComponent, PageFormBodyComponent, FormErrorLabelComponent, CommonModule, PageFormControlListComponent, VoiceButtonComponent],
  templateUrl: './cliente-details.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ClienteDetailsComponent{

  cliente = input.required<Cliente | null>()
  mostrarHeader = input<boolean>(true);
  mostrarEspacioInferior = input<boolean>(false);

  fb = inject(FormBuilder)
  router = inject(Router)
  clienteService = inject(ClientesService)
  productosServiciosService = inject(ProductosServiciosService)
  satService = inject(SatService)

  toastService = inject(ToastService)

  isFiscalOpen = false;

  clienteForm = this.fb.group({
    nombre: [ '', [Validators.required]],
    telefono: ['', [Validators.required, Validators.pattern( FormUtils.phonePattern )]],
    email: ['', [Validators.pattern(FormUtils.emailPattern)]],
    rfc: [ '', []],
    razonSocial: [ '', []],
    claveSatRegimenFiscal: [ '', []],
    claveSatUsoCFDI: ['',[]],
    codigoPostal: ['', [
      Validators.pattern(/^\d{5}$/)
    ]],
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
    this.clienteForm.get('claveSatRegimenFiscal')!.valueChanges,
    {
      initialValue: this.clienteForm.get('claveSatRegimenFiscal')!.value
    }
  )

  constructor(){
    effect( () => {
      this.setFormValue();
    })
  }

  setFormValue(){

    const cliente = this.cliente()

    if( !cliente ){
      this.clienteForm.reset();
      return
    }

    this.clienteForm.patchValue({
      ...cliente,
      claveSatRegimenFiscal:  this.cliente()?.satRegimenFiscal?.clave ?? '',
      claveSatUsoCFDI: this.cliente()?.satUsoCFDI?.clave ?? ''
    })

  }

  onlyNumbers(event: any){

    this.clienteForm.patchValue({
      telefono: event.target.value.replace(/\D/g, '')
    })

  }

  optionSelectedRegimenFiscal(optionClave: string){

    this.clienteForm.patchValue({
      claveSatRegimenFiscal: optionClave,
      claveSatUsoCFDI: ''
    })

  }

  optionSelectedUsoCFDI(optionClave: string){
    this.clienteForm.patchValue({
      claveSatUsoCFDI: optionClave
    })


  }

  async onSubmit(){

    this.clienteForm.markAllAsTouched()

    const isValid = this.clienteForm.valid

    if( !isValid ) {
      this.toastService.showToast("Debes capturar la informacion solicitada", EnumEstatusToast.WARNING);
      return;
    }

    const formValue = this.clienteForm.value

    const clienteLike: Partial<Cliente> = {
      ...(formValue as any)
    }

    if( !this.cliente() ){

      try{

        await firstValueFrom(
          this.clienteService.createCliente( clienteLike )
        )

        this.router.navigate(['/catalogos/clientes'])

        this.toastService.showToast("Se guardó correctamente el nuevo cliente")

      }catch(error: any){
        this.toastService.showToastErrors(error)
      }

    }else{

      try{

        const cliente = await firstValueFrom(
          this.clienteService.updateCliente( this.cliente()!.id, clienteLike)
        )

        this.toastService.showToast("Se actualizó correctamente el cliente")

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
      EnumSatTipoPersona.FISICA
      )
    }

  })

  satUsoCfdiRxResource = rxResource({

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

  })

  voiceDatosCliente(datos: VoiceDatosCliente){

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

    this.clienteForm.patchValue(updates);

  }

}
