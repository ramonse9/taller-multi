import {  Component, inject, input, OnInit } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Marca } from '../../../interfaces/marca.interface';

import { Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { ToastService } from '../../../../shared/services/toast.service';
import { rxResource } from '@angular/core/rxjs-interop';
import { MarcasService } from '../../../services/marcas.service';
import { PageFormHeaderComponent } from '../../../../shared/components/forms/page-form-header/page-form-header.component';
import { PageFormBodyComponent } from '../../../../shared/components/forms/page-form-body/page-form-body.component';
import { PageFormControlInputListComponent } from '../../../../shared/components/forms/page-form-control-input-list/page-form-control-input-list.component';
import { EnumEstatusToast, EnumPaginasTitulo } from '@shared/enums/general-estatus.enum';


@Component({
  selector: 'app-marca-details',
  imports: [ReactiveFormsModule, PageFormHeaderComponent, PageFormBodyComponent, PageFormControlInputListComponent],
  templateUrl: './marca-details.component.html'
})
export class MarcaDetailsComponent implements OnInit {

  marca = input.required<Marca | null>();

  fb = inject(FormBuilder);
  router = inject(Router);
  marcasService = inject(MarcasService);
  toastService = inject(ToastService);

  marcaForm = this.fb.group({
    nombre: ['', [Validators.required, Validators.minLength(2)]],
  })

  marcasRXResource = rxResource({

    params:() => ({}),
    stream: () => {
      return this.marcasService.getMarcasAll()
    }

  })

  get marcasNombre(){
    return this.marcasRXResource.value()?.marcas?.map( marca => marca.nombre)
  }

  get EnumPaginasTitulo(){
    return EnumPaginasTitulo;
  }


  ngOnInit(): void {
    this.setFormValue( )
  }

  setFormValue( ){

    this.marcaForm.reset( this.marca() as any );
    //this.marcaForm.patchValue(formLike as any)

  }

  inputTextModelo( inputText: string){

    this.marcaForm.patchValue({
      nombre: inputText
    })

  }

  async onSubmit(){

    this.marcaForm.markAllAsTouched();

    const isValid = this.marcaForm.valid;

    if( !isValid ) {
      this.toastService.showToast("Debes capturar la informacion solicitada", EnumEstatusToast.WARNING);
      return;
    }

    const formValue = this.marcaForm.value;

    const marcaLike: Partial<Marca> = {

      ...(formValue as any)

    }


    if( !this.marca() ){

      try{

        const marca = await firstValueFrom(
          this.marcasService.createMarca(marcaLike)
        )

        this.router.navigate(['/catalogos/marcas', marca.id]);

        this.toastService.showToast( "Se guardó correctamente la nueva marca" )

      }catch(error: any){
        this.toastService.showToastErrors(error)
      }

    }else{

      try{

        const marca = await firstValueFrom(
          this.marcasService.updateMarca(this.marca()!.id, marcaLike)
        )

        this.toastService.showToast( "Se actualizó correctamente la nueva marca" )

      }catch(error: any){
        this.toastService.showToastErrors(error)
      }

    }

  }

 }
