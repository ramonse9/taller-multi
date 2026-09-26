import { ChangeDetectionStrategy, Component, computed, inject, input, linkedSignal, OnInit, output } from '@angular/core';
import { Modelo } from '../../../interfaces/modelo.interface';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { ModelosService } from '../../../services/modelos.service';
import { rxResource } from '@angular/core/rxjs-interop';
import { MarcasService } from '../../../services/marcas.service';
import { firstValueFrom } from 'rxjs';
import { ToastService } from '../../../../shared/services/toast.service';
import { PageFormControlSearchListComponent } from '../../../../shared/components/forms/page-form-control-search-list/page-form-control-search-list.component';
import { PageFormControlInputListComponent } from '../../../../shared/components/forms/page-form-control-input-list/page-form-control-input-list.component';
import { EnumEstatusToast, EnumPaginasTitulo } from '@shared/enums/general-estatus.enum';
import { SpinnerService } from '@shared/services/spinner.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-drawer-modelo-nuevo-editar',
  imports: [CommonModule, ReactiveFormsModule, PageFormControlSearchListComponent, PageFormControlInputListComponent],
  templateUrl: './drawer-modelo-nuevo-editar.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DrawerModeloNuevoEditarComponent implements OnInit {

  modelo = input.required<Modelo | null>();

  guardadoCorrectoEmit = output<void>();

  fb = inject(FormBuilder)
  router = inject(Router)
  modeloService = inject(ModelosService)
  marcasService = inject(MarcasService)
  toastService = inject(ToastService)

  spinnerService = inject(SpinnerService);

  isLoading = this.spinnerService.isLoading$

  modeloForm = this.fb.group({
    nombre: ['', [Validators.required]],
    id_marca: ['', [Validators.required]]
  })

  marcasRXResource = rxResource({
    params: () => ({}),
    stream: ({params}) => {
      return this.marcasService.getMarcasAll()
    }
  })

  id_marca = linkedSignal( () => this.modelo()?.marca.id )

  modelosPorMarcaNombre = computed( () => {

    return this.marcasRXResource.value()?.marcas?.find( marca => marca.id === this.id_marca() )?.modelos?.map( modelo => modelo.nombre )

  })

  get EnumPaginasTitulo(){
    return EnumPaginasTitulo;
  }

  ngOnInit(){

    this.setFormValue()

  }

  setFormValue( ){

    this.modeloForm.reset( this.modelo() as any )

    this.modeloForm.patchValue({
      id_marca: this.modelo()?.marca.id
    })
  }

  optionSelectedMarca(optionId: string ){

    this.modeloForm.patchValue({
      id_marca: optionId
    })

    this.id_marca.set( optionId )

  }

  inputTextModelo( inputText: string){

    this.modeloForm.patchValue({
      nombre: inputText
    })

  }

  async onSubmit(){

    this.modeloForm.markAllAsTouched();

    const isValid = this.modeloForm.valid;

    if( !isValid ) {
      this.toastService.showToast("Debes capturar la informacion solicitada", EnumEstatusToast.WARNING);
      return;
    }

    const formValue = this.modeloForm.value

    const modeloLike: Partial<Modelo> = {

      ...(formValue as any)

    }

    if( !this.modelo() ){

      try{

        const modelo = await firstValueFrom(
          this.modeloService.createModelo( modeloLike)
        )

        this.guardadoCorrectoEmit.emit()

        this.toastService.showToast("Se guardó correctamente el nuevo modelo")

      }catch(error: any){
        this.toastService.showToastErrors(error);
      }

    }else{

      try{

        const modelo = await firstValueFrom(
          this.modeloService.updateModelo( this.modelo()!.id, modeloLike )
        )

        this.guardadoCorrectoEmit.emit()

        this.toastService.showToast("Se actualizó correctamente el nuevo modelo");

      }catch(error: any){
        this.toastService.showToastErrors(error);
      }

    }
  }

}
