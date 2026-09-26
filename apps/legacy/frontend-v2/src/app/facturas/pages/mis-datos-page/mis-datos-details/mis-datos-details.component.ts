import { ChangeDetectionStrategy, Component, computed, EventEmitter, inject, input, OnInit, Output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FormBuilder, Validators, ReactiveFormsModule } from '@angular/forms';
import { firstValueFrom } from 'rxjs';
import { ToastService } from '@shared/services/toast.service';
import { FormErrorLabelComponent } from '@shared/components/forms/form-error-label/form-error-label.component';
import { PageFormBodyComponent } from '@shared/components/forms/page-form-body/page-form-body.component';
import { PageFormHeaderComponent } from '@shared/components/forms/page-form-header/page-form-header.component';
import { FormUtils } from '@shared/utils/form-utils';
import { Emisor } from '../../../interfaces/emisor.interface';
import { EmisoresService } from '../../../services/emisores.service';
import { BadgeMessageComponent } from "../../../../shared/components/badges/badge-message/badge-message.component";
import { EnumEstatusToast, EnumPaginasTitulo } from '@shared/enums/general-estatus.enum';

@Component({
  selector: 'app-mis-datos-details',
  imports: [PageFormHeaderComponent, PageFormBodyComponent, FormErrorLabelComponent, CommonModule, ReactiveFormsModule, BadgeMessageComponent],
  templateUrl: './mis-datos-details.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MisDatosDetailsComponent implements OnInit  {

  @Output() emisorActualizado = new EventEmitter<void>();

  emisor = input.required<Emisor>();
  emisoresService = inject(EmisoresService)
  toastService = inject(ToastService)
  router = inject(Router)

  message = signal<string>('');
  estatusMessage = signal<EnumEstatusToast>(EnumEstatusToast.WARNING);

  cerFile: File | null = null;
  keyFile: File | null = null;



  fb = inject(FormBuilder)

  formPassword = this.fb.group({
    password: ['', Validators.required ]
  })


  ngOnInit(): void {
  }

  get EnumPaginasTitulo(){
    return EnumPaginasTitulo;
  }

  get EnumEstatusToast(){
    return EnumEstatusToast;
  }

  obtenerMensaje = computed(() => {

    const emisor = this.emisor();

    if( !emisor ){
      return 'No hay un emisor registrado, favor de comunicarse con el Administrador.'
    }

    if( !this.emisor()!.validTo ){
      return `Registra tus archivos y tu password.`
    }

    if( new Date( this.emisor()!.validTo ) > new Date() ){
      return `Tus archivos se encuentran registrados correctamente desde el día ${ FormUtils.dateFormatISOToDisplay( this.emisor().updatedAt.toString() ) }, y tienen vigencia hasta el día ${ FormUtils.dateFormatISOToDisplay( this.emisor().validTo.toString() ) }`
    }

    return `Tus archivos están registrados, pero ya no tienen vigencia (${ FormUtils.dateFormatISOToDisplay( this.emisor().validTo.toString() ) }), favor de ingresarlos nuevamente.`

  })

  obtenerMensajeObjeto = computed(() => {

    const emisor = this.emisor();

    if( !emisor ){
      return {
        mensaje: 'No hay un emisor registrado, favor de comunicarse con el Administrador.',
        estatus: EnumEstatusToast.DANGER
      }
    }

    if( !this.emisor()!.validTo ){
      return {
        mensaje: `Registra tus archivos y tu password.`,
        estatus: EnumEstatusToast.WARNING
      }
    }

    if( new Date( this.emisor()!.validTo ) > new Date() ){
      return {
        mensaje: `Tus archivos se encuentran registrados correctamente desde el día ${ FormUtils.dateFormatISOToDisplay( this.emisor().updatedAt.toString() ) }, y tienen vigencia hasta el día ${ FormUtils.dateFormatISOToDisplay( this.emisor().validTo.toString() ) }`,
        estatus: EnumEstatusToast.SUCCESS
      }
    }

    return {
        mensaje: `Tus archivos están registrados, pero ya no tienen vigencia (${ FormUtils.dateFormatISOToDisplay( this.emisor().validTo.toString() ) }), favor de ingresarlos nuevamente.`,
        estatus: EnumEstatusToast.DANGER
    }

  })

  async onFileChange( event: Event, type: 'cer' | 'key' ){

    const target = event.target as HTMLInputElement;
    if( target.files && target.files?.length > 0){
      const file = target.files[0];
      if(type == 'cer') this.cerFile = file;
      if(type == 'key') this.keyFile = file;
    }
  }

  async onSubmit(){

    if(!this.emisor()){
      this.toastService.showToast('No hay un emisor registrado, favor de comunicarse con el Administrador', EnumEstatusToast.DANGER )
      return
    }

    if( !this.cerFile){
      this.toastService.showToast('Debes agregar el archivo Certificado (.cer)', EnumEstatusToast.WARNING )
      return
    }

    if( !this.keyFile){
      this.toastService.showToast('Debes agregar el archivo Clave privada (.key)', EnumEstatusToast.WARNING )
      return
    }

    if(!this.formPassword.valid ){
      this.toastService.showToast('Debes agregar la contraseña de la clave privada', EnumEstatusToast.WARNING )
      return
    }

    try{

      const formData = new FormData();
      formData.append('rfc', this.emisor().rfc)
      formData.append('contrasena', this.formPassword.value.password || '')
      formData.append('cer', this.cerFile)
      formData.append('key', this.keyFile)
      formData.append('razonSocial', this.emisor().razonSocial)

      await firstValueFrom(
        this.emisoresService.updateEmisor(formData)
      )

      this.toastService.showToast( "Se agregaron los archivos y el password correctamente" )

      this.emisorActualizado.emit();

      //this.refreshRoute()

    }catch(err){

      this.toastService.showToastErrors(err)

    }

  }

  refreshRoute(){
    const currentUrl = this.router.url;
    this.router.navigateByUrl('/', {skipLocationChange: true}).then( () => {
      this.router.navigateByUrl(currentUrl);
    })
  }

}
