import { ChangeDetectionStrategy, Component, computed, inject, OnInit, signal } from '@angular/core';
import { Router } from '@angular/router';
import { rxResource } from '@angular/core/rxjs-interop';
import { BusquedaGeneralComponent } from '@shared/components/busqueda-general/busqueda-general.component';
import { PaginationService } from '@shared/components/pagination/pagination.service';
import { trigger, transition, style, animate } from '@angular/animations';
import { GastosMovimientosService } from '../../services/gastos-movimientos.service';
import { CommonModule } from '@angular/common';
import * as ExcelJS from 'exceljs';
import * as saveAs from 'file-saver';
import { NgIcon } from '@ng-icons/core';
import { format } from 'date-fns';
import { PageButtonInicioComponent } from '@shared/components/forms/page-button-inicio/page-button-inicio.component';
import { CardsContainerComponent } from "@shared/components/cards/cards-container/cards-container.component";
import { BadgeMessageComponent } from "@shared/components/badges/badge-message/badge-message.component";
import { EnumCeroRegistros } from '@shared/enums/general-estatus.enum';
import { CardGastoConMovimientoComponent } from "@pagos/components/cards/card-gasto-con-movimiento/card-gasto-con-movimiento.component";

@Component({
  selector: 'app-gastos-movimientos-page',
  imports: [BusquedaGeneralComponent, CommonModule, NgIcon, PageButtonInicioComponent, CardsContainerComponent, BadgeMessageComponent, CardGastoConMovimientoComponent],
  templateUrl: './gastos-movimientos-page.component.html',
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
export class GastosMovimientosPageComponent implements OnInit {

  mesSeleccionado = signal<number>(new Date().getMonth() + 1); // 1-12
  anioSeleccionado = signal<number>(new Date().getFullYear());

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

  anios = computed(() => {
    const anioActual = new Date().getFullYear();
    return Array.from(
      { length: 7 },
      (_, i) => anioActual - i
    );
  });

  totalGastadoMes = computed(() => {
    return this.gastosConMovimientosRXResource.value()?.totalGastadoMes ?? 0;
  });

  idSeleccionado = signal<string | null>(null)
  isOpenDrawer = signal(false);

  get EnumCeroRegistros(){
    return EnumCeroRegistros;
  }

  idNuevo(){
    this.idSeleccionado.set( null );
    this.isOpenDrawer.set(true);
  }

  idSeleccionar(id: string){
    this.idSeleccionado.set( id );
    this.isOpenDrawer.set(true);
  }

  idDeseleccionar(){
    this.isOpenDrawer.set(false);
    setTimeout(()=> this.idSeleccionado.set(null), 300 );
  }

  reload(){
    this.gastosConMovimientosRXResource.reload()
  }

  ngOnInit(){

  }

  gastosMovimientosService = inject( GastosMovimientosService )
  paginationService = inject( PaginationService )
  router = inject(Router)

  itemsPerPage = signal(6);
  textoFiltrar = signal('');

  refreshDate = signal( new Date());
  //opcionCards = true;
  soloCards = signal( true );

  mostrarCards(mostrar: boolean){
    this.soloCards.set( mostrar );
  }

  filtrar(event: string){

    this.textoFiltrar.set( event )

    this.router.navigate(['/pagos/gastos'], {
      queryParams: { page: 1 }
    })

  }

  gastosConMovimientosRXResource = rxResource({
    params: () => ({
      page: this.paginationService.currentPage(),
      limit: this.itemsPerPage(),
      filtro: this.textoFiltrar(),
      mes: this.mesSeleccionado(),
      anio: this.anioSeleccionado()
    }),
    stream: ({params}) => {
      return this.gastosMovimientosService.getGastosConMovimientos({
        limit: params.limit,
        page: params.page,
        filtro: params.filtro,
      },
      params.mes,
      params.anio
      )
    }
  })

  // Métodos para cambiar mes/año
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

    // Si estamos en enero, vamos a diciembre del año anterior
    if (nuevoMes === 0) {
      nuevoMes = 12;
      nuevoAnio = nuevoAnio - 1;
    }

    this.actualizarFecha(nuevoMes, nuevoAnio);
  }

  mesSiguiente() {
    let nuevoMes = this.mesSeleccionado() + 1;
    let nuevoAnio = this.anioSeleccionado();

    // Si estamos en diciembre, vamos a enero del año siguiente
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

  exportToExcelOLD4(data: any[]) {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Reporte Detallado');

    // 1. CONFIGURACIÓN DE TÍTULOS
    worksheet.mergeCells('A1:F1'); // Expandido a F porque añadimos una columna
    const titleRow = worksheet.getRow(1);
    titleRow.getCell(1).value = 'Reporte de Gastos Detallado';
    titleRow.getCell(1).font = { size: 16, bold: true };
    titleRow.getCell(1).alignment = { vertical: 'middle', horizontal: 'center' };

    worksheet.mergeCells('A2:F2');
    worksheet.getCell('A2').value = 'Mes de Marzo, Año 2026';
    worksheet.getCell('A2').alignment = { horizontal: 'center' };

    worksheet.getCell('A4').value = `Fecha del reporte: ${new Date().toLocaleDateString()}`;
    worksheet.getCell('A4').font = { italic: true };

    // 2. ENCABEZADOS (Añadimos Fecha y cambiamos Total por Monto)
    const headerRow = ['ID', 'Concepto', 'Categoría', 'Recurrente', 'Fecha Gasto', 'Monto'];
    const tableHeader = worksheet.addRow(headerRow);

    tableHeader.eachCell((cell) => {
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF4F46E5' } };
      cell.font = { color: { argb: 'FFFFFFFF' }, bold: true };
      cell.alignment = { horizontal: 'center' };
    });

    // 3. MAPEO DE DATOS (Doble bucle: Concepto -> Gastos)
    data.forEach(item => {
      if (item.gastos && item.gastos.length > 0) {
        // Si tiene gastos, creamos una fila por cada uno
        item.gastos.forEach((gasto: any) => {
          const row = worksheet.addRow([
            item.id,
            item.nombre,
            item.gastoCategoria.nombre,
            item.recurrente ? 'Sí' : 'No',
            new Date(gasto.fecha).toLocaleDateString(), // Formateamos la fecha
            parseFloat(gasto.monto)
          ]);

          // Formato moneda para la columna F
          row.getCell(6).numFmt = '"$ "#,##0.00';
        });
      } else {
        // Opcional: Si el concepto no tiene gastos, mostrarlo con monto 0 o omitirlo
        const row = worksheet.addRow([
          item.id,
          item.nombre,
          item.gastoCategoria.nombre,
          item.recurrente ? 'Sí' : 'No',
          'Sin movimientos',
          0
        ]);
        row.getCell(6).numFmt = '"$ "#,##0.00';
        row.getCell(5).font = { italic: true, color: { argb: 'FF9CA3AF' } }; // Gris
      }
    });

    // 4. AUTO-AJUSTE DE COLUMNAS
    worksheet.columns.forEach(column => {
      let maxLength = 0;
      column.eachCell!({ includeEmpty: true }, (cell) => {
        const columnLength = cell.value ? cell.value.toString().length : 10;
        if (columnLength > maxLength) maxLength = columnLength;
      });
      column.width = maxLength < 12 ? 12 : maxLength + 2;
    });

    // 5. DESCARGA
    workbook.xlsx.writeBuffer().then((buffer) => {
      const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      saveAs.saveAs(blob, `Reporte_Detallado_Gastos_2026.xlsx`);
    });
  }

  exportToExcelOLD3(data: any[]) {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Reporte de Gastos');

    // 1. CONFIGURACIÓN DE TÍTULOS
    worksheet.mergeCells('A1:E1');
    const titleRow = worksheet.getRow(1);
    titleRow.getCell(1).value = 'Reporte de Gastos';
    titleRow.getCell(1).font = { size: 16, bold: true };
    titleRow.getCell(1).alignment = { vertical: 'middle', horizontal: 'center' };

    worksheet.mergeCells('A2:E2');
    worksheet.getCell('A2').value = 'Mes de Marzo, Año 2026';
    worksheet.getCell('A2').alignment = { horizontal: 'center' };

    worksheet.getCell('A4').value = 'Fecha del reporte: 03/Marzo/2026';
    worksheet.getCell('A4').font = { italic: true };

    // 2. ENCABEZADOS DE LA TABLA
    const headerRow = ['ID', 'Concepto', 'Categoría', 'Recurrente', 'Total Gastado'];
    const tableHeader = worksheet.addRow(headerRow);

    tableHeader.eachCell((cell) => {
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF4F46E5' }
      };
      cell.font = { color: { argb: 'FFFFFFFF' }, bold: true };
      cell.alignment = { horizontal: 'center', vertical: 'middle' };
    });

    // 3. INSERTAR DATOS
    data.forEach(item => {
      const row = worksheet.addRow([
        item.id,
        item.nombre,
        item.gastoCategoria.nombre,
        item.recurrente ? 'Sí' : 'No',
        item.totalGastado
      ]);

      // Formato de moneda y alineación
      row.getCell(5).numFmt = '"$ "#,##0.00';
      row.getCell(5).alignment = { horizontal: 'right' };
    });

    // --- 4. APLICAR AUTO-AJUSTE DE COLUMNAS ---
    // Iteramos sobre todas las columnas después de que los datos ya están en las celdas
    worksheet.columns.forEach(column => {
      let maxLength = 0;
      column.eachCell!({ includeEmpty: true }, (cell) => {
        // Calculamos el largo del texto en la celda
        const columnLength = cell.value ? cell.value.toString().length : 10;
        if (columnLength > maxLength) {
          maxLength = columnLength;
        }
      });
      // Aplicamos el ancho: un mínimo de 12 y un margen extra de 2 para que no quede pegado
      column.width = maxLength < 12 ? 12 : maxLength + 2;
    });

    // 5. GENERAR Y DESCARGAR
    workbook.xlsx.writeBuffer().then((buffer) => {
      const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      saveAs.saveAs(blob, `Reporte_Gastos_Marzo_2026.xlsx`);
    });
  }

  exportToExcelOLD2(data: any[]) {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Reporte de Gastos');

    // 1. CONFIGURACIÓN DE TÍTULOS (Encabezado personalizado)
    // Fusionamos celdas para el título principal
    worksheet.mergeCells('A1:E1');
    const titleRow = worksheet.getRow(1);
    titleRow.getCell(1).value = 'Reporte de Gastos';
    titleRow.getCell(1).font = { size: 16, bold: true };
    titleRow.getCell(1).alignment = { vertical: 'middle', horizontal: 'center' };

    worksheet.mergeCells('A2:E2');
    worksheet.getCell('A2').value = 'Mes de Marzo, Año 2026';
    worksheet.getCell('A2').alignment = { horizontal: 'center' };

    worksheet.getCell('A4').value = 'Fecha del reporte: 03/Marzo/2026';
    worksheet.getCell('A4').font = { italic: true };

    // 2. DEFINICIÓN DE LA TABLA (A partir de la fila 6)
    const headerRow = ['ID', 'Concepto', 'Categoría', 'Recurrente', 'Total Gastado'];
    const columns = [
      { key: 'id', width: 15 },
      { key: 'nombre', width: 25 },
      { key: 'categoria', width: 25 },
      { key: 'recurrente', width: 12 },
      { key: 'total', width: 15 },
    ];

    const tableHeader = worksheet.addRow(headerRow);

    // Estilo al encabezado de la tabla
    tableHeader.eachCell((cell) => {
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF4F46E5' } // Un color Indigo (tipo Tailwind)
      };
      cell.font = { color: { argb: 'FFFFFFFF' }, bold: true };
      cell.alignment = { horizontal: 'center' };
    });

    // 3. MAPEO DE DATOS DEL JSON
    data.forEach(item => {
      const row = worksheet.addRow([
        item.id,
        item.nombre,
        item.gastoCategoria.nombre,
        item.recurrente ? 'Sí' : 'No',
        item.totalGastado
      ]);

      // Formato de moneda para la columna Total Gastado (E)
      row.getCell(5).numFmt = '"$"#,##0.00';
    });

    // 4. GENERAR Y DESCARGAR EL ARCHIVO
    workbook.xlsx.writeBuffer().then((buffer) => {
      const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      saveAs.saveAs(blob, `Reporte_Gastos_Marzo_2026.xlsx`);
    });
  }

  async exportToExcelOLD(data: any[]){

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Mi Reporte');

    worksheet.columns = [
      { header: 'ID', key: 'id', width: 10 },
      { header: 'Nombre', key: 'name', width: 32 }
    ];

    data.forEach( item => worksheet.addRow(item));

    worksheet.getRow(1).font = { bold: true };
    worksheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF007ACC' }
    };

    const buffer = await workbook.xlsx.writeBuffer();
    saveAs.saveAs( new Blob([buffer]), 'reporte.xlsx' )

  }

}

export default GastosMovimientosPageComponent;
