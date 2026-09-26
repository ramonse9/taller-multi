import { ChangeDetectionStrategy, Component, ElementRef, EventEmitter, inject, OnDestroy, Output, signal, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule} from '@angular/forms';

import { NgIcon } from '@ng-icons/core';
import { VinService } from '@catalogos/services/vin.service';
import { ToastService } from '@shared/services/toast.service';
import { EnumEstatusToast } from '@shared/enums/general-estatus.enum';

@Component({
  selector: 'app-modal-vehiculos-vin-canva',
  imports: [CommonModule, ReactiveFormsModule, NgIcon],
  templateUrl: './modal-vehiculos-vin-canva.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ModalVehiculosVinCanvaComponent implements OnDestroy {

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

      const track = this.stream.getVideoTracks()[0];
      const capabilities = track.getCapabilities() as any; // Obtenemos qué puede hacer la cámara
      const constraints: any = { advanced: [] as any[] };

      // 1. Lógica de Zoom 2X
      // Verificamos si el navegador/hardware soporta zoom
      if (capabilities.zoom) {
        // El estándar suele ser 1.0 a 10.0. Forzamos 2.0 o el máximo permitido si es menor.
        const zoomLevel = Math.min(2, capabilities.zoom.max);
        constraints.advanced.push({ zoom: zoomLevel });
      }

      // 2. Lógica de Foco Continuo (Tu lógica original)
      if (capabilities.focusMode?.includes('continuous')) {
        constraints.advanced.push({ focusMode: 'continuous' });
      }

      // Aplicamos todas las restricciones de una sola vez
      if (constraints.advanced.length > 0) {
        await track.applyConstraints(constraints);
      }

    } catch (err) {
      //console.error("Error al iniciar cámara", err);
      console.error("Error al iniciar cámara", err);
      this.toastService.showToast("No se pudo acceder a la cámara", EnumEstatusToast.DANGER);
    }
  }

  stopCamera() {
    if (this.stream) {
      this.stream.getTracks().forEach(track => track.stop());
    }
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
    if (!texto) {
      this.toastService.showToast("No se detectó texto", EnumEstatusToast.WARNING);
      return;
    }

    // 1. Limpieza básica: Solo quitar espacios y saltos de línea.
    // NO reemplazamos O/I todavía para no arruinar la búsqueda del ancla.
    const crudo = texto.replace(/[\s\n]/g, '').toUpperCase();

    // 2. Buscamos el bloque que termine en al menos 5 o 6 números consecutivos.
    // Esto es lo que define el final de un Numero de Serie real y lo diferencia de un logo como "GM".
    // La Regex busca: 4 caracteres alfanuméricos + 6 números finales.
    const regexVin10 = /([A-Z0-9]{4})(\d{6})/;
    const match = crudo.match(regexVin10);

    if (match) {
      // match[0] es el bloque de 10 caracteres que cumple la regla
      let vin10 = match[0];

      // 3. AHORA SÍ, corregimos posibles errores de OCR solo en este bloque de 10.
      // Especialmente en los primeros 4 caracteres (donde puede haber letras).
      vin10 = vin10.replace(/O/g, '0').replace(/I/g, '1');

      this.finalizar(vin10);
    } else {
      // 4. Si no encontramos el patrón perfecto, intentamos un "Fallback"
      // buscando el último número disponible pero validando longitud mínima.
      const soloAlfaNum = crudo.replace(/[^A-Z0-9]/g, '');
      const matchDigitos = soloAlfaNum.match(/\d/g);

      if (matchDigitos) {
        const ultimoIndice = soloAlfaNum.lastIndexOf(matchDigitos[matchDigitos.length - 1]);

        // Si hay al menos 10 caracteres antes de ese número, extraemos
        if (ultimoIndice >= 9) {
          let vinExtraido = soloAlfaNum.substring(ultimoIndice - 9, ultimoIndice + 1);

          // Antes de finalizar, verificamos que no termine en "GM" o "G1" por error
          // (Podemos añadir excepciones si detectamos que los últimos caracteres son letras)
          if (/[A-Z]{2}$/.test(vinExtraido)) {
            this.toastService.showToast("Detección borrosa, intente de nuevo", EnumEstatusToast.WARNING);
          } else {
            this.finalizar(vinExtraido.replace(/O/g, '0').replace(/I/g, '1'));
          }
        } else {
          this.toastService.showToast("Acerque más la cámara al VIN", EnumEstatusToast.WARNING);
        }
      }
    }
  }

  private procesarResultado10OLD(texto: string) {
    if (!texto) {
      this.toastService.showToast("No se detectó texto", EnumEstatusToast.WARNING);
      return;
    }

    let limpio = texto.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();

    console.log("Texto procesado:", limpio);

    if (limpio.length >= 10) {
      // Tomamos los últimos 10
      const vin10 = limpio.substring(limpio.length - 10);
      this.finalizar(vin10);
    } else {
      this.toastService.showToast("VIN incompleto, acerque más la cámara", EnumEstatusToast.WARNING);
    }
  }

  private capturarConRecorte() {
    const video = this.video.nativeElement;
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d')!;

    // Dimensiones reales del flujo de video
    const vWidth = video.videoWidth;
    const vHeight = video.videoHeight;

    // Calculamos el recorte (debe coincidir proporcionalmente con tu CSS del overlay)
    const cropWidth = vWidth * 0.8;
    const cropHeight = vHeight * 0.25; // Ajustado para ser más delgado

    const sx = (vWidth - cropWidth) / 2;
    const sy = (vHeight - cropHeight) / 2;

    canvas.width = cropWidth;
    canvas.height = cropHeight;

    ctx.drawImage(video, sx, sy, cropWidth, cropHeight, 0, 0, cropWidth, cropHeight);

    const base64 = canvas.toDataURL('image/jpeg', 0.9).split(',')[1];
    this.enviarAVision(base64);
  }

  async capturar() {
    if (this.isProcessing()) return;
    this.isProcessing.set(true);

    this.capturarConRecorte();
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
