import { inject, Injectable } from '@angular/core';
import { C_CONCEPTOS_SERVICIOS } from '@catalogos/catalogos-factura';
import { AuthService } from '../../auth/services/auth.service';

@Injectable({
  providedIn: 'root'
})
export class ConceptosService {

  private authService = inject( AuthService )

  private cConceptosServicios = C_CONCEPTOS_SERVICIOS

  constructor() { }

}
