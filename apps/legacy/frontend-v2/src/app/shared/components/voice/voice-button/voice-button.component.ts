import { ChangeDetectionStrategy, Component, EventEmitter, inject, input, OnDestroy, OnInit, Output } from '@angular/core';
import { NgIcon } from "@ng-icons/core";
import { environment } from '@env/environment';
import { VoiceService } from '@shared/services/voice.service';
import { CommonModule } from '@angular/common';
import { ToastService } from '@shared/services/toast.service';
import { EnumEntidadesVoice } from '@shared/enums/general-estatus.enum';
import { firstValueFrom, Subscription } from 'rxjs';

@Component({
  selector: 'app-voice-button',
  imports: [CommonModule, NgIcon],
  templateUrl: './voice-button.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class VoiceButtonComponent implements OnInit, OnDestroy{

    durationSeconds = input<number>(10);
    entidadVoice = input.required<EnumEntidadesVoice>();

    @Output() datosJsonEmit = new EventEmitter<any>()

    private voiceSub?: Subscription;

    voiceService = inject( VoiceService );
    toastService = inject( ToastService );

    isMobile = false;
    lowTime = false;

    version = environment.version;

    constructor(){
    }

    ngOnDestroy(): void {
        this.voiceSub?.unsubscribe();
    }

    ngOnInit(): void {
        this.voiceSub = this.voiceService.recordingFinished$.subscribe(data => {
            if( data.entidad == this.entidadVoice()){
                this.enviarAProcesar(data.texto);
            }
        });
    }

    toggleRecording(): void {
        if (this.voiceService.isListening()) {
            this.stopRecording();
        } else {
            this.startRecording();
        }
    }

    private startRecording(): void {
        if ('vibrate' in navigator) {
            try {
                navigator.vibrate(50);
            } catch (e) {
                console.warn('Vibración bloqueada.');
            }
        }
        this.voiceService.start(this.durationSeconds(), this.entidadVoice());
    }

    private stopRecording(): void {
        this.voiceService.stop();
    }

    async enviarAProcesar(texto: string){

        try{

            const camposJson = await firstValueFrom(
                this.voiceService.extraerCamposDelTexto( { texto: texto, entidad: this.entidadVoice()  })
            )

            this.datosJsonEmit.emit( camposJson )

        }catch(error){
            this.toastService.showToastErrors( error )
        }

    }

}
