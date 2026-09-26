import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { ToastService } from '../../services/toast.service';
import { animate, state, style, transition, trigger } from '@angular/animations';
import { CommonModule } from '@angular/common';
import { EnumEstatusToast } from '@shared/enums/general-estatus.enum';
import { NgIcon } from "@ng-icons/core";

@Component({
  selector: 'app-toast-container',
  imports: [CommonModule, NgIcon],
  templateUrl: './toast-container.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  animations: [
    trigger('toastAnimation', [
      state('hidden', style({ opacity: 0, transform: 'translateY(50px)' })),
      state('visible', style({ opacity: 1, transform: 'translateY(0)' })),
      transition('hidden => visible', animate('500ms ease-out')),
      transition('visible => hidden', animate('500ms ease-in')),
    ]),
    //animate('1500ms 400ms cubic-bezier(0.68, -0.55, 0.27, 1.55)', style({ opacity: 1, transform: 'translateY(100)' })),
    trigger('toastAnimationO', [
      // Animación de entrada
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(100px)' }),
        //animate('500ms 200ms cubic-bezier(0.68, -0.55, 0.27, 1.55)', style({ opacity: 1, transform: 'translateY(0)' })),
        animate('1000ms 200ms ease-out', style({ opacity: 1, transform: 'translateY(0px)' })),
        //animate('1000ms 200ms ease-out', style({ opacity: 1, transform: 'translateY(100px)' })),
      ]),
      // Animación de salida
      transition(':leave', [
        //animate('500ms 200ms cubic-bezier(0.68, -0.55, 0.27, 1.55)', style({ opacity: 0, transform: 'translateY(-20px)' })),
        //animate('500ms 200ms ease-out', style({ opacity: 0, transform: 'translateY(-50px)' })),
        animate('1000ms 200ms ease-out', style({ opacity: 0, transform: 'translateY(-100px)' })),
      ]),
    ]),
  ],
  //animate('1500ms 400ms cubic-bezier(0.68, -0.55, 0.27, 1.55)', style({ opacity: 0, transform: 'translateY(-100px)' })),
})
export class ToastContainerComponent implements OnInit {

  toastService = inject(ToastService)

  toasts = signal<any>([])

  ngOnInit(): void {

    this.toastService.toasts$.subscribe( (messages) => {
      this.toasts.set( messages )
    })

  }

  get EnumEstatusToast(){
    return EnumEstatusToast;
  }

  closeToast( message: string ){
    this.toastService.removeToast( message )
  }

 }
