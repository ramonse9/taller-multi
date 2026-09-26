import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { rxResource } from '@angular/core/rxjs-interop';
import { EmisoresService } from '../../services/emisores.service';
import { MisDatosDetailsComponent } from './mis-datos-details/mis-datos-details.component';
import { catchError, of, tap } from 'rxjs';
import { BadgeMessageComponent } from "@shared/components/badges/badge-message/badge-message.component";
import { EnumEstatusToast } from '@shared/enums/general-estatus.enum';
import { animate, style, transition, trigger } from '@angular/animations';
import { SpinnerComponent } from '@shared/components/loading/spinner/spinner.component';

@Component({
  selector: 'app-mis-datos-page',
  imports: [MisDatosDetailsComponent, SpinnerComponent, BadgeMessageComponent],
  templateUrl: './mis-datos-page.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  animations: [
    trigger('fadeAnimation', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateX(15px)' }),
        animate('400ms ease-out', style({ opacity: 1, transform: 'translateX(0)' }))
      ]),
      transition(':leave', [
        animate('400ms ease-in', style({ opacity: 0, transform: 'translateX(-15px)' }))
      ])
    ])
  ]
})
export class MisDatosPageComponent {

  activatedRoute = inject(ActivatedRoute)
  router = inject(Router)

  emisoresService = inject(EmisoresService)

  get EnumEstatusToast(){
    return EnumEstatusToast;
  }


  misdatosRXResource = rxResource({
    stream: () => {
      return this.emisoresService.getEmisor().pipe(
        catchError( (error) => {
          return of(null)
        })
      )
    },

  })

  /*if( error.status === 404 ){
    return of(null)
  }*/
  refrescarDatos(){
    this.misdatosRXResource.reload()
  }

}

export default MisDatosPageComponent;
