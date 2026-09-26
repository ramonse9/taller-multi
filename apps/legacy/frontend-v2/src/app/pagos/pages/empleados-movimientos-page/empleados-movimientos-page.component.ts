import { ChangeDetectionStrategy, Component, computed, inject, OnInit, signal } from '@angular/core';
import { Router } from '@angular/router';
import { rxResource } from '@angular/core/rxjs-interop';
import { PaginationService } from '@shared/components/pagination/pagination.service';
import { firstValueFrom, of } from 'rxjs';
import { trigger, transition, style, animate } from '@angular/animations';
import { CommonModule } from '@angular/common';
import * as ExcelJS from 'exceljs';
//import saveAs from 'file-saver';
import * as saveAs from 'file-saver';
import { NominaService } from '../../services/nomina.service';
import { NominaPeriodoTotal } from '../../interfaces/periodos-movimientos-totales-response.interface';
import { EnumCeroRegistros, EnumEstatusToast } from '@shared/enums/general-estatus.enum';
import { ToastService } from '@shared/services/toast.service';
import { format } from 'date-fns';
import { NgIcon } from '@ng-icons/core';
import { PageButtonInicioComponent } from '@shared/components/forms/page-button-inicio/page-button-inicio.component';
import { CardsContainerComponent } from "@shared/components/cards/cards-container/cards-container.component";
import { BadgeMessageComponent } from "@shared/components/badges/badge-message/badge-message.component";
import { CardEmpleadoConMovimientoNewComponent } from "../../components/cards/card-empleado-con-movimiento-new/card-empleado-con-movimiento-new.component";

@Component({
  selector: 'app-empleados-movimientos-page',
  imports: [CommonModule, NgIcon, PageButtonInicioComponent, CardsContainerComponent, BadgeMessageComponent, CardEmpleadoConMovimientoNewComponent],
  templateUrl: './empleados-movimientos-page.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  animations: [
    trigger('fadeAnimation', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateX(15px)', position: 'absolute', width: '100%' }),
        animate('400ms ease-out', style({ opacity: 1, transform: 'translateX(0)' }))
      ]),
      transition(':leave', [
        style({position: 'absolute', width: '100%'}),
        animate('400ms ease-in', style({ opacity: 0, transform: 'translateX(-15px)' }))
      ])
    ])
  ]
})
export class EmpleadosMovimientosPageComponent {

  mesSeleccionado = signal<number>(new Date().getMonth() + 1); // 1-12
  anioSeleccionado = signal<number>(new Date().getFullYear());

  periodoSeleccionado = signal<NominaPeriodoTotal | null>( null );

  meses = [
    { valor: 1, nombre: 'Enero' },
    { valor: 2, nombre: 'Febrero' },
    { valor: 3, nombre: 'Marzo' },
    { valor: 4, nombre: 'Abril' },
    { valor: 5, nombre: 'Mayo' },
    { valor: 6, nombre: 'Junio' },
    { valor: 7, nombre: 'Julio' },
    { valor: 8, nombre: 'Agosto' },
    { valor: 9, nombre: 'Septiembre' },
    { valor: 10, nombre: 'Octubre' },
    { valor: 11, nombre: 'Noviembre' },
    { valor: 12, nombre: 'Diciembre' }
  ];

  get EnumCeroRegistros(){
    return EnumCeroRegistros
  }

  anios = computed(() => {
    const anioActual = new Date().getFullYear();
    return Array.from(
      { length: 7 },
      (_, i) => anioActual - i
    );
  });

  totalNomina = computed(() => {
    return this.mesPeriodosTotalesRXResource.value()?.granTotalMes.neto ?? 0;
  });

  nominaPeriodosListado = computed( () => {
    return this.mesPeriodosTotalesRXResource.value()?.nominaPeriodos
  })

  empleadosConMovimientos = computed( () => {
    return this.empleadosConMovimientosRXResource.value()?.empleadosConMovimientos
  })

