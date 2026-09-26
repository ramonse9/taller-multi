import { CommonModule } from "@angular/common";
import { AfterViewInit, ChangeDetectionStrategy, Component, ElementRef, input, OnDestroy, signal, ViewChild } from "@angular/core";
import { Grafica6MesesCompleto } from "@dashboard/interfaces/grafica-6-meses-completo.interface";
import { Grafica6Meses } from "@dashboard/interfaces/grafica-6-meses.interface";
import { Chart } from "chart.js";

const meses = [
    { valor: 1, nombreCorto: 'Ene',  nombre: 'Enero' },
    { valor: 2, nombreCorto: 'Feb',  nombre: 'Febrero' },
    { valor: 3, nombreCorto: 'Mar',  nombre: 'Marzo' },
    { valor: 4, nombreCorto: 'Abr',  nombre: 'Abril' },
    { valor: 5, nombreCorto: 'May',  nombre: 'Mayo' },
    { valor: 6, nombreCorto: 'Jun',  nombre: 'Junio' },
    { valor: 7, nombreCorto: 'Jul',  nombre: 'Julio' },
    { valor: 8, nombreCorto: 'Ago',  nombre: 'Agosto' },
    { valor: 9, nombreCorto: 'Sep',  nombre: 'Septiembre' },
    { valor: 10, nombreCorto: 'Oct',  nombre: 'Octubre' },
    { valor: 11, nombreCorto: 'Nov',  nombre: 'Noviembre' },
    { valor: 12, nombreCorto: 'Dic',  nombre: 'Diciembre' }
  ];

@Component({
  selector: 'app-chart-6-meses',
  imports: [ CommonModule],
  templateUrl: './chart-6-meses.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class chart6MesesComponent implements OnDestroy, AfterViewInit {

  grafica6Meses =   input.required<Grafica6Meses[]>();
  encabezado    =   input.required<string>();

  @ViewChild('chartCanvas') chartCanvas!: ElementRef<HTMLCanvasElement>;

  private charts: Chart[] = [];

  grafica6MesesCompleto = signal<Grafica6MesesCompleto[]>([]);

  ngOnDestroy(): void {
    this.charts.forEach( chart => chart.destroy() );
    this.charts = [];
  }

  ngAfterViewInit() {

    const canvas = this.chartCanvas.nativeElement;
    const ctx = canvas.getContext('2d');

    const existingChart = Chart.getChart(canvas);
    if (existingChart) {
      existingChart.destroy();
    }

    this.grafica6MesesCompleto.set( this.obtenerNombresMeses( this.grafica6Meses() ) )

    const chart =  new Chart(ctx!, {
      type: 'line',
      data: {
        labels: this.grafica6MesesCompleto().map( (i: Grafica6MesesCompleto) => (i.nombreCorto)),
        /*labels: this.grafica6MesesCompleto().map((i: Grafica6MesesCompleto) =>
                      i.nombreCorto + ' - ' + new Intl.NumberFormat('es-MX', {
                        style: 'currency',
                        currency: 'MXN',
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2
                      }).format(i.total)
                    ),*/        
        datasets: [{
          label: 'Gastos ($)',
          data: this.grafica6MesesCompleto().map( (i: Grafica6MesesCompleto) => i.total ),
          borderColor: '#ede73e',
          backgroundColor: 'rgba(237, 231, 62, 0.1)',
          borderWidth: 3,
          fill: true,
          tension: 0.3,
          animation: {
            duration: 5000,
          }
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          x: { // <--- Agregamos la configuración del eje X
            ticks: {
              font: {
                size: 12, // Define aquí el tamaño en píxeles
                family: 'Arial', // Opcional: cambiar tipo de letra
                weight: 'bold'   // Opcional: ponerla en negrita
              },
              color: '#666' // Opcional: cambiar el color
            }
          },
          y: {
            beginAtZero: true,
            ticks: {
              callback: (value) => '$' + value.toLocaleString(),
              font: {
                size: 12 // También puedes cambiar el tamaño del eje Y si gustas
              }
            }
          }
        }
      }
    });

    this.charts.push(chart);

  }


  //private async initChart( grafica6Meses: Grafica6Meses[] ) {

  //}

  private obtenerNombresMeses( grafica6Meses: Grafica6Meses[] ):Grafica6MesesCompleto[]{

    return grafica6Meses.map( (g:any) => {

      return {
        ...g,
        nombreCorto: meses.find( mC => mC.valor === g.mes )?.nombreCorto,
        nombre: meses.find( mC => mC.valor === g.mes )?.nombre
      }

    })

  }

}
