import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { OrdenNotaImagen } from '@operaciones/interfaces/orden-nota-imagen.interface';

@Component({
  selector: 'app-images-lighbox',
  imports: [CommonModule],
  templateUrl: './imagesLighbox.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ImagesLighboxComponent {

  imagenes = input.required<OrdenNotaImagen[]>()

  imagenSeleccionada: string | null = null;

  verImagen(url: string) {
    this.imagenSeleccionada = url;
  }

  cerrarImagen() {
    this.imagenSeleccionada = null;
  }
}
