import { ChangeDetectionStrategy, Component, computed, inject, input, OnInit, signal, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Orden } from '@operaciones/interfaces/orden.interface';
import { rxResource } from '@angular/core/rxjs-interop';
import { PageFormHeaderComponent } from "@shared/components/forms/page-form-header/page-form-header.component";
import { PageFormBodyComponent } from "@shared/components/forms/page-form-body/page-form-body.component";
import { ToastService } from '@shared/services/toast.service';
import { BadgeMessageComponent } from "@shared/components/badges/badge-message/badge-message.component";
import { EmisoresService } from '@facturas/services/emisores.service';
import { Emisor } from '@facturas/interfaces/emisor.interface';
import { Cliente } from '@catalogos/interfaces/cliente.interface';
import { ClientesService } from '@catalogos/services/clientes.service';
import { Empresa } from '@catalogos/interfaces/empresa.interface';
import { EmpresasService } from '@catalogos/services/empresas.service';
import flatpickr from 'flatpickr';
import { Spanish } from 'flatpickr/dist/l10n/es';
import { FormErrorLabelComponent } from "@shared/components/forms/form-error-label/form-error-label.component";
import { PageFormControlListComponent } from "@shared/components/forms/page-form-control-list/page-form-control-list.component";
import { FormUtils } from '@shared/utils/form-utils';
import { FacturasService } from '@facturas/services/facturas.service';
import { firstValueFrom } from 'rxjs';
import { SatService } from '@catalogos/services/sat.service';
import { AuthService } from '@auth/services/auth.service';
import { Router } from '@angular/router';
import { EnumEstatusToast, EnumPaginasTitulo, EnumSatMetodoPago, EnumSatTipoComprobante, EnumSatTipoPersona } from '@shared/enums/general-estatus.enum';
import { PlanoConcepto } from '@facturas/interfaces/plano-concepto.interface';
import { CardClienteComponent } from '@catalogos/components/cards/card-cliente/card-cliente.component';
import { CardEmpresaComponent } from '@catalogos/components/cards/card-empresa/card-empresa.component';
import { ProductosServiciosService } from '@catalogos/services/productosServicios.service';

