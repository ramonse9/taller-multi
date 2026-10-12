import { Injectable } from '@nestjs/common';
import { Workbook, Worksheet } from 'exceljs';
import { MonthlyProfitabilityReportResponseDto } from './dto/profitability.dto';

const XLSX_CONTENT_TYPE = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
const FONT_NAME = 'Arial';
const CURRENCY_FORMAT = '"$"#,##0.00;[Red]-"$"#,##0.00';
const PERCENT_FORMAT = '0.00%';
const DATE_FORMAT = 'dd/mm/yyyy';

const COLORS = {
  navy: '17324D',
  blue: '2563EB',
  blueLight: 'DBEAFE',
  slate: '475569',
  border: 'CBD5E1',
  surface: 'F8FAFC',
  white: 'FFFFFF',
  green: '166534',
  greenLight: 'DCFCE7',
  red: '991B1B',
  redLight: 'FEE2E2',
  amber: '92400E',
  amberLight: 'FEF3C7',
} as const;

export interface ProfitabilityWorkbookFile {
  buffer: Buffer;
  contentType: typeof XLSX_CONTENT_TYPE;
  filename: string;
  worksheetName: string;
}

@Injectable()
export class ProfitabilityWorkbookService {
  async build(
    report: MonthlyProfitabilityReportResponseDto,
    companyName: string,
  ): Promise<ProfitabilityWorkbookFile> {
    const workbook = new Workbook();
    workbook.creator = 'Multiservicios 24/7';
    workbook.company = companyName;
    workbook.subject = `Órdenes y utilidad de ${report.label}`;
    workbook.title = `Reporte mensual de órdenes y utilidad - ${report.label}`;
    workbook.created = new Date();
    workbook.modified = new Date();
    workbook.calcProperties.fullCalcOnLoad = true;

    const worksheet = workbook.addWorksheet(report.label, {
      properties: { defaultRowHeight: 20 },
      views: [{ showGridLines: false }],
      pageSetup: {
        orientation: 'landscape',
        paperSize: 9,
        fitToPage: true,
        fitToWidth: 1,
        fitToHeight: 0,
        margins: { left: 0.3, right: 0.3, top: 0.5, bottom: 0.5, header: 0.2, footer: 0.2 },
      },
    });

    this.configureColumns(worksheet);
    this.writeHeading(worksheet, report, companyName);
    this.writeSummary(worksheet, report);
    this.writeOrders(worksheet, report);

    const bytes = await workbook.xlsx.writeBuffer();
    return {
      buffer: Buffer.from(bytes),
      contentType: XLSX_CONTENT_TYPE,
      filename: `reporte-ordenes-utilidad-${this.periodSlug(report)}.xlsx`,
      worksheetName: report.label,
    };
  }

  private configureColumns(worksheet: Worksheet): void {
    worksheet.columns = [
      { key: 'folio', width: 17 },
      { key: 'externalFolio', width: 18 },
      { key: 'completedOn', width: 15 },
      { key: 'customer', width: 27 },
      { key: 'vehicle', width: 34 },
      { key: 'licensePlate', width: 14 },
      { key: 'serialNumber', width: 18 },
      { key: 'paymentStatus', width: 15 },
      { key: 'paidOn', width: 15 },
      { key: 'income', width: 16 },
      { key: 'directCost', width: 16 },
      { key: 'grossProfit', width: 16 },
      { key: 'grossMargin', width: 14 },
      { key: 'costComplete', width: 18 },
    ];
  }

  private writeHeading(
    worksheet: Worksheet,
    report: MonthlyProfitabilityReportResponseDto,
    companyName: string,
  ): void {
    worksheet.mergeCells('A2:N2');
    const title = worksheet.getCell('A2');
    title.value = 'Reporte mensual de órdenes y utilidad';
    title.font = { name: FONT_NAME, size: 15, bold: true, color: { argb: COLORS.navy } };
    title.alignment = { vertical: 'middle' };
    worksheet.getRow(2).height = 24;

    worksheet.mergeCells('A3:N3');
    const subtitle = worksheet.getCell('A3');
    subtitle.value = `${companyName}. Periodo: ${report.label}. Zona horaria: ${report.timezoneCode}.`;
    subtitle.font = { name: FONT_NAME, size: 10, italic: true, color: { argb: COLORS.slate } };
    subtitle.alignment = { vertical: 'middle' };

    worksheet.mergeCells('A4:N4');
    const divider = worksheet.getCell('A4');
    divider.border = { bottom: { style: 'thin', color: { argb: COLORS.border } } };
    worksheet.getRow(4).height = 7;
  }

