import { ChangeDetectionStrategy, Component, computed, effect, inject, input, linkedSignal, OnInit, output, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { rxResource } from '@angular/core/rxjs-interop';
import { firstValueFrom, tap } from 'rxjs';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { PageFormControlSearchListComponent } from '@shared/components/forms/page-form-control-search-list/page-form-control-search-list.component';
import { FormErrorLabelComponent } from '@shared/components/forms/form-error-label/form-error-label.component';
import { MarcasService } from '@catalogos/services/marcas.service';
import { Vehiculo } from '@catalogos/interfaces/vehiculo.interface';
import { VehiculosService } from '@catalogos/services/vehiculos.service';
import { ToastService } from '@shared/services/toast.service';
import { EnumBorderColor, EnumEntidadesVoice, EnumEstatusToast, EnumPaginasTitulo } from '@shared/enums/general-estatus.enum';
import { ModalVehiculosVinCanvaComponent } from '@catalogos/components/modals/modal-vehiculos-vin-canva/modal-vehiculos-vin-canva.component';
import { VoiceButtonComponent } from '@shared/components/voice/voice-button/voice-button.component';
import { VoiceDatosVehiculo } from '@shared/interfaces/voice.interface';
import { SpinnerService } from '@shared/services/spinner.service';

@Component({
  selector: 'app-drawer-vehiculo-nuevo-editar',
  imports: [CommonModule, ReactiveFormsModule, PageFormControlSearchListComponent, FormErrorLabelComponent, ModalVehiculosVinCanvaComponent, VoiceButtonComponent ],
  templateUrl: './drawer-vehiculo-nuevo-editar.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DrawerVehiculoNuevoEditarComponent {

  vehiculo = input.required<Vehiculo | null>()
  mostrarHeader = input<boolean>(true);
  mostrarEspacioInferior = input<boolean>(false);

  marcaSelected = linkedSignal(() => this.vehiculo()?.modelo?.marca?.id || '' )

  guardadoCorrectoEmit = output<void>()

  fb = inject(FormBuilder)
  router = inject(Router)

  marcasService = inject(MarcasService);
  vehiculosService = inject(VehiculosService);

  toastService = inject(ToastService);

  spinnerService = inject(SpinnerService);

  isLoading = this.spinnerService.isLoading$

  vehiculoForm = this.fb.group({
    id_marca: ['', [Validators.required]],
    id_modelo: ['', [Validators.required]],
    anio: ['', [Validators.required, Validators.min(1900), Validators.max( new Date().getFullYear() + 2 )]],
    color: ['', [Validators.required, Validators.maxLength(20)]],
    placa: ['', [Validators.maxLength(20)]],
    numeroSerie: ['', [
      Validators.required,
      Validators.minLength(10),
      Validators.maxLength(10),
    ]],
  })

  marcasRXResource = rxResource({
    params: () => ({}),
    stream: () => {
      return this.marcasService.getMarcasAll()
    }
  })

  modelosByMarca = computed( () => {

    return this.marcasRXResource.value()?.marcas?.find( marca => marca.id == this.marcaSelected() )?.modelos ?? []

  })

  get EnumPaginasTitulo(){
    return EnumPaginasTitulo;
  }

  get EnumEntidadesVoice(){
    return EnumEntidadesVoice;
  }

  get EnumBorderColor(){
    return EnumBorderColor;
  }

  constructor(){
    effect( () => {
      this.setFormValue()
    });
  }

  setFormValue(){

    if( !this.vehiculo() ){
      this.vehiculoForm.reset( );
      this.marcaSelected.set('');
    }else{
      this.vehiculoForm.reset( this.vehiculo() as any);
      const idMarca =   this.vehiculo()!.modelo.marca.id;
      const idModelo =  this.vehiculo()!.modelo.id;

      this.marcaSelected.set(idMarca);
      this.vehiculoForm.patchValue({
        id_marca: idMarca,
        id_modelo: idModelo
      })

      this.vehiculoForm.markAsPristine();
    }

  }

  optionSelectedMarca( optionId: string){

    this.marcaSelected.set( optionId )
    this.vehiculoForm.patchValue({
      id_marca: optionId,
      id_modelo: ''
    })

  }

  optionSelectedModelo( optionId: string){

    this.vehiculoForm.patchValue({
      id_modelo: optionId
    })

  }

  async onSubmit(){

    this.vehiculoForm.markAllAsTouched();

    const isValid = this.vehiculoForm.valid;

    if( !isValid ) {
      this.toastService.showToast("Debes capturar la informacion solicitada", EnumEstatusToast.WARNING);
      return;
    }

    const formValue = this.vehiculoForm.value;

    //const vehiculoLike: Partial<Vehiculo> = {
    //  ...( formValue as any )
    //}

    const { id_marca, ...vehiculoLike } = (formValue as any);

    if( !this.vehiculo() ){

      try{

        const vehiculo = await firstValueFrom(
          this.vehiculosService.createVehiculo( vehiculoLike )
        )

        this.guardadoCorrectoEmit.emit()

        this.toastService.showToast("Se guardó correctamente el nuevo vehiculo")

      }catch(error: any){
        this.toastService.showToastErrors(error)
      }

    }else{

      try{

        const vehiculo = await firstValueFrom(
          this.vehiculosService.updateVehiculo( this.vehiculo()!.id, vehiculoLike)
        )

        this.guardadoCorrectoEmit.emit()

        this.toastService.showToast("Se actualizó correctamente el vehiculo")

      }catch(error: any){
        this.toastService.showToastErrors(error)
      }

    }

  }

  setNumeroSerie( numeroSerie: string){

    this.vehiculoForm.patchValue({
      numeroSerie: numeroSerie
    })

  }

  voiceDatosVehiculo(datos: VoiceDatosVehiculo){

    const mapping: Record<string, string> = {
      "año": "anio",
      "color": "color",
      "placa": "placa",
      "numero_serie": "numero_serie",
      "id_marca": "id_marca",
      "id_modelo": "id_modelo"
    };

    const updates: any = {};

    Object.keys(mapping).forEach(key => {
      const valorVoz = (datos as any)[key];

      if (valorVoz !== undefined && valorVoz !== null && valorVoz !== '') {
        updates[mapping[key]] = valorVoz;
      }
    });

    this.vehiculoForm.patchValue(updates);

    if( updates.numero_serie ){
      this.vehiculoForm.get("numeroSerie")?.setValue(updates.numero_serie);
    }

    if( updates.id_marca ){
      this.marcaSelected.set( updates.id_marca )

      this.vehiculoForm.get("id_marca")?.setValue(updates.id_marca);

      if( updates.id_modelo ){
        //setTimeout( () => {

          this.vehiculoForm.get('id_modelo')?.setValue(updates.id_modelo);

          //this.vehiculoForm.patchValue({id_modelo: idModelo});
        //}, 50);
      }
    }

  }

}
