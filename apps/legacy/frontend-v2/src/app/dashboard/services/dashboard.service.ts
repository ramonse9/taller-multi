import { inject, Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { DashboardCountAll } from '@dashboard/interfaces/dashboard-interface';

const baseUrl = environment.baseUrl;

@Injectable({
  providedIn: 'root'
})
export class DashboardService {

  private http = inject(HttpClient)

  getAllCounts(): Observable<DashboardCountAll>{
    return this.http.get<DashboardCountAll>(`${baseUrl}/dashboard/count`)

  }


}
