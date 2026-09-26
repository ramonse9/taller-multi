import { inject, Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Emisor } from '../interfaces/emisor.interface';

const baseUrl = environment.baseUrl;

@Injectable({
  providedIn: 'root'
})
export class EmisoresService {

  private http = inject(HttpClient)

  /*getEmisor(id: string):Observable<Emisor>{
    return this.http.get<Emisor>(`${baseUrl}/emisores/${id}`)
  }*/

  getEmisor():Observable<Emisor>{

    return this.http.get<Emisor>(`${baseUrl}/emisores`)

  }

  createEmisorWithArchivos( emisorLike: Partial<Emisor>, files: File[]):Observable<Emisor>{

    const formData = new FormData()

    Object.entries(emisorLike).forEach( ([key,value]) => {
      if( value !== null && value !== undefined ){
        formData.append( key, value.toString() )
      }
    })

    files?.forEach( file => {
      formData.append('files', file)
    })

    return this.http.post<Emisor>(`${baseUrl}/emisores/archivos`, formData )

  }

  updateEmisor( formData: FormData):Observable<{rfc: string, razon_social: string}>{

    return this.http.patch<{rfc: string, razon_social: string}>(`${baseUrl}/emisores`, formData )

  }

}
