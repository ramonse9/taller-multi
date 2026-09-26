import { HttpClient } from "@angular/common/http";
import { inject, Injectable, signal } from "@angular/core";
import { EnumEntidadesVoice } from "@shared/enums/general-estatus.enum";
import { Subject } from "rxjs";
import { environment } from "@env/environment";

const baseUrl = environment.baseUrl;

@Injectable({
    providedIn: 'root'
})
export class VoiceService{

    public transcript = signal('');
    public isListening = signal(false);
    public isLowTime = signal(false);

    private http = inject(HttpClient);

    public recordingFinished$ = new Subject<{ texto: string, entidad: EnumEntidadesVoice }>();
    private entidadSolicitada?: EnumEntidadesVoice;

    private isManuallyStopped = false;
    private startTime: number = 0;
    private maxDurationMs: number = 0;
    private finalTranscript = '';

    private maxRecordingTimer: any;
    private lowTimeWarningTimer: any;

    private recognition: any;

    constructor(){
        const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

        if(!SpeechRecognition ){
            console.error("El navegador no soporta Web Speech API");
            return;
        }

        this.recognition = new SpeechRecognition();

        this.recognition.lang = 'es-MX';
        this.recognition.continuous = true;
        this.recognition.interimResults = true;

        this.recognition.onstart = ( ) => {
            console.log('Grabación iniciada/reanudada');
            this.isListening.set(true);
        };

        this.recognition.onend = () => {
            const now = Date.now();
            const elapsed = now - this.startTime;
            const remaining = this.maxDurationMs - elapsed;

            // Si quedan menos de 500ms, mejor no reiniciar
            if (!this.isManuallyStopped && remaining > 500) {
                try {
                    this.recognition.start();
                    return;
                } catch (e) { console.error("Error re-iniciando", e); }
            }

            this.isListening.set(false);
            this.isLowTime.set(false);
            this.clearTimers();
            console.log('Grabación finalizada definitivamente');

            const textoFinal = this.transcript().trim();
            if (textoFinal.length > 0 && this.entidadSolicitada) {
                this.recordingFinished$.next({
                    texto: textoFinal,
                    entidad: this.entidadSolicitada
                });
            }

        };

        this.recognition.onresult = (event: any) => {
            let interimText = '';

            for (let i = event.resultIndex; i < event.results.length; i++) {
                const transcript = event.results[i][0].transcript;
                if (event.results[i].isFinal) {
                    this.finalTranscript += transcript + ' ';
                } else {
                    interimText += transcript;
                }
            }

            this.transcript.set(this.finalTranscript + interimText);
        };

        this.recognition.onerror = (event: any) => {
            console.error('Error de voz:', event.error);
            this.stop();
        };

    }

    start(durationSeconds: number, entidad: EnumEntidadesVoice) {
        this.entidadSolicitada = entidad;
        this.isManuallyStopped = false;
        this.startTime = Date.now();
        this.maxDurationMs = durationSeconds * 1000;

        this.finalTranscript = '';
        this.transcript.set('');

        try {
            this.recognition.start();
        } catch (e) { console.warn("Ya estaba activo"); }

        this.maxRecordingTimer = setTimeout(() => {
            this.stop();
        }, this.maxDurationMs);

        this.lowTimeWarningTimer = setTimeout(() => {
            this.isLowTime.set(true);
        }, (durationSeconds - 2) * 1000);
    }

    stop() {
        this.isManuallyStopped = true;
        this.recognition.stop();
        this.clearTimers();
    }

    private clearTimers() {
        if (this.maxRecordingTimer) clearTimeout(this.maxRecordingTimer);
        if (this.lowTimeWarningTimer) clearTimeout(this.lowTimeWarningTimer);

        this.maxRecordingTimer = null;
        this.lowTimeWarningTimer = null;

    }

    extraerCamposDelTexto( payload: { texto: string, entidad: EnumEntidadesVoice } ){
        return this.http.post(`${baseUrl}/ia`, payload)
    }

}
