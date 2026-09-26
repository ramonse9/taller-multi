import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, EventEmitter, input, Output } from '@angular/core';

interface ImageFile{
  file: File,
  url: string
}

@Component({
  selector: 'app-images-scala',
  imports: [CommonModule],
  templateUrl: './imagesScala.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ImagesScalaComponent {

  imagesFiles = input<ImageFile[]>([])

  @Output() eliminarImagen = new EventEmitter<string>()

  eliminar(imageUrl: string){

    //URL.revokeObjectURL(imageUrl)
    this.eliminarImagen.emit(imageUrl)
    //this.imagesFiles = this.imagesFiles().filter( imageFile => imageFile.url !== imageUrl)
  }

 }