  nominaService = inject( NominaService )
  paginationService = inject( PaginationService )
  router = inject(Router)
  toastService = inject(ToastService)

  itemsPerPage = signal(6);
  textoFiltrar = signal('');

  refreshDate = signal( new Date());

  soloCards = signal( true );

  mostrarCards(mostrar: boolean){
    this.soloCards.set( mostrar );
  }

  selectPerPageChange( itemsPerPage: number){

    this.itemsPerPage.set( itemsPerPage )

    this.router.navigate(['/pagos/gastos'], {
      queryParams: { page: 1}
    })
  }

  async seleccionarPeriodo(periodo: NominaPeriodoTotal ){

    this.periodoSeleccionado.set( periodo )

  }

  async generarExcel(){

    const idsPeriodos = this.nominaPeriodosListado()?.map( p => p.id )

    if( !idsPeriodos || idsPeriodos.length === 0 ){
      this.toastService.showToast(`No hay un listado de periodos`, EnumEstatusToast.WARNING)
      return
    }

    try{

      const resultado = await firstValueFrom(
        this.nominaService.getNominaPeriodosMovimientos(idsPeriodos)
      );

      if (resultado) {
        this.exportToExcel(resultado);
      }

    }catch(error){
      this.toastService.showToast('Error al generar el reporte de Excel', EnumEstatusToast.DANGER)
    }

  }

  cambiarMes(event: Event) {
    const valor = (event.target as HTMLSelectElement).value;
    this.mesSeleccionado.set(Number(valor));
  }

  cambiarAnio(event: Event) {
    const valor = (event.target as HTMLSelectElement).value;
    this.anioSeleccionado.set(Number(valor));
  }

  mesAnterior() {
    let nuevoMes = this.mesSeleccionado() - 1;
    let nuevoAnio = this.anioSeleccionado();

    if (nuevoMes === 0) {
      nuevoMes = 12;
      nuevoAnio = nuevoAnio - 1;
    }

    this.actualizarFecha(nuevoMes, nuevoAnio);
  }

  mesSiguiente() {
    let nuevoMes = this.mesSeleccionado() + 1;
    let nuevoAnio = this.anioSeleccionado();

    if (nuevoMes === 13) {
      nuevoMes = 1;
      nuevoAnio = nuevoAnio + 1;
    }

    this.actualizarFecha(nuevoMes, nuevoAnio);
  }

  private actualizarFecha(mes: number, anio: number) {
    this.mesSeleccionado.set(mes);
    this.anioSeleccionado.set(anio);
  }

  irAlMesActual() {
    const fechaActual = new Date();
    this.actualizarFecha(
      fechaActual.getMonth() + 1,
      fechaActual.getFullYear()
    );
  }

  mesPeriodosTotalesRXResource = rxResource({
    params: () => ({
      mes: this.mesSeleccionado(),
      anio: this.anioSeleccionado()
    }),
    stream: ({params}) => {
      return this.nominaService.getNominaPeriodosMovimientosTotales(
        params.mes,
        params.anio
      )
    }
  })

  empleadosConMovimientosRXResource = rxResource({
    params: () => ( {periodo: this.periodoSeleccionado() }),
    stream: ({params}) => {

      if( params.periodo == null) return of(null)

      return this.nominaService.getNominaPeriodoMovimientos(
        params.periodo.id,
      )
    }
  })

