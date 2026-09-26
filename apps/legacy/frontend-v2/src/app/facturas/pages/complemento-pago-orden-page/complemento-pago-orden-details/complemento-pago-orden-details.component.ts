import { ChangeDetectionStrategy, Component, ElementRef, inject, input, OnInit, signal, ViewChild } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Factura } from '@facturas/interfaces/factura.interface';
import { PageFormHeaderComponent } from "@shared/components/forms/page-form-header/page-form-header.component";
import { PageFormBodyComponent } from "@shared/components/forms/page-form-body/page-form-body.component";
import { CommonModule } from '@angular/common';
import { PageFormControlListComponent } from "@shared/components/forms/page-form-control-list/page-form-control-list.component";
import { FormErrorLabelComponent } from "@shared/components/forms/form-error-label/form-error-label.component";
import { rxResource } from '@angular/core/rxjs-interop';
import { SatService } from '@catalogos/services/sat.service';

import flatpickr from 'flatpickr';
import { Spanish } from 'flatpickr/dist/l10n/es';
import { EmisoresService } from '@facturas/services/emisores.service';
import { Emisor } from '@facturas/interfaces/emisor.interface';
import { PagosReadOnlyTableComponent } from "@facturas/components/tables/pagos-read-only-table/pagos-read-only-table.component";
import { ToastService } from '@shared/services/toast.service';
import { FormUtils } from '@shared/utils/form-utils';
import { firstValueFrom } from 'rxjs';
import { FacturasService } from '@facturas/services/facturas.service';
import { AuthService } from '@auth/services/auth.service';
import { Router } from '@angular/router';
import { EnumEstatusToast, EnumPaginasTitulo, EnumSatTipoComprobante, EnumSatTipoPersona } from '@shared/enums/general-estatus.enum';
import { FacturasSinLiquidarTableComponent } from "@facturas/components/tables/facturas-sin-liquidar-table/facturas-sin-liquidar-table.component";

