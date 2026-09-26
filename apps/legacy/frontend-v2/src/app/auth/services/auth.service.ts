import { HttpClient } from '@angular/common/http';
import { computed, inject, Injectable, signal } from '@angular/core';
import { environment } from '../../../environments/environment';
import { catchError, map, Observable, of, switchMap, tap } from 'rxjs';
//import { AuthResponse } from '../interfaces/auth-response-OLD';
import { User } from '../interfaces/auth.interface';
import { LoginResponse } from '@auth/interfaces/login-response';
import { RefreshResponse } from '@auth/interfaces/refresh-response';
import { CheckStatusResponse } from '@auth/interfaces/check-status.response';

//type AuthStatus = 'checking' | 'authenticated' | 'not-authenticated';
//const CHECKING: AuthStatus = 'checking';
//const AUTHENTICATED: AuthStatus = 'authenticated';
//const NOT_AUTHENTICATED: AuthStatus = 'not-authenticated';

export enum EnumAuthStatus {
  Checking =            'checking',
  Authenticated =       'authenticated',
  Not_Authenticated =   'not-authenticated'
}

export interface CompaniaModulos{
  moduloInventario:   boolean;
  moduloFacturacion:  boolean;
  moduloGastos:       boolean;
  moduloNomina:       boolean;
}

const baseUrl = environment.baseUrl;

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  private _authStatus = signal<EnumAuthStatus>(EnumAuthStatus.Checking);
  private _user = signal<User | null>(null);
  private _accessToken = signal<string | null>(localStorage.getItem('accessToken'));

  private http = inject(HttpClient)

  hasErrorMessage = signal<string | null>(null);

  authStatus = computed<EnumAuthStatus>( () => {

    return this._authStatus()

  })

  user = computed( () => this._user() )

  accessToken = computed( () => this._accessToken() )

  role = computed( () => this._user()?.role)

  companiaModulos = computed<CompaniaModulos>( () => {
    const user = this._user()

    if( !user || !user.compania){
      return {
        moduloInventario:   false,
        moduloFacturacion:  false,
        moduloGastos:       false,
        moduloNomina:       false
      }
    }

    return {
      moduloInventario:   user.compania.moduloInventario,
      moduloFacturacion:  user.compania.moduloFacturacion,
      moduloGastos:       user.compania.moduloGastos,
      moduloNomina:       user.compania.moduloNomina
    }

  })

  login(email: string, password: string):Observable<EnumAuthStatus>{

    return this.http.post<LoginResponse>(`${baseUrl}/auth/login`, {
      email: email,
      password: password
    },{
      withCredentials:true
    }).pipe(
      map( resp =>  this.handleAuthSuccess( resp ) ),
      catchError( (error: any) => of( this.handleAuthError(error) ) )
    )

  }

  checkStatus():Observable<EnumAuthStatus>{

    const accessToken = localStorage.getItem('accessToken');

    if(!accessToken){
      return this.refreshToken();
    }

    return this.http.get<CheckStatusResponse>(
      `${baseUrl}/auth/check-status`
    ).pipe(
      map( resp =>  {

        this._user.set(resp.user)
        this._authStatus.set(
          EnumAuthStatus.Authenticated
        )

        return EnumAuthStatus.Authenticated;

      }),
      catchError( (): Observable<EnumAuthStatus> => {
        return this.refreshToken();

      })
    )

  }

  changePassword(currentPassword: string, newPassword: string): Observable<boolean> {
    return this.http.post<{ message: string }>(`${baseUrl}/auth/change-password`, {
      currentPassword,
      newPassword
    }).pipe(
      map(() => true),
      catchError((error: any) => {
        this.handleOperationError(error);
        return of(false);
      })
    );
  }

  private handleAuthSuccess( resp: LoginResponse):EnumAuthStatus{

    this._user.set(resp.user ?? null);
    this._authStatus.set( EnumAuthStatus.Authenticated );
    this._accessToken.set(resp.accessToken);

    localStorage.setItem('accessToken', resp.accessToken);

    return this._authStatus();
  }

  private handleOperationError(error: any): void {

    const backendMessageRaw = error?.error?.message;

    const backendMessage = Array.isArray(backendMessageRaw)
      ? backendMessageRaw[0]
      : backendMessageRaw ?? 'Ocurrió un error';

    this.hasErrorMessage.set(backendMessage);
  }

  private handleAuthError( error: any):EnumAuthStatus{

    const backendMessageRaw = error?.error?.message;
    const backendMessage = Array.isArray(backendMessageRaw)
      ? backendMessageRaw[0]
      : backendMessageRaw ?? 'Por favor revise la información ingresada'

    this.hasErrorMessage.set( backendMessage );

    this.logout();

    return this._authStatus();
  }

  private clearAuthData(){

    this._user.set(null);

    this._accessToken.set(null);

    this._authStatus.set(
      EnumAuthStatus.Not_Authenticated
    );

    localStorage.removeItem('accessToken');

  }

  logout(){

    this.http.post(
      `${baseUrl}/auth/logout`,
      {},
      {
        withCredentials: true
      }
    ).subscribe({
       next: () => this.clearAuthData(),
      error: () => this.clearAuthData()
    });

  }

  hasRole(role: string): boolean {
    return this._user()?.roles?.includes(role) ?? false;
  }

  refreshToken(): Observable<EnumAuthStatus> {

    return this.http.post<RefreshResponse>(
      `${baseUrl}/auth/refresh`,
      {},
      {
        withCredentials: true
      }
    ).pipe(

      tap(resp => {

        this._accessToken.set(resp.accessToken);

        localStorage.setItem(
          'accessToken',
          resp.accessToken
        );

      }),

      switchMap(() =>
        this.http.get<CheckStatusResponse>(
          `${baseUrl}/auth/check-status`
        )
      ),

      map(resp => {

        this._user.set(resp.user);

        this._authStatus.set(
          EnumAuthStatus.Authenticated
        );

        return EnumAuthStatus.Authenticated;

      }),

      catchError(() => {

        this.clearAuthData();

        return of(
          EnumAuthStatus.Not_Authenticated
        );

      })
    );

  }

}