  exportToExcel(dataReporte: any) {

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Reporte de Nómina');

    // 1. CONFIGURACIÓN DE TÍTULOS (Basado en tu estilo)
    worksheet.mergeCells('A1:E1');
    const titleRow = worksheet.getRow(1);
    titleRow.getCell(1).value = 'Reporte de Nómina por Periodos';
    titleRow.getCell(1).font = { size: 16, bold: true };
    titleRow.getCell(1).alignment = { vertical: 'middle', horizontal: 'center' };

    worksheet.mergeCells('A2:E2');
    worksheet.getCell('A2').value = `Resumen Comparativo de ${dataReporte.periodos.length} Periodos`;
    worksheet.getCell('A2').alignment = { horizontal: 'center' };

    worksheet.getCell('A4').value = `Fecha del reporte: ${format(new Date(), 'dd/MM/yyyy HH:mm')}`;
    worksheet.getCell('A4').font = { italic: true };

    // Llevaremos el control de las filas para las fórmulas de suma total
    let currentRow = 6;
    const celdasTotalesPeriodos: string[] = [];

    // 2. ITERACIÓN POR PERIODOS (Agrupación)
    dataReporte.periodos.forEach((periodo: any) => {

        // --- Encabezado del Bloque de Periodo ---
        const periodoHeader = worksheet.addRow([`PERIODO: ${periodo.nombrePeriodo}`, `Rango: ${periodo.rangoFechas}`]);
        periodoHeader.font = { bold: true };
        periodoHeader.getCell(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE0E7FF' } }; // Azul muy claro

        // Encabezados de tabla para este periodo
        const tableHeader = worksheet.addRow(['ID Empleado', 'Nombre del Empleado', 'Salario Base', 'Fecha Mov.', 'Total Neto']);
        tableHeader.eachCell((cell) => {
            cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF4F46E5' } }; // Tu color Indigo
            cell.font = { color: { argb: 'FFFFFFFF' }, bold: true };
            cell.alignment = { horizontal: 'center' };
        });

        const startRowData = worksheet.lastRow!.number + 1;

        // --- Mapeo de Empleados del Periodo ---
        periodo.empleados.forEach((emp: any) => {
            const row = worksheet.addRow([
                emp.id,
                emp.nombre,
                parseFloat(emp.salarioBase),
                emp.fecha ? format(new Date(emp.fecha), 'dd/MM/yyyy') : 'N/A',
                parseFloat(emp.totalNeto)
            ]);
            row.getCell(3).numFmt = '"$ "#,##0.00';
            row.getCell(5).numFmt = '"$ "#,##0.00';
        });

        const endRowData = worksheet.lastRow!.number;

        // --- Subtotal por Periodo ---
        const subtotalRow = worksheet.addRow(['', '', '', 'SUBTOTAL PERIODO:', { formula: `SUM(E${startRowData}:E${endRowData})` }]);
        subtotalRow.getCell(4).font = { bold: true };
        subtotalRow.getCell(5).font = { bold: true };
        subtotalRow.getCell(5).numFmt = '"$ "#,##0.00';

        // Guardamos la celda del subtotal para el Gran Total final
        celdasTotalesPeriodos.push(subtotalRow.getCell(5).address);

        worksheet.addRow([]); // Espacio entre bloques
    });

    // 3. FILA DE GRAN TOTAL GENERAL
    const granTotalRow = worksheet.addRow(['', '', '', 'GRAN TOTAL GENERAL:', { formula: `SUM(${celdasTotalesPeriodos.join(',')})` }]);

    // Estilo para el Gran Total (Rojo como en tu ejemplo de gastos)
    granTotalRow.getCell(4).font = { bold: true, size: 12 };
    granTotalRow.getCell(4).alignment = { horizontal: 'right' };

    const granTotalCell = granTotalRow.getCell(5);
    granTotalCell.font = { bold: true, color: { argb: 'FFB91C1C' }, size: 12 };
    granTotalCell.numFmt = '"$ "#,##0.00';
    granTotalCell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFF3F4F6' }
    };

    // 4. AUTO-AJUSTE DE COLUMNAS (Tu lógica original)
    worksheet.columns.forEach(column => {
        let maxLength = 0;
        column.eachCell!({ includeEmpty: true }, (cell) => {
            const columnLength = cell.value ? cell.value.toString().length : 10;
            if (columnLength > maxLength) maxLength = columnLength;
        });
        column.width = maxLength < 15 ? 15 : maxLength + 2;
    });

    // 5. DESCARGA
    workbook.xlsx.writeBuffer().then((buffer) => {
        const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
        saveAs.saveAs(blob, `Reporte_Nomina_Mes_${format(new Date(), 'yyyyMMdd')}.xlsx`);
    });

  }

