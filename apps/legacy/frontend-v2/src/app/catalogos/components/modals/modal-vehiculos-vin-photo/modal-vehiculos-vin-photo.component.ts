import { ChangeDetectionStrategy, Component, ElementRef, EventEmitter, inject, OnDestroy, Output, signal, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule} from '@angular/forms';

import { NgIcon } from '@ng-icons/core';
import { VinService } from '@catalogos/services/vin.service';
import { ToastService } from '@shared/services/toast.service';
import { EnumEstatusToast } from '@shared/enums/general-estatus.enum';

@Component({
  selector: 'app-modal-vehiculos-vin-photo',
  imports: [CommonModule, ReactiveFormsModule, NgIcon],
  templateUrl: './modal-vehiculos-vin-photo.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ModalVehiculosVinPhotoComponent implements OnDestroy {

  @Output() vinDetectadoEmit = new EventEmitter<string>()
  @ViewChild('video') video!: ElementRef<HTMLVideoElement>;

  private vinService = inject(VinService)
  private toastService = inject(ToastService)

  isVisible = signal(false)
  isProcessing = signal(false);

  stream!: MediaStream;

  async startCamera() {
    try {
      this.stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'environment',
          width: { ideal: 1920 },
          height: { ideal: 1080 }
        }
      });

      this.video.nativeElement.srcObject = this.stream;

      // Aplicar configuraciones avanzadas (Enfoque)
      const track = this.stream.getVideoTracks()[0];
      const capabilities = track.getCapabilities() as any; // Obtenemos qué puede hacer la cámara

      // Verificamos si la cámara soporta enfoque continuo
      if (capabilities.focusMode?.includes('continuous')) {
        await track.applyConstraints({
          advanced: [{ focusMode: 'continuous' }]
        } as any);
      }
    } catch (err) {
      console.error("Error al iniciar cámara", err);
    }
  }

  stopCamera() {
    this.stream?.getTracks().forEach(track => track.stop());
  }

  showModal() {
    this.isVisible.set(true);

    setTimeout(() => {
      this.startCamera();
    }, 100);
  }

  closeModal() {
    this.stopCamera();
    this.isVisible.set(false);
  }

  ngOnDestroy(): void {
    this.stopCamera();
  }

  private finalizar(numeroSerie: string) {
    this.vinDetectadoEmit.emit(numeroSerie);
    this.closeModal();
  }

  private procesarResultado10(texto: string) {

    console.log( "texto: " )
    console.log( texto )
    // Limpiamos todo lo que no sea letra o número
    let limpio = texto.toUpperCase().replace(/[^A-Z0-9]/g, '');

    // Buscamos cualquier cadena alfanumérica larga
    // Los VINs no tienen I, O ni Q.
    if (limpio.length >= 10) {
      const vin10 = limpio.slice(-10);
      this.finalizar(vin10);
    } else {
      this.toastService.showToast("No se pudo extraer el VIN completo", EnumEstatusToast.WARNING);
    }
  }

  // Helper para convertir el archivo de imagen
  private blobToBase64(blob: Blob): Promise<string> {
    return new Promise((resolve, _) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.readAsDataURL(blob);
    });
  }

  async capturar() {
    if (this.isProcessing()) return;
    this.isProcessing.set(true);

    const track = this.stream.getVideoTracks()[0];
    const ImageCaptureAPI = (window as any).ImageCapture;

    // Intentamos la foto de alta resolución (Sensor nativo)
    if (ImageCaptureAPI) {
      try {
        const captureDevice = new ImageCaptureAPI(track);
        const blob = await captureDevice.takePhoto();
        const base64Full = await this.blobToBase64(blob);
        await this.enviarAVision(base64Full.split(',')[1]);
        this.isProcessing.set(false)
        return; // Éxito, salimos
      } catch (e) {
        console.warn("ImageCapture falló, intentando con Canvas...", e);
      }
    }

    // Si no hay ImageCapture o falló, usamos el Canvas (Buffer de video)
    this.capturarConCanvas();
  }

  private capturarConCanvas() {
    const video = this.video.nativeElement;
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d')!;

    // IMPORTANTE: Usamos las dimensiones REALES del video, no las del CSS
    // Esto evita que la imagen salga pixelada o con el "zoom" del modal
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    // Dibujamos el frame actual del stream en el canvas
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    // Convertimos a Base64
    // Usamos 'image/jpeg' y calidad 0.9 para un buen balance entre nitidez y peso
    const base64 = canvas.toDataURL('image/jpeg', 0.9).split(',')[1];

    // Enviamos a procesar
    this.enviarAVision(base64);
  }

  // Factorizamos el llamado a la API para no repetir código
  private async enviarAVision(imageBase64: string) {
    try {
      const textoDetectado = await this.vinService.extraerTexto(imageBase64);
      this.procesarResultado10(textoDetectado);
    } catch (error: any) {
      this.toastService.showToast("Error al procesar la imagen", EnumEstatusToast.DANGER);
    } finally {
      this.isProcessing.set(false);
    }
  }

}
