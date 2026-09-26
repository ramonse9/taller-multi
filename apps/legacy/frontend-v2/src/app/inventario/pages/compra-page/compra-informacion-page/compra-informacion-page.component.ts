import { CommonModule } from '@angular/common';
import { Component, inject, input, linkedSignal, signal } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '@auth/services/auth.service';
import { NgIcon } from '@ng-icons/core';
import { CompaniasService } from '@catalogos/services/companias.service';
import { OrdenesService } from '@operaciones/services/ordenes.service';
import { EnumCategoria, EnumEstatusCompra, EnumEstatusToast } from '@shared/enums/general-estatus.enum';
import { ToastService } from '@shared/services/toast.service';
import pdfMake from 'pdfmake/build/pdfmake';
import * as pdfFonts from 'pdfmake/build/vfs_fonts';
import { EstatusBadgeComponent } from "@shared/components/estatus-badge/estatus-badge.component";
import { ModalCompraEstatusUpdateComponent } from '../../../components/modals/modal-compra-estatus-update/modal-compra-estatus-update.component';
import { CompraDetalleLite, CompraLite } from '@inventario/interfaces/compra.interface';

const vfs = (pdfFonts as any).pdfMake?.vfs || (pdfFonts as any).vfs;
Object.defineProperty(pdfMake, 'vfs', {
  value: vfs,
  writable: true,
  enumerable: true,
  configurable: true
});

@Component({
  selector: 'app-compra-informacion-page',
  imports: [CommonModule, RouterLink, NgIcon, EstatusBadgeComponent, ModalCompraEstatusUpdateComponent],
  templateUrl: './compra-informacion-page.component.html',
})
export class CompraInformacionPageComponent {

  compra = input.required<CompraLite>();

  compraLinked = linkedSignal( () => this.compra() )

  imagenSeleccionada: string | null = null;

  modalOpen = signal(false);
  nuevoEstatus = signal<EnumEstatusCompra>(EnumEstatusCompra.CONFIRMADA);

  ordenesService = inject(OrdenesService)
  router = inject(Router)
  authService = inject(AuthService);
  companiasService = inject(CompaniasService);
  toastService = inject(ToastService);

  get subtotalCotizacion(){
    return this.compra().detalles.reduce( (acumulador: number , concepto: CompraDetalleLite) => {
      return acumulador + ( concepto.cantidad * concepto.costoUnitario)
    }, 0)
  }

  /*get nombreCompleto(){
    return !this.compra().cliente ? '' : this.cotizacion().cliente?.nombre
  }*/

  get EnumEstatusToast(){
    return EnumEstatusToast;
  }

  get EnumCategoria(){
    return EnumCategoria;
  }

  get EnumEstatusCompra(){
    return EnumEstatusCompra;
  }

  sumaRestaImpuestos(impuestos: any){

    let cantidad = 0;
    impuestos.forEach( (i :any) => {
      if( i.tipo == 'Traslado'){
        cantidad += Number( i.importe )
      }else{
        cantidad -= Number( i.importe )
      }
    })

    return cantidad;

  }

  /*abrirModal(){
    this.modalOpen.set(true);
  }*/

  cerrarModal( nuevoEstatus?: EnumEstatusCompra | void){
    if( nuevoEstatus ){

      this.compraLinked.update( compra => ({
        ...compra,
        estatus: nuevoEstatus
      }))

    }

    this.modalOpen.set(false);

  }

  onCancelarCompra(){
    this.nuevoEstatus.set( EnumEstatusCompra.CANCELADA );
    this.modalOpen.set(true);
  }

  onConfirmarCompra(){
    this.nuevoEstatus.set( EnumEstatusCompra.CONFIRMADA );
    this.modalOpen.set(true);

  }

