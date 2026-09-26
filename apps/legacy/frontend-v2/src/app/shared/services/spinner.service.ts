import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class SpinnerService {

  private _isLoading  = new BehaviorSubject<boolean>(false);
  public isLoading$ = this._isLoading.asObservable();

  showSpinner(){
    this._isLoading.next(true)
  }

  hideSpinner(){
    setTimeout( () => {
      this._isLoading.next(false);
    }, 100)
  }
}