  private writeSummary(
    worksheet: Worksheet,
    report: MonthlyProfitabilityReportResponseDto,
  ): void {
    const summary = report.summary;
    const generatedIncome = this.money(summary.generatedIncome);
    const grossProfit = this.money(summary.grossProfit);
    const netProfit = this.money(summary.netProfit);
    const grossMargin = generatedIncome === 0 ? null : grossProfit / generatedIncome;
    const netMargin = generatedIncome === 0 ? null : netProfit / generatedIncome;

    this.summaryMetric(worksheet, 'A5', 'B5', 'Órdenes terminadas', summary.completedOrderCount);
    this.summaryMetric(worksheet, 'C5', 'D5', 'Pagadas', summary.paidOrderCount);
    this.summaryMetric(worksheet, 'E5', 'F5', 'Pendientes de cobro', summary.pendingOrderCount);
    this.summaryMetric(
      worksheet,
      'G5',
      'H5',
      'Costos incompletos',
      summary.incompleteCostOrderCount,
    );

    this.summaryMetric(
      worksheet,
      'A6',
      'B6',
      'Ingresos generados',
      generatedIncome,
      CURRENCY_FORMAT,
    );
    this.summaryMetric(
      worksheet,
      'C6',
      'D6',
      'Ingresos cobrados',
      this.money(summary.collectedIncome),
      CURRENCY_FORMAT,
    );
    this.summaryMetric(
      worksheet,
      'E6',
      'F6',
      'Pendiente de cobro',
      this.money(summary.outstandingIncome),
      CURRENCY_FORMAT,
    );
    this.summaryMetric(
      worksheet,
      'G6',
      'H6',
      'Costo directo',
      this.money(summary.directCost),
      CURRENCY_FORMAT,
    );

    this.summaryMetric(worksheet, 'A7', 'B7', 'Utilidad bruta', grossProfit, CURRENCY_FORMAT);
    this.summaryMetric(
      worksheet,
      'C7',
      'D7',
      'Gastos operativos',
      this.money(summary.operatingExpenses),
      CURRENCY_FORMAT,
    );
    this.summaryMetric(worksheet, 'E7', 'F7', 'Utilidad neta', netProfit, CURRENCY_FORMAT);
    this.summaryMetric(worksheet, 'G7', 'H7', 'Margen bruto', grossMargin, PERCENT_FORMAT);
    this.summaryMetric(worksheet, 'I7', 'J7', 'Margen neto', netMargin, PERCENT_FORMAT);

    worksheet.mergeCells('I5:N5');
    worksheet.mergeCells('I6:N6');
    const status = worksheet.getCell('I5');
    status.value = summary.isComplete ? 'Información de costos completa' : 'Información de costos incompleta';
    status.font = {
      name: FONT_NAME,
      size: 10,
      bold: true,
      color: { argb: summary.isComplete ? COLORS.green : COLORS.amber },
    };
    status.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: summary.isComplete ? COLORS.greenLight : COLORS.amberLight },
    };
    status.alignment = { horizontal: 'center', vertical: 'middle' };

    const note = worksheet.getCell('I6');
    note.value = summary.isComplete
      ? 'La utilidad incluye costos conocidos de todas las órdenes del periodo.'
      : `${summary.incompleteCostOrderCount} orden(es) contienen productos con costo desconocido.`;
    note.font = { name: FONT_NAME, size: 9, color: { argb: COLORS.slate } };
    note.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: summary.isComplete ? COLORS.greenLight : COLORS.amberLight },
    };
    note.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };

    for (let rowNumber = 5; rowNumber <= 7; rowNumber += 1) {
      worksheet.getRow(rowNumber).height = 24;
    }
  }

  private writeOrders(
    worksheet: Worksheet,
    report: MonthlyProfitabilityReportResponseDto,
  ): void {
    const headerRowNumber = 10;
    const firstDataRowNumber = headerRowNumber + 1;
    const headers = [
      'Folio del sistema',
      'Folio externo',
      'Fecha de terminación',
      'Cliente o empresa',
      'Vehículo',
      'Placa',
      'Número de serie',
      'Cobro',
      'Fecha de pago',
      'Ingreso',
      'Costo directo',
      'Utilidad bruta',
      'Margen bruto',
      'Costo completo',
    ];
    const header = worksheet.getRow(headerRowNumber);
    header.values = headers;
    header.height = 32;
    header.eachCell((cell) => {
      cell.font = { name: FONT_NAME, size: 10, bold: true, color: { argb: COLORS.white } };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.navy } };
      cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
      cell.border = { right: { style: 'thin', color: { argb: COLORS.white } } };
    });

    for (const order of report.orders) {
      const income = this.money(order.income);
      const grossProfit = order.grossProfit === null ? null : this.money(order.grossProfit);
      const row = worksheet.addRow({
        folio: order.folio,
        externalFolio: order.externalFolio ?? '',
        completedOn: this.date(order.completedOn),
        customer: order.customerName,
        vehicle: [order.vehicleBrand, order.vehicleModel, order.vehicleYear, order.vehicleColor]
          .filter((value) => value !== null && value !== undefined && value !== '')
          .join(' '),
        licensePlate: order.vehicleLicensePlate ?? '',
        serialNumber: order.vehicleSerialNumber ?? '',
        paymentStatus: order.isPaid ? 'Pagada' : 'Pendiente',
        paidOn: order.paidOn ? this.date(order.paidOn) : null,
        income,
        directCost: this.money(order.directCost),
        grossProfit,
        grossMargin: grossProfit === null || income === 0 ? null : grossProfit / income,
        costComplete: order.isCostComplete ? 'Sí' : 'No',
      });
      row.height = 24;
      row.font = { name: FONT_NAME, size: 10, color: { argb: COLORS.navy } };
      row.alignment = { vertical: 'middle' };
      row.getCell('completedOn').numFmt = DATE_FORMAT;
      row.getCell('paidOn').numFmt = DATE_FORMAT;
      row.getCell('income').numFmt = CURRENCY_FORMAT;
      row.getCell('directCost').numFmt = CURRENCY_FORMAT;
      row.getCell('grossProfit').numFmt = CURRENCY_FORMAT;
      row.getCell('grossMargin').numFmt = PERCENT_FORMAT;
      row.getCell('paymentStatus').alignment = { horizontal: 'center', vertical: 'middle' };
      row.getCell('costComplete').alignment = { horizontal: 'center', vertical: 'middle' };

      const paymentCell = row.getCell('paymentStatus');
      paymentCell.font = {
        name: FONT_NAME,
        size: 10,
        bold: true,
        color: { argb: order.isPaid ? COLORS.blue : COLORS.amber },
      };
      paymentCell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: order.isPaid ? COLORS.blueLight : COLORS.amberLight },
      };

      if (!order.isCostComplete) {
        const costCell = row.getCell('costComplete');
        costCell.font = {
          name: FONT_NAME,
          size: 10,
          bold: true,
          color: { argb: COLORS.red },
        };
        costCell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: COLORS.redLight },
        };
      }

      row.eachCell((cell) => {
        cell.border = { bottom: { style: 'hair', color: { argb: COLORS.border } } };
      });
    }

    const lastDataRowNumber = firstDataRowNumber + report.orders.length - 1;
    const totalsRowNumber = Math.max(firstDataRowNumber, lastDataRowNumber + 1);
    const totals = worksheet.getRow(totalsRowNumber);
    totals.getCell('folio').value = 'Totales';
    worksheet.mergeCells(`A${totalsRowNumber}:I${totalsRowNumber}`);
    totals.getCell('income').value = this.totalFormula(
      'J',
      firstDataRowNumber,
      lastDataRowNumber,
      this.money(report.summary.generatedIncome),
    );
    totals.getCell('directCost').value = this.totalFormula(
      'K',
      firstDataRowNumber,
      lastDataRowNumber,
      this.money(report.summary.directCost),
    );
    totals.getCell('grossProfit').value = this.totalFormula(
      'L',
      firstDataRowNumber,
      lastDataRowNumber,
      this.money(report.summary.grossProfit),
    );
    totals.getCell('grossMargin').value = {
      formula: `IF(J${totalsRowNumber}=0,"",L${totalsRowNumber}/J${totalsRowNumber})`,
      result:
        this.money(report.summary.generatedIncome) === 0
          ? ''
          : this.money(report.summary.grossProfit) / this.money(report.summary.generatedIncome),
    };
    totals.getCell('costComplete').value = report.summary.isComplete
      ? 'Completo'
      : `${report.summary.incompleteCostOrderCount} incompleta(s)`;
    totals.height = 26;
    totals.font = { name: FONT_NAME, size: 10, bold: true, color: { argb: COLORS.navy } };
    totals.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.surface } };
    totals.alignment = { vertical: 'middle' };
    totals.getCell('folio').alignment = { horizontal: 'right', vertical: 'middle' };
    totals.getCell('income').numFmt = CURRENCY_FORMAT;
    totals.getCell('directCost').numFmt = CURRENCY_FORMAT;
    totals.getCell('grossProfit').numFmt = CURRENCY_FORMAT;
    totals.getCell('grossMargin').numFmt = PERCENT_FORMAT;
    totals.getCell('costComplete').alignment = { horizontal: 'center', vertical: 'middle' };
    totals.eachCell((cell) => {
      cell.border = { top: { style: 'medium', color: { argb: COLORS.blue } } };
    });

    worksheet.autoFilter = `A${headerRowNumber}:N${Math.max(headerRowNumber, lastDataRowNumber)}`;
    worksheet.views = [
      {
        state: 'frozen',
        ySplit: headerRowNumber,
        activeCell: `A${firstDataRowNumber}`,
        showGridLines: false,
      },
    ];
    worksheet.pageSetup.printTitlesRow = `${headerRowNumber}:${headerRowNumber}`;
    worksheet.pageSetup.printArea = `A1:N${totalsRowNumber}`;
  }

  private summaryMetric(
    worksheet: Worksheet,
    labelAddress: string,
    valueAddress: string,
    label: string,
    value: number | null,
    numberFormat?: string,
  ): void {
    const labelCell = worksheet.getCell(labelAddress);
    labelCell.value = label;
    labelCell.font = {
      name: FONT_NAME,
      size: 9,
      bold: true,
      color: { argb: COLORS.slate },
    };
    labelCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.surface } };
    labelCell.alignment = { vertical: 'middle' };

    const valueCell = worksheet.getCell(valueAddress);
    valueCell.value = value;
    valueCell.font = {
      name: FONT_NAME,
      size: 10,
      bold: true,
      color: { argb: COLORS.navy },
    };
    valueCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.surface } };
    valueCell.alignment = { horizontal: 'right', vertical: 'middle' };
    if (numberFormat) valueCell.numFmt = numberFormat;
  }

  private totalFormula(
    column: string,
    firstDataRow: number,
    lastDataRow: number,
    result: number,
  ): number | { formula: string; result: number } {
    return lastDataRow < firstDataRow
      ? result
      : { formula: `SUM(${column}${firstDataRow}:${column}${lastDataRow})`, result };
  }

  private money(value: string): number {
    const parsed = Number(value);
    if (!Number.isFinite(parsed)) throw new Error(`Importe inválido en el reporte mensual: ${value}`);
    return parsed;
  }

  private date(value: string): Date {
    const [year, month, day] = value.split('-').map(Number);
    if (!year || !month || !day) throw new Error(`Fecha inválida en el reporte mensual: ${value}`);
    return new Date(Date.UTC(year, month - 1, day, 12));
  }

  private periodSlug(report: MonthlyProfitabilityReportResponseDto): string {
    return report.label
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
  }
}
