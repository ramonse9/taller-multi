import { HttpClient, HttpHeaders, HttpBackend } from "@angular/common/http";
import { inject, Injectable } from "@angular/core";
import { environment } from "../../../environments/environment";
import { firstValueFrom } from "rxjs";

@Injectable({
  providedIn: 'root'
})
export class VinService {

  private http = inject( HttpClient )
  private httpClientEspecial = inject(HttpClient)
  private handler = inject( HttpBackend )

  private readonly URL = `https://vision.googleapis.com/v1/images:annotate?key=${environment.apiKeyCloudVision}`;

  async extraerTexto(base64Image: string): Promise<string> {

    this.httpClientEspecial = new HttpClient( this.handler )

    const base64Puro = base64Image.includes(',')
                     ? base64Image.split(',')[1]
                     : base64Image;

    const body = {
      requests: [{
        image: { content: base64Puro },
        features: [{ type: 'TEXT_DETECTION' }]
      }]
    };

    try {

      const res: any = await firstValueFrom(
        this.http.post(this.URL, body )
      );

      return res.responses[0]?.fullTextAnnotation?.text || '';
    } catch (error: any) {
      console.error('Error completo:', error);
      return '';
    }

  }

  async extraerTextoOLD(base64Image: string): Promise<string> {
    const body = {
      requests: [{
        image: { content: base64Image },
        features: [{ type: 'TEXT_DETECTION' }]
      }]
    };

    try {

      const headers = new HttpHeaders({
        'Content-Type': 'application/json',
        'Skip-Interceptor': 'true'
      });

      const res: any = await firstValueFrom(
        this.http.post(this.URL, body, { headers })
      );

      return res.responses[0]?.fullTextAnnotation?.text || '';
    } catch (error: any) {
      console.error('Error completo:', error);
      return '';
    }

  }

}