@Component({
  selector: 'app-facturar-orden-details',
  imports: [CommonModule, ReactiveFormsModule, PageFormHeaderComponent, PageFormBodyComponent, BadgeMessageComponent, FormErrorLabelComponent, PageFormControlListComponent, CardClienteComponent, CardEmpresaComponent ],
  templateUrl: './facturar-orden-details.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FacturarOrdenDetailsComponent implements OnInit,  AfterViewInit {

  orden = input.required<Orden | null>();

  @ViewChild('dateInputEmision', { static: false }) dateInputEmision!: ElementRef;

  flatpickrEmisionInstance!: flatpickr.Instance;

  fb = inject(FormBuilder);
  router = inject(Router);

  emisoresService = inject(EmisoresService);
  clientesService = inject(ClientesService);
  empresasService = inject(EmpresasService);
  productosServiciosService = inject(ProductosServiciosService);
  facturasService = inject(FacturasService);
  toastService = inject(ToastService);
  satService = inject(SatService);
  authService = inject(AuthService);

  //readonly ordenEmisor: Signal< Emisor | null> = toSignal( this.emisoresService.getEmisor(), { initialValue: null} )
  emisor = signal<Emisor | null>(null)
  conceptosPlanoSignal = signal<PlanoConcepto[]>([]);

  ordenCliente = signal<Cliente | null>(null)
  ordenEmpresa = signal<Empresa | null>(null);

  receptorSatTipoPersona = signal<EnumSatTipoPersona>(EnumSatTipoPersona.MORAL);

  receptor = computed( () => {
    if( this.receptorSatTipoPersona() === EnumSatTipoPersona.MORAL ){
      return this.ordenEmpresa()
    }else{
      return this.ordenCliente()
    }
  })

  /*emisor = computed( () => {
    return this.ordenEmisor()
  })*/

  facturaForm = this.fb.group({
    fechaEmision: ['', [Validators.required]],
    claveSatFormaPago: ['', [Validators.required]],
    condicionesPago: ['', [Validators.required]],
    claveSatMetodoPago: ['', [Validators.required]],
    lugarExpedicion: ['', [Validators.required ]],
    observaciones: ['Factura desde una Orden', [Validators.maxLength(200)]],
    //claveSatTipoComprobante: ['', [Validators.required]],
  })

  get EnumPaginasTitulo(){
    return EnumPaginasTitulo;
  }

  get EnumSatTipoPersona(){
    return EnumSatTipoPersona;
  }

  get EnumEstatusToast(){
    return EnumEstatusToast;
  }

  receptorObtenerMensajeObjeto = computed( () => {

     if( this.receptor() ){
       if(
             !this.receptor()!.rfc || this.receptor()!.rfc === ''
          || !this.receptor()!.email || this.receptor()!.email === ''
          || !this.receptor()!.razonSocial || this.receptor()!.razonSocial === ''
          || !this.receptor()!.codigoPostal || this.receptor()!.codigoPostal === ''
          || !this.receptor()!.satRegimenFiscal
          || !this.receptor()!.satUsoCFDI
        ){

          if( this.receptorSatTipoPersona()  === EnumSatTipoPersona.FISICA){

            return {
              mensaje: `Es necesario llenar la información fiscal del Cliente.`,
              estatus: EnumEstatusToast.WARNING
            }

          }else{

            return {
              mensaje: `Es necesario llenar la información fiscal de la Empresa con ID ${ this.receptor()?.id.toUpperCase() } .`,
              estatus: EnumEstatusToast.WARNING
            }

          }

        }else{
            return {
              mensaje: ``,
              estatus: EnumEstatusToast.SUCCESS
            }
        }

      }else{

        if( this.receptorSatTipoPersona()  === EnumSatTipoPersona.FISICA){

          return {
            mensaje: `No hay un Cliente asignado a la Orden.`,
            estatus: EnumEstatusToast.WARNING
          }

        }else{

          return {
            mensaje: `No hay una Empresa asignada a la Orden.`,
            estatus: EnumEstatusToast.WARNING
          }

        }

      }

  })

  validarEmisor(){

    if( !this.emisor() ){

      return false

    }

    if (
      !this.emisor()!.codigoPostal ||
      !this.emisor()!.razonSocial ||
      !this.emisor()!.rfc ||
      !this.emisor()!.satRegimenFiscal ||
      !this.emisor()!.validTo
    ){
      return false
    }

    if( this.emisor()!.validTo < new Date() ){
      return false
    }

    return true

  }

  getReceptorValidarCampo( campo: string | undefined | null, fallback: string ){

    if( campo && campo != '' ){
      return campo.toUpperCase()
    }

    return fallback

  }

  ngOnInit(): void {
    if( this.orden() ){

      if( this.orden()!.empresa ){
        this.empresasService.getEmpresa( this.orden()!.empresa!.id ).subscribe( value => {
          this.ordenEmpresa.set( value )
        })
      }

      if( this.orden()!.cliente ){
        this.clientesService.getCliente( this.orden()!.cliente!.id ).subscribe( value => {
          this.ordenCliente.set( value )
        })
      }

      this.emisoresService.getEmisor().subscribe( value => {
        this.emisor.set( value )
        this.facturaForm.patchValue({
          lugarExpedicion: value.codigoPostal
        })
      })

      this.asignarConceptosPlano();

    }

  }

  ngAfterViewInit(): void {
    this.flatpickrEmisionInstance = flatpickr(this.dateInputEmision.nativeElement, {
      dateFormat: 'd-m-Y H:i',
      locale: Spanish,
      enableTime: true,
      defaultDate: new Date(),
      minDate: new Date().setDate( new Date().getDate() - 3 ),
      //minDate: new Date().fp_incr(14) // 14 days from now
      //maxDate: 'today'
      onChange: (selectedDates) => {
        const fecha = selectedDates[0];
        this.facturaForm.controls.fechaEmision.setValue(fecha.toString());
      }

    });

    this.setFormValue()
  }

  asignarConceptosPlano(){

    const conceptosPlano = this.orden()!.conceptos.map( c => ({
        tipoSatTipoProductoServicio: c.productoServicio.satProductoServicio.satTipoProductoServicio.tipo,
        descripcionProductoServicio: c.productoServicio.descripcion,
        cantidad: c.cantidad,
        costoUnitario: c.costoUnitario,
        idProductoServicio: c.productoServicio.id
    }))

    /*
    const conceptosPlano = this.orden().conceptos.map( c => ({
        tipoSatTipoProductoServicio: c.tipo,
        descripcionProductoServicio: c.descripcion,
        cantidad: c.cantidad.toString(),
        costoUnitario: c.costoUnitario.toString(),
        idProductoServicio: c.id_producto_servicio
    }))*/

    this.conceptosPlanoSignal.set( conceptosPlano )
  }

  //private getFechaEmision(){
  //  const
  //}

  setFormValue(){

    //this.facturaForm.patchValue({
    //  fechaEmision: flatpickr.formatDate( new Date(), 'd-m-Y H:i' )
    //})
    this.flatpickrEmisionInstance.setDate( new Date() )
    this.facturaForm.controls.fechaEmision.setValue( new Date().toString() )

  }

  seleccionarReceptor( satTipoPersona: EnumSatTipoPersona ){
    this.receptorSatTipoPersona.set(satTipoPersona)
  }

  async onSubmit(){

    this.facturaForm.markAllAsTouched();

    const isValid = this.facturaForm.valid;

    if(!isValid){
      this.toastService.showToast("Debes capturar la información solicitada", EnumEstatusToast.WARNING)
      return
    }

    /* Validar el RECEPTOR */
    if(this.receptorObtenerMensajeObjeto().estatus != EnumEstatusToast.SUCCESS ){
      this.toastService.showToast(this.receptorObtenerMensajeObjeto().mensaje, EnumEstatusToast.WARNING)
      return
    }

    //const fechaEmision = FormUtils.formatLocalDisplayToISOString( this.facturaForm.value.fechaEmision!, this.authService.user()!.zonaHoraria.clave )

    const fechaEmision = this.facturaForm.controls.fechaEmision.value;

    const facturaNew = {
      //fechaEmision: fechaEmision,
      fechaEmision: FormUtils.fechaToUtcFromLocal( new Date( fechaEmision! ), this.authService.user()!.zonaHoraria!.clave ),
      claveSatTipoComprobante: EnumSatTipoComprobante.INGRESO, // this.facturaForm.value.claveSatTipoComprobante,
      claveSatFormaPago: this.facturaForm.value.claveSatFormaPago,
      claveSatMetodoPago: this.facturaForm.value.claveSatMetodoPago,
      condicionesPago: this.facturaForm.value.condicionesPago,
      lugarExpedicion: this.facturaForm.value.lugarExpedicion,
      observaciones: this.facturaForm.value.observaciones,
      receptorClaveSatTipoPersona: this.receptorSatTipoPersona(),
      id_orden: this.orden()?.id,
      /*emisor: {
        rfc: this.emisor()?.rfc,
        razon_social: this.emisor()?.razonSocial,
        //uso_cfdi: this.ordenEmisor()?. "G03",
        regimen_fiscal: this.emisor()?.satRegimenFiscal.clave,
        codigo_postal: this.emisor()?.codigoPostal
      },*/
      /*receptor: {
        rfc: this.receptor()?.rfc,
        razon_social: this.receptor()?.razonSocial,
        uso_cfdi: this.receptor()?.satUsoCFDI.clave,
        regimen_fiscal: this.receptor()?.satRegimenFiscal.clave,
        codigo_postal: this.receptor()?.codigoPostal
      },*/

    }

    try{

      const respuesta = await firstValueFrom(
        //this.facturasService.test( facturaNew )
        //TODO
        this.facturasService.createFactura( facturaNew )
      )

      //this.toastService.showToast(`Las fechas son: ${ JSON.stringify( respuesta, null, 3 ) }`)

      this.toastService.showToast(`Se emitió correctamente la nueva factura con Id: ${ respuesta.id.toUpperCase() }`)




      this.router.navigate(['/operaciones/ordenes/'])


    }catch(error: any){
      this.toastService.showToastErrors(error)
    }

    return

  }

  optionSelectedMetodoPago(optionClave: string){

    this.facturaForm.patchValue({
      claveSatMetodoPago: optionClave,
      claveSatFormaPago: optionClave === EnumSatMetodoPago.PUE_PAGO_EN_UNA_SOLA_EXHIBICION ? "28" : "99",
      condicionesPago: optionClave === EnumSatMetodoPago.PUE_PAGO_EN_UNA_SOLA_EXHIBICION ? "Contado" : "Crédito por 30 días"
    })

  }

  optionSelectedFormaPago(optionClave: string){

    this.facturaForm.patchValue({
      claveSatFormaPago: optionClave
    })

  }

  /*
  optionSelectedTipoComprobante(optionClave: string){

    this.facturaForm.patchValue({
      claveSatTipoComprobante: optionClave
    })

  }*/

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

  satMetodosPagosRXResource = rxResource({

    params: () => ({page: 1, limit: 24, filtro: '' }),
    stream: ({params}) => {
      return this.satService.getSatMetodosPagos({
        page: params.page,
        limit: params.limit,
        filtro: params.filtro
      })

    }
  })

  /*
  satTiposComprobantesRXResource = rxResource({
    params: () => ({page: 1, limit: 24, filtro: '' }),
    stream: ({params}) => {
      return this.satService.getSatTiposComprobantes({
        page: params.page,
        limit: params.limit,
        filtro: params.filtro
      })
    }
  })*/

 }
