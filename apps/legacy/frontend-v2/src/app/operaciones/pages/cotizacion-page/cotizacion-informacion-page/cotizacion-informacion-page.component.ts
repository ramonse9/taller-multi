import { CardComponentDescriptionComponent } from '../../../../catalogos/components/cards/card-component-description/card-component-description.component';
import { CommonModule } from '@angular/common';
import { Component, inject, input, linkedSignal } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '@auth/services/auth.service';
import { NgIcon } from '@ng-icons/core';
import { CotizacionConcepto } from '@operaciones/interfaces/cotizacion-concepto.interface';
import { Cotizacion } from '@operaciones/interfaces/cotizacion.interface';
import { CompaniasService } from '@catalogos/services/companias.service';
import { OrdenesService } from '@operaciones/services/ordenes.service';
import { EnumEstatusToast } from '@shared/enums/general-estatus.enum';
import { ToastService } from '@shared/services/toast.service';
import { FormUtils } from '@shared/utils/form-utils';

import pdfMake from 'pdfmake/build/pdfmake';
import * as pdfFonts from 'pdfmake/build/vfs_fonts';

const vfs = (pdfFonts as any).pdfMake?.vfs || (pdfFonts as any).vfs;
Object.defineProperty(pdfMake, 'vfs', {
  value: vfs,
  writable: true,
  enumerable: true,
  configurable: true
});

@Component({
  selector: 'app-cotizacion-informacion-page',
  imports: [CommonModule, RouterLink, NgIcon, CardComponentDescriptionComponent,],
  templateUrl: './cotizacion-informacion-page.component.html',
})
export class CotizacionInformacionPageComponent {

  cotizacion = input.required<Cotizacion>();

  cotizacionLinked = linkedSignal( () => this.cotizacion() )

  imagenSeleccionada: string | null = null;

  ordenesService = inject(OrdenesService)
  router = inject(Router)
  authService = inject(AuthService);
  companiasService = inject(CompaniasService);
  toastService = inject(ToastService);

  get subtotalCotizacion(){
    return this.cotizacion().conceptos.reduce( (acumulador: number , concepto: CotizacionConcepto) => {
      return acumulador + ( concepto.cantidad * concepto.costoUnitario)
    }, 0)
  }

  get nombreCompleto(){
    return !this.cotizacion().cliente ? '' : this.cotizacion().cliente?.nombre
  }

  get EnumEstatusToast(){
    return EnumEstatusToast;
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

  crearNuevaOrdenDesdeCotizacion(){

    //TODO
    //cargar la cotizacion en la nueva orden y cargar los controles

    //this.ordenesService.vehiculoSeleccionado = this.cotizacion().vehiculo;
    //this.ordenesService.clienteSeleccionado = this.cotizacion().cliente;
    //this.ordenesService.empresaSeleccionado = this.cotizacion().empresa;
    //this.ordenesService.descripcionSeleccionado = this.cotizacion().descripcion;

    this.ordenesService.cotizacionIdSeleccionado = this.cotizacion().id;

    /*const conceptosParaOrden: OrdenConcepto[] = this.cotizacion().conceptos.map( (concepto) => {

      return {
        id: concepto.id,
        productoServicio: concepto.productoServicio,
        cantidad: concepto.cantidad,
        costoUnitario: concepto.costoUnitario
      }
    })

    this.ordenesService.conceptosSeleccionado = conceptosParaOrden;;*/

    setTimeout( () => {
      this.router.navigate(['/operaciones/ordenes/new'])
    }, 200)

  }

  async generarYCompartir( cotizacion: Cotizacion) {

    const compania = this.companiaRXResource.value();

    let nombreCompleto;
    let correoElectronico;
    let telefono;

    if( cotizacion.cliente ){
      nombreCompleto = cotizacion.cliente.nombre;
      correoElectronico = cotizacion.cliente.email;
      telefono = cotizacion.cliente.telefono;
    }else{
      nombreCompleto = `${cotizacion.empresa?.nombre}`;
      correoElectronico = cotizacion.empresa?.email;
      telefono = cotizacion.empresa?.telefono;
    }

    /*const data = {
      id: 'COT000001',
      cliente: {
        nombre: 'Ramon Guzman',
        email: 'ramon.guzman@example.com'
      },
      fecha: '2024-06-15',
      fechaVencimiento: '2024-06-30',
      items: [
        { nombre: 'Producto A', cantidad: 2, precio: 50, descripcion: 'Descripción del producto A' },
        { nombre: 'Producto B', cantidad: 1, precio: 100, descripcion: 'Descripción del producto B' },
      ],
      subtotal: 200,
      iva: 38,
      total: 238
    }*/

    const cotizacionFechaCreacion = FormUtils.dateFormatCustomyyyymmdd( new Date(cotizacion.createdAt) )
    const cotizacionFechaVencimiento = FormUtils.dateFormatCustomyyyymmdd( FormUtils.addDays( new Date(cotizacion.createdAt) , 10 ) )

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

    /*
    const documentDefinition2: any = {
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
                { text: 'COTIZAR A:', style: 'sectionHeader' },
                { text: nombreCompleto, bold: true },
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
                concepto.descripcion,
                { text: concepto.cantidad, alignment: 'center' },
                { text: `$${concepto.precio.toLocaleString()}`, alignment: 'right' },
                { text: `$${(concepto.cantidad * concepto.precio).toLocaleString()}`, alignment: 'right', bold: true }
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
          text: 'Esta cotización tiene una validez de 10 días. Los precios no incluyen costos de envío a menos que se especifique lo contrario. El pago debe realizarse mediante transferencia bancaria.',
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
    */

    /*const documentDefinition: any = {
      content: [
        { text: 'Taller Mecánico Ramón', style: 'header' },
        'Orden de Servicio #001',
        'Total: $1,200.00'
      ],
      styles: {
        header: { fontSize: 18, bold: true }
      }
    };*/

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


  }

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