  /*
  exportToExcel(data: any[]) {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Reporte Detallado');

    // 1. CONFIGURACIÓN DE TÍTULOS
    worksheet.mergeCells('A1:F1');
    const titleRow = worksheet.getRow(1);
    titleRow.getCell(1).value = 'Reporte de Gastos Detallado';
    titleRow.getCell(1).font = { size: 16, bold: true };
    titleRow.getCell(1).alignment = { vertical: 'middle', horizontal: 'center' };

    worksheet.mergeCells('A2:F2');
    //worksheet.getCell('A2').value = 'Mes de Marzo, Año 2026';
    worksheet.getCell('A2').value = `${ this.meses.find( m => m.valor === this.mesSeleccionado())?.nombre} ${this.anioSeleccionado()}`;
    worksheet.getCell('A2').alignment = { horizontal: 'center' };

    //worksheet.getCell('A4').value = `Fecha del reporte: 03/Marzo/2026`;
    worksheet.getCell('A4').value = `Fecha del reporte: ${  format(new Date(), 'dd/MM/yyyy HH:mm') }`;
    worksheet.getCell('A4').font = { italic: true };

    // 2. ENCABEZADOS
    const headerRow = ['ID', 'Recurrente', 'Categoría', 'Concepto', 'Fecha Gasto', 'Monto'];
    const tableHeader = worksheet.addRow(headerRow);

    tableHeader.eachCell((cell) => {
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF4F46E5' } };
      cell.font = { color: { argb: 'FFFFFFFF' }, bold: true };
      cell.alignment = { horizontal: 'center' };
    });

    // 3. MAPEO DE DATOS
    data.forEach(item => {
      if (item.gastos && item.gastos.length > 0) {
        item.gastos.forEach((gasto: any) => {
          const row = worksheet.addRow([
            item.id,
            item.recurrente ? 'Sí' : 'No',
            item.gastoCategoria.nombre,
            item.nombre,
            new Date(gasto.fecha).toLocaleDateString(),
            parseFloat(gasto.monto)
          ]);
          row.getCell(6).numFmt = '"$ "#,##0.00';
        });
      } else {
        const row = worksheet.addRow([
          item.id,
          item.recurrente ? 'Sí' : 'No',
          item.gastoCategoria.nombre,
          item.nombre,
          'Sin movimientos',
          0
        ]);
        row.getCell(6).numFmt = '"$ "#,##0.00';
      }
    });

    // --- 4. AGREGAR FILA DE TOTAL GENERAL ---
    const lastRowNumber = worksheet.lastRow!.number;
    const totalRow = worksheet.addRow(['', '', '', '', 'TOTAL GASTADO:', { formula: `SUM(F6:F${lastRowNumber})` }]);

    // Estilo para la fila de total
    totalRow.getCell(5).font = { bold: true };
    totalRow.getCell(5).alignment = { horizontal: 'right' };

    totalRow.getCell(6).font = { bold: true, color: { argb: 'FFB91C1C' } }; // Rojo para resaltar
    totalRow.getCell(6).numFmt = '"$ "#,##0.00';
    totalRow.getCell(6).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFF3F4F6' } // Gris muy claro
    };

    // 5. AUTO-AJUSTE DE COLUMNAS
    worksheet.columns.forEach(column => {
      let maxLength = 0;
      column.eachCell!({ includeEmpty: true }, (cell) => {
        const columnLength = cell.value ? cell.value.toString().length : 10;
        if (columnLength > maxLength) maxLength = columnLength;
      });
      column.width = maxLength < 12 ? 12 : maxLength + 2;
    });

    // 6. DESCARGA
    workbook.xlsx.writeBuffer().then((buffer) => {
      const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      saveAs.saveAs(blob, `Reporte_Gastos_Detallado_2026.xlsx`);
    });
  }
  */

}

export default EmpleadosMovimientosPageComponent;