@Component({
  selector: 'app-complemento-pago-orden-details',
  imports: [PageFormHeaderComponent, PageFormBodyComponent, ReactiveFormsModule, CommonModule, PageFormControlListComponent, FormErrorLabelComponent, PagosReadOnlyTableComponent, FacturasSinLiquidarTableComponent ],
  templateUrl: './complemento-pago-orden-details.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ComplementoPagoOrdenDetailsComponent implements OnInit {

  //orden = input.required<Orden>();
  factura = input.required<Factura>();

  @ViewChild('dateInputEmision', { static: false }) dateInputEmision!: ElementRef;
  @ViewChild('dateInputPago', { static: false }) dateInputPago!: ElementRef;

  fb = inject(FormBuilder);

  emisoresService = inject(EmisoresService);
  satService = inject(SatService);
  toastService = inject(ToastService);
  facturasService = inject(FacturasService);
  authService = inject(AuthService);
  router = inject(Router);

  emisor = signal<Emisor | null>(null)
  //TODO
  pagos = signal<any>([])
  pagoIndividual = signal<boolean>(true);
  facturasSinLiquidar = signal<any>([]);
  idsFacturasSinLiquidarListado: string[] = [];

  complementoPagoForm = this.fb.group({

    fechaEmision: ['', [Validators.required]],
    fechaPago: ['', [Validators.required]],
    claveSatFormaPago: ['', [Validators.required]],
    observaciones: ['Complemento de Pago desde una Orden', [Validators.maxLength(200)]],
    //claveSatTipoComprobante: ['', [Validators.required]],
    monto: [ '', [Validators.required]],
    //facturas: this.fb.array<FormGroup>([])
  });

  get EnumPaginasTitulo(){
    return EnumPaginasTitulo;
  }

  get EnumSatTipoPersona(){
    return EnumSatTipoPersona;
  }

  //get facturasFormArray(): FormArray<FormGroup>{
  //  return this.complementoPagoForm.get('facturas') as FormArray
  //}

  async ngOnInit() {

    if( this.factura() ){

      this.cargarPagos();

    }

  }

  ngAfterViewInit(): void {
      flatpickr(this.dateInputEmision.nativeElement, {
        dateFormat: 'd-m-Y H:i',
        locale: Spanish,
        enableTime: true,
        defaultDate: new Date(),
        minDate: new Date().setDate( new Date().getDate() - 3 )
        //minDate: new Date().fp_incr(14) // 14 days from now
        //maxDate: 'today'

      });

      flatpickr(this.dateInputPago.nativeElement, {
        dateFormat: 'd-m-Y H:i',
        locale: Spanish,
        enableTime: true,
        defaultDate: new Date(),
        minDate: new Date().setDate( new Date().getDate() - 3 )
        //minDate: new Date().fp_incr(14) // 14 days from now
        //maxDate: 'today'

      });

      this.setFormValue()
  }


  async cargarPagos(){

    const respuestaPagos = await firstValueFrom(
      this.facturasService.getPagos( this.factura().id )
    )

    this.pagos.set( respuestaPagos )

  }

  setFormValue(){

    this.complementoPagoForm.patchValue({
      fechaEmision: flatpickr.formatDate( new Date(), 'd-m-Y H:i' ),
      fechaPago: flatpickr.formatDate( new Date(), 'd-m-Y H:i' )
    })
  }

  async onSubmit(){

    this.complementoPagoForm.markAllAsTouched();

    const isValid = this.complementoPagoForm.valid;

    if(!isValid){
      this.toastService.showToast("Debes capturar la información solicitada", EnumEstatusToast.WARNING)
      return
    }

    const fechaPago = FormUtils.formatLocalDisplayToISOString( this.complementoPagoForm.value.fechaPago!, this.authService.user()!.zonaHoraria.clave )
    const fechaEmision = FormUtils.formatLocalDisplayToISOString( this.complementoPagoForm.value.fechaEmision!, this.authService.user()!.zonaHoraria.clave )

    const monto = this.pagoIndividual() == true ? this.complementoPagoForm.value.monto : this.complementoPagoForm.getRawValue().monto;

    const complementoNew = {
      fechaEmision: fechaEmision,
      fechaPago: fechaPago,
      monto: monto,
      observaciones: this.complementoPagoForm.value.observaciones,
      claveSatTipoComprobante: EnumSatTipoComprobante.PAGO, // this.complementoPagoForm.value.claveSatTipoComprobante,
      claveSatFormaPago: this.complementoPagoForm.value.claveSatFormaPago,
      id_factura: this.factura().id,
      pagoIndividual: this.pagoIndividual(),
      idFacturas: this.idsFacturasSinLiquidarListado
    }

    try{

      const respuesta = await firstValueFrom(
        this.facturasService.createComplemento( complementoNew )
      )

      this.toastService.showToast(`Se emitió correctamente el nuevo complemento de pago con Id: ${ respuesta.id.toUpperCase() }`)

      this.complementoPagoForm.patchValue({
        monto: '',
        claveSatFormaPago: ''
      })

      const respuestaPagos = await firstValueFrom(
        this.facturasService.getPagos( this.factura().id )
      )

      this.pagos.set( respuestaPagos );

      const respuestaFacturasSinLiquidar = await firstValueFrom(
        this.facturasService.getFacturasSinLiquidar( this.factura().receptorRFC )
      )

      this.facturasSinLiquidar.set( respuestaFacturasSinLiquidar );

    }catch(error: any){

      this.toastService.showToastErrors(error)

    }

    return

    //"La fecha de emisión debe estar en el mismo mes que la fecha del pago. Verifica que ambas estén dentro de octubre 2025."

    //el complemento de pago no debe tener fecha anterior a la factura


  }

  /*
  optionSelectedTipoComprobante(optionClave: string){
    this.complementoPagoForm.patchValue({
      claveSatTipoComprobante: optionClave,
      claveSatFormaPago: "03",
    })
  }*/

  optionSelectedFormaPago(optionClave: string){

    this.complementoPagoForm.patchValue({
      claveSatFormaPago: optionClave
    })

  }

  satFormasPagosRXResource = rxResource({

    params: () => ({page: 1, limit: 24, filtro: '' }),
    stream: ({params}) => {
      return this.satService.getSatFormasPagos({
        page: params.page,
        limit: params.limit,
        filtro: params.filtro
      })

    }
  })

  async setPagoIndividual( value: boolean){

    this.pagoIndividual.set( value );

    this.complementoPagoForm.get('monto')?.reset('0');

    if( value == false ){
      await this.cargarFacturasSinLiquidar();
      this.complementoPagoForm.get('monto')?.disable();
    }else{
      this.complementoPagoForm.get('monto')?.enable();
    }

  }

  async cargarFacturasSinLiquidar(){

    const respuestaFacturasSinLiquidar = await firstValueFrom(
      this.facturasService.getFacturasSinLiquidar( this.factura().receptorRFC )
    )

    this.facturasSinLiquidar.set( respuestaFacturasSinLiquidar )

  }

  facturasSinLiquidarEmit(facturasEmitidas: string[]){

    const idsSet = new Set(facturasEmitidas);

    this.idsFacturasSinLiquidarListado = Array.from( idsSet );

    const montoFacturasEmitidas: number = this.facturasSinLiquidar()
          .filter( (fSL: any) => idsSet.has(fSL.id))
          .reduce((acc: number, fSL:any) => acc + Number( fSL.total ), 0);

    this.complementoPagoForm.get('monto')?.setValue(montoFacturasEmitidas.toString());

  }

}
