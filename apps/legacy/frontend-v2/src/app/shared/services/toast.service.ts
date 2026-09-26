import { Injectable } from '@angular/core';
import { EnumEstatusToast } from '@shared/enums/general-estatus.enum';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ToastService {

  /*
  private toastMessages = new BehaviorSubject<any[]>([]);
  public toasts$ = this.toastMessages.asObservable();

  showToast(message: string, estatus: EnumEstatusToast = EnumEstatusToast.SUCCESS, duration = 10000) {
    const currentToasts = this.toastMessages.value;
    const newToast = { message, estatus, state: 'hidden' };

    this.toastMessages.next([...currentToasts, newToast]);

    // Activar animación después de 50ms
    setTimeout(() => {
      newToast.state = 'visible';
      this.toastMessages.next([...this.toastMessages.value]); // Dispara la actualización
    }, 50);

    // Ocultar el toast después de `duration` ms
    setTimeout(() => {
      this.removeToast(message);
    }, duration);
  }

  removeToast(message: string) {
    const currentToasts = this.toastMessages.value.map(toast =>
      toast.message === message ? { ...toast, state: 'hidden' } : toast
    );

    this.toastMessages.next(currentToasts);

    // Eliminar después de la animación (500ms)
    setTimeout(() => {
      this.toastMessages.next(this.toastMessages.value.filter(toast => toast.message !== message));
    }, 500);
  }
  */

  private toastMessages = new BehaviorSubject<any[]>([]);

  public toasts$ = this.toastMessages.asObservable();

  showToast( message: string, estatus: EnumEstatusToast = EnumEstatusToast.SUCCESS, duration = 5000 ){

    const currentToasts = this.toastMessages.value
    this.toastMessages.next([...currentToasts, { message, estatus }])

    setTimeout( () => {
      this.removeToast(message);
    }, duration)

  }

  removeToast(message: string ){

    const currentToasts = this.toastMessages.value.filter( (toast) => toast.message !== message);
    this.toastMessages.next(currentToasts);

  }

  showToastErrors(error: any){

    if( error?.error?.message ){
      this.showToast(`${error.error.message}`, error.error.statusCode !== 500 ? EnumEstatusToast.WARNING: EnumEstatusToast.DANGER);
    }else{
      this.showToast(`Error inesperado: ${error}`, EnumEstatusToast.DANGER);
    }

  }

}