  /*
  async generarYCompartir( compra: Compra) {

    const compania = this.companiaRXResource.value();

    let nombreCompleto;
    let correoElectronico;
    let telefono;



    //const cotizacionFechaCreacion = FormUtils.dateFormatCustomyyyymmdd( new Date(cotizacion.createdAt) )
    //const cotizacionFechaVencimiento = FormUtils.dateFormatCustomyyyymmdd( FormUtils.addDays( new Date(cotizacion.createdAt) , 10 ) )

     const documentDefinition: any = {
      // Configuración de página
      pageSize: 'A4',
      pageMargins: [40, 60, 40, 60],

      // Pie de página con numeración
      footer: (currentPage: number, pageCount: number) => {
        return {
          text: `Página ${currentPage} de ${pageCount}`,
          alignment: 'center',
          fontSize: 8,
          margin: [0, 20, 0, 0],
          color: '#6b7280'
        };
      },

      content: [
        // ENCABEZADO: Logo y Datos fiscales
        {
          columns: [
            {
              stack: [
                { text: `${compania!.nombre.toUpperCase()}`, style: 'companyTitle' },
                { text: `Calle ${compania?.companiaInfo?.calle} #${compania?.companiaInfo?.numeroLocal}`, fontSize: 10 },
                { text: `${compania!.companiaInfo?.colonia}, ${compania?.companiaInfo?.ciudad}`, fontSize: 10 },
                { text: `${compania!.companiaInfo?.telefono}`, fontSize: 10 },
              ],
              alignment: 'right'
            }
          ]
        },

        { canvas: [{ type: 'line', x1: 0, y1: 5, x2: 515, y2: 5, lineWidth: 1, lineColor: '#e5e7eb' }] },

        // INFO DEL CLIENTE Y COTIZACIÓN
        {
          margin: [0, 20, 0, 20],
          columns: [
            {
              stack: [
                { text: 'COTIZACIÓN PARA:', style: 'sectionHeader' },
                { text: nombreCompleto.toUpperCase(), bold: true },
                { text: correoElectronico },
                { text: telefono },
              ]
            },
            {
              stack: [
                { text: `Cotización #: ${cotizacion.id.toUpperCase()}`, alignment: 'right', bold: true },
                { text: `Fecha: ${cotizacionFechaCreacion}`, alignment: 'right' },
                { text: `Vence: ${cotizacionFechaVencimiento}`, alignment: 'right', color: 'red' },
              ]
            }
          ]
        },

        // TABLA DE PRODUCTOS
        {
          style: 'tableExample',
          table: {
            headerRows: 1,
            widths: ['*', 'auto', 'auto', 'auto'],
            body: [
              [
                { text: 'Concepto', style: 'tableHeader' },
                { text: 'Cant.', style: 'tableHeader' },
                { text: 'Precio Unit.', style: 'tableHeader' },
                { text: 'Subtotal', style: 'tableHeader' }
              ],
              ...cotizacion.conceptos.map((concepto: any) => [
                concepto.productoServicio.descripcion,
                { text: concepto.cantidad, alignment: 'center' },
                { text: `$${concepto.costoUnitario.toLocaleString()}`, alignment: 'right' },
                { text: `$${(concepto.cantidad * concepto.costoUnitario).toLocaleString()}`, alignment: 'right', bold: true }
              ])
            ]
          },
          layout: {
            hLineWidth: (i: number, node: any) => (i === 0 || i === node.table.body.length) ? 0 : 1,
            vLineWidth: () => 0,
            hLineColor: () => '#f3f4f6',
            paddingLeft: () => 8,
            paddingRight: () => 8,
            paddingTop: () => 8,
            paddingBottom: () => 8,
          }
        },

        // TOTALES
        {
          columns: [
            { width: '*', text: '' },
            {
              width: 150,
              table: {
                widths: ['*', 'auto'],
                body: [
                  //['Subtotal:', { text: `$${data.subtotal.toLocaleString()}`, alignment: 'right' }],
                  //['IVA (19%):', { text: `$${data.iva.toLocaleString()}`, alignment: 'right' }],
                  //[{ text: 'TOTAL:', bold: true, fontSize: 14 }, { text: `$${data.total.toLocaleString()}`, alignment: 'right', bold: true, fontSize: 14, color: '#3b82f6' }],
                  [{ text: 'SUBTOTAL:', bold: true, fontSize: 14 }, { text: `$${this.subtotalCotizacion.toLocaleString()}`, alignment: 'right', bold: true, fontSize: 14, color: '#3b82f6' }]
                ]
              },
              layout: 'noBorders'
            }
          ]
        },

        // TÉRMINOS Y CONDICIONES
        {
          text: 'Términos y Condiciones',
          style: 'sectionHeader',
          margin: [0, 40, 0, 5]
        },
        {
          text: 'Esta cotización tiene una validez de 15 días. Los precios no incluyen costos de envío a menos que se especifique lo contrario. El pago debe realizarse mediante transferencia bancaria ó efectivo.',
          fontSize: 9,
          color: '#4b5563'
        }
      ],

      styles: {
        companyTitle: { fontSize: 18, bold: true, color: '#1e3a8a' },
        sectionHeader: { fontSize: 10, bold: true, color: '#374151', margin: [0, 0, 0, 3] },
        tableHeader: {
          bold: true,
          fontSize: 11,
          color: 'white',
          fillColor: '#3b82f6',
          margin: [0, 5, 0, 5]
        },
        tableExample: { margin: [0, 5, 0, 15] }
      }
    };

    const blob: Blob = await pdfMake
    .createPdf(documentDefinition)
    .getBlob();

    const file = new File([blob], `cotizacion-${cotizacion.id.toUpperCase()}.pdf`, {
      type: 'application/pdf'
    });

    if (navigator.canShare && navigator.canShare({ files: [file] })) {
      await navigator.share({
        title: 'Cotización de Servicio',
        text: 'Aquí está tu cotización de servicio',
        files: [file]
      });
    } else {
      alert('Tu navegador no soporta compartir archivos');
    }

  }*/

  generatePDF(data: any) {
    const documentDefinition: any = {
      content: [
        { text: 'COTIZACIÓN', style: 'header' },
        { text: `Fecha: ${new Date().toLocaleDateString()}`, alignment: 'right' },

        { text: 'Cliente:', style: 'subheader' },
        { text: data.clienteNombre },

        {
          style: 'tableExample',
          table: {
            widths: ['*', 100, 100],
            body: [
              [{ text: 'Producto', fillBy: '#3b82f6', color: 'white' }, 'Cant.', 'Precio'],
              ...data.productos.map( (p: any) => [p.nombre, p.cantidad, `$${p.precio}`]),
              ['', 'TOTAL', { text: `$${data.total}`, bold: true }]
            ]
          },
          layout: 'lightHorizontalLines'
        }
      ],
      styles: {
        header: { fontSize: 22, bold: true, margin: [0, 0, 0, 10] },
        subheader: { fontSize: 16, bold: true, margin: [0, 10, 0, 5] },
        tableExample: { margin: [0, 15, 0, 15] }
      }
    };

    pdfMake.createPdf(documentDefinition).download('cotizacion.pdf');
  }

  companiaRXResource = rxResource({
    params: () => ({id: this.authService.user()!.compania.id}),
    stream: ({params}) => {
      return this.companiasService.getCompania( params.id )
    }
  })

}

