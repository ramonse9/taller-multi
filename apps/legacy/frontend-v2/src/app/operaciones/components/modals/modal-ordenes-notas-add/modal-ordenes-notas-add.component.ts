import { ChangeDetectionStrategy, Component, ElementRef, inject, input, signal, ViewChild, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { firstValueFrom } from 'rxjs';
import { Orden } from '@operaciones/interfaces/orden.interface';
import { OrdenNota } from '@operaciones/interfaces/orden-nota.interface';
import { ToastService } from '@shared/services/toast.service';
import { OrdenesService } from '@operaciones/services/ordenes.service';
import { ImagesScalaComponent } from '@shared/components/images/imagesScala/imagesScala.component';
import { ImagesLighboxComponent } from '@shared/components/images/imagesLighbox/imagesLighbox.component';
import { EstatusBadgeComponent } from '@shared/components/estatus-badge/estatus-badge.component';
import { FormUtils } from '@shared/utils/form-utils';
import { EnumCategoria, EnumEstatusToast } from '@shared/enums/general-estatus.enum';
import { NgIcon } from '@ng-icons/core';

interface ImageFile{
  file: File,
  url: string
}

@Component({
  selector: 'app-modal-ordenes-notas-add',
  imports: [CommonModule, NgIcon, ReactiveFormsModule, EstatusBadgeComponent, ImagesLighboxComponent, ImagesScalaComponent],
  templateUrl: './modal-ordenes-notas-add.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ModalOrdenesNotasAddComponent {

  orden = input.required<Orden>();
  formatoTexto = input<boolean>(false);

  @Output() ordenNotasActualizada = new EventEmitter<OrdenNota[]>()

  @ViewChild('scrollContainer') scrollContainer!: ElementRef<HTMLDivElement>

  isVisible = signal(false);

  //imagesFiles: ImageFile[] = []
  imagesFiles = signal<ImageFile[]>([])

  fb = inject(FormBuilder)
  toastService = inject(ToastService)
  ordenesService = inject(OrdenesService)

  imagenSeleccionada: string | null = null;

  ordenNotaForm = this.fb.group({
    nota: ['', [Validators.maxLength(1000)]],
  })

  scrollToBottom() {

    if (this.scrollContainer?.nativeElement) {
      this.scrollContainer.nativeElement.scrollTo({
        top: this.scrollContainer.nativeElement.scrollHeight,
        behavior: 'smooth'
      });
    }
  }

  get EnumCategoria(){
    return EnumCategoria
  }

  get FormUtils(){
    return FormUtils
  }


  get nombreCompleto(){
    return !this.orden().cliente ? '' : this.orden().cliente!.nombre
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

  async onFilesChange(event: Event){

    const fileList = ( event.target as HTMLInputElement ).files

    if(!fileList) return;

    /*const newImages = Array.from( fileList ).map( file => {
      return {
        file: file,
        url: URL.createObjectURL(file)
      }
    })*/


    const files = Array.from(fileList)
    const newImages: ImageFile[] = []
    for( const file of files){
      const resized = await this.resizeImage( file, 1024, 1024)
      const url = URL.createObjectURL(resized)
      newImages.push({ file: resized, url:url })
    }

    this.imagesFiles.update( value => [...value, ...newImages] )

    if( this.imagesFiles().length > 4){

      const limpiar = this.imagesFiles().slice(4)
      limpiar.forEach( image => URL.revokeObjectURL(image.url))

      this.imagesFiles.set( this.imagesFiles().slice(0,4) )
      this.toastService.showToast("No es posible elegir más de 4 imágenes en la misma Nota", EnumEstatusToast.WARNING)
    }

  }

  eliminarImagen(imageUrl: string){

    URL.revokeObjectURL(imageUrl)

    this.imagesFiles.set( this.imagesFiles().filter(imageFile => imageFile.url !== imageUrl ) )

  }

  resizeImage(file: File, maxWidth = 1024, maxHeight = 1024): Promise<File> {
    return new Promise((resolve, reject) => {
      const image = new Image();
      const reader = new FileReader();

      reader.onload = event => {
        if (!event.target?.result) return reject('No se pudo leer el archivo');
        image.src = event.target.result as string;
      };

      image.onload = () => {
        const canvas = document.createElement('canvas');
        let width = image.width;
        let height = image.height;

        const aspectRatio = width / height;
        if (width > maxWidth || height > maxHeight) {
          if (aspectRatio > 1) {
            width = maxWidth;
            height = Math.round(maxWidth / aspectRatio);
          } else {
            height = maxHeight;
            width = Math.round(maxHeight * aspectRatio);
          }
        }

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) return reject('No se pudo obtener el contexto');

        ctx.drawImage(image, 0, 0, width, height);

        canvas.toBlob(blob => {
          if (!blob) return reject('No se pudo generar el blob');

          const resizedFile = new File([blob], file.name, {
            type: file.type,
            lastModified: Date.now(),
          });
          resolve(resizedFile);
        }, file.type, 0.8); // 80% calidad
      };

      reader.readAsDataURL(file);
    });
  }

  async onSubmit(){

    if( this.ordenNotaForm.value.nota?.trim().length === 0){
      this.toastService.showToast("Debes agregar una nota", EnumEstatusToast.WARNING )

      return
    }

    const ordenNotaLike: Partial<OrdenNota> = {
      ...( this.ordenNotaForm.value as any ),
      id_orden: this.orden().id
    }

    try{

      const nuevaNota = await firstValueFrom(
        this.ordenesService.createOrdenNotaWithImagenes( ordenNotaLike, this.imagesFiles().map( imageFile => imageFile.file) )
      )

      this.toastService.showToast( "Se agregó correctamente la nota" )

      this.ordenNotasActualizada.emit( [...this.orden().notas, nuevaNota ] )

      this.ordenNotaForm.patchValue({
        nota: ''
      })

      this.imagesFiles().forEach( image => URL.revokeObjectURL(image.url))
      this.imagesFiles.set( [] )

      setTimeout(() => {

        this.scrollToBottom()

      }, 100);

    }catch(error: any){

      this.toastService.showToastErrors( error )

    }


  }

}
