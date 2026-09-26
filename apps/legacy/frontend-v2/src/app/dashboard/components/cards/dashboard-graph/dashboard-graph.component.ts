import { CommonModule } from '@angular/common';
import { AfterViewInit, ChangeDetectionStrategy, Component, computed, ElementRef, inject, OnDestroy, signal, ViewChild } from '@angular/core';
import { Grafica6Meses } from '@dashboard/interfaces/grafica-6-meses.interface';
import { Grafica6MesesCompleto } from '@dashboard/interfaces/grafica-6-meses-completo.interface';
import { NgIcon } from '@ng-icons/core';
import { GastosMovimientosService } from '@pagos/services/gastos-movimientos.service';
import { NominaService } from '@pagos/services/nomina.service';
import { Chart, registerables } from 'chart.js';
import { CountUpModule } from 'ngx-countup';
import { forkJoin } from 'rxjs';
import { chart6MesesComponent } from '../chart-6-meses/chart-6-meses.component';
import { OrdenesService } from '@operaciones/services/ordenes.service';
import { OrdenEstatusTotalResponse } from '@operaciones/interfaces/orden-estatus-total-response';
import { EnumEstatusOrden } from '@shared/enums/general-estatus.enum';
import { ClientesService } from '@catalogos/services/clientes.service';
import { EmpresasService } from '@catalogos/services/empresas.service';
import { VehiculosService } from '@catalogos/services/vehiculos.service';
import { GastosService } from '@catalogos/services/gastos.service';

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
  selector: 'app-dashboard-graph',
  imports: [ NgIcon, CountUpModule, CommonModule, chart6MesesComponent],
  templateUrl: './dashboard-graph.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DashboardGraphComponent implements AfterViewInit, OnDestroy {

  // Referencias a los elementos del DOM
  @ViewChild('ordersChart') ordersChartCanvas!: ElementRef<HTMLCanvasElement>;
  @ViewChild('revenueChart') revenueChartCanvas!: ElementRef<HTMLCanvasElement>;
  @ViewChild('chartGastos') chartCanvasGastos!: ElementRef<HTMLCanvasElement>;
  @ViewChild('chartMovimientos') chartCanvasMovimientos!: ElementRef<HTMLCanvasElement>;
  @ViewChild('chartCombinados') chartCanvasCombinados!: ElementRef<HTMLCanvasElement>;
  @ViewChild('companyChart') companyChartCanvas!: ElementRef<HTMLCanvasElement>;

  gastosService = inject(GastosService)
  gastosMovimientosService = inject(GastosMovimientosService)
  nominaService = inject(NominaService)
  ordenesService  = inject(OrdenesService)
  clientesService = inject(ClientesService)
  empresasService = inject(EmpresasService)
  vehiculosService = inject(VehiculosService)

  private charts: Chart[] = []

  animarServiciosMasSolicitados = false;
  porcentajeTest = 0;

  grafica6MesesCompletoMovimientos  = signal<Grafica6MesesCompleto[]>([]);
  grafica6MesesCompletoCombinados   = signal<Grafica6MesesCompleto[]>([]);

  grafica6MesesGastos       = signal<Grafica6Meses[]>([]);
  grafica6MesesMovimientos  = signal<Grafica6Meses[]>([]);
  grafica6MesesCombinados   = signal<Grafica6Meses[]>([]);

  graficaOrdenesEstatusTotalOrdenadas   = signal<OrdenEstatusTotalResponse[]>([]);
  cardClientesTotal                     = signal<number>(0)
  cardEmpresasTotal                     = signal<number>(0)
  cardVehiculosTotal                    = signal<number>(0)

  ingresoMensual = computed( () => {
    //TODO
    return 0
  })

  gastoMensual = computed( () => {

    const hoy = new Date()
    const anio = hoy.getFullYear()
    const mes = hoy.getMonth() + 1

    return this.grafica6MesesGastos().find( g => g.anio === anio && g.mes === mes )?.total ?? 0

  })

  movimientoMensual = computed( () => {

    const hoy = new Date()
    const anio = hoy.getFullYear()
    const mes = hoy.getMonth() + 1

    return this.grafica6MesesMovimientos().find( g => g.anio === anio && g.mes === mes )?.total ?? 0

  })


  utilidadMensual = computed( () => {

    const hoy = new Date()
    const anio = hoy.getFullYear()
    const mes = hoy.getMonth() + 1

    return this.ingresoMensual() - this.gastoMensual() - this.movimientoMensual()

  })

  get EnumEstatusOrden(){
    return EnumEstatusOrden;
  }

  constructor(){
    Chart.register(...registerables);
  }

  ngOnDestroy(): void {
    this.charts.forEach( chart => chart.destroy() );
    this.charts = [];
  }

  ngAfterViewInit(): void {

    forkJoin({
      gastos6Meses:           this.gastosMovimientosService.getGastosConMovimientos6Meses(),
      movimientos6Meses:      this.nominaService.getNominaMovimientos6Meses(),
      ordenesEstatusTotales:  this.ordenesService.getOrdenesEstatusTotales(),
      clientesTotal:          this.clientesService.getClientesTotal(),
      empresasTotal:          this.empresasService.getEmpresasTotal(),
      vehiculosTotal:         this.vehiculosService.getVehiculosTotal(),
    }).subscribe(({ gastos6Meses, movimientos6Meses, ordenesEstatusTotales, clientesTotal, empresasTotal, vehiculosTotal }) => {

      this.cardClientesTotal.set( clientesTotal.total )
      this.cardEmpresasTotal.set( empresasTotal.total )
      this.cardVehiculosTotal.set( vehiculosTotal.total )

      const ordenadas = this.ordenarOrdenesEstatusTotales( ordenesEstatusTotales );

      this.graficaOrdenesEstatusTotalOrdenadas.set( ordenadas )

      const combinados6Meses = this.combinarTotales(gastos6Meses, movimientos6Meses);

      this.grafica6MesesGastos.set( gastos6Meses );
      this.grafica6MesesMovimientos.set( movimientos6Meses );
      this.grafica6MesesCombinados.set( combinados6Meses );

      this.initOrdersChart( this.graficaOrdenesEstatusTotalOrdenadas() );
      this.initRevenueChart();
      this.initCompanyChart();

    })

    /*setTimeout( () => {
      this.initOrdersChart();
      this.initRevenueChart();
      this.initChartGastos();
      this.initCompanyChart();
    }, 0)*/

    this.porcentajeTest = 90

    setTimeout(()=> {
      this.animarServiciosMasSolicitados = true;
      this.porcentajeTest = 90
    }, 100)
  }

  private initOrdersChart( ordenes: OrdenEstatusTotalResponse[]) {
    const canvas = this.ordersChartCanvas.nativeElement;
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      console.error('No se pudo obtener el contexto 2D del canvas');
      return; // Salir temprano si no hay contexto
    }

    const existingChart = Chart.getChart(canvas);
    if (existingChart) {
      existingChart.destroy();
    }

    /*original
    const chart = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: ['Pendientes', 'En Proceso', 'Completadas', 'Facturadas'],
        datasets: [{
          data: [12, 8, 4, 15],
          backgroundColor: ['#3B82F6', '#F59E0B', '#10B981', '#8B5CF6'],
          borderWidth: 2,
          borderColor: '#FFFFFF'
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        animation: {
          animateScale: true, // Asegurar animación de escala
          animateRotate: true, // Asegurar animación de rotación (para doughnut)
          duration: 3000,
          easing: 'easeOutQuart',
        },
        plugins: {
          legend: {
            position: 'bottom',
            labels: { padding: 20 }
          }
        }
      }
    });*/

    //'bg-green-100 text-green-800 text-sm font-medium me-2 px-2.5 py-0.5 rounded-sm dark:bg-green-700 dark:text-green-300',
    // classIndicator: 'bg-green-700 hover:bg-green-800 dark:bg-green-700 dark:hover:bg-green-700' },

    const chart = new Chart(ctx, {
      type: 'doughnut',
      data: {
        //labels: ['Pendientes', 'En Proceso', 'Completadas', 'Facturadas'],
        labels: ordenes.map( (o: OrdenEstatusTotalResponse ) => o.estatus.charAt(0).toUpperCase() + o.estatus.slice(1) ),
        datasets: [{
          //data: [12, 8, 4, 15],
          data: ordenes.map( (o: OrdenEstatusTotalResponse) => o.total ),
          backgroundColor: ['#15803d', '#1d4ed8', '#b91c1c', '#7e22ce'],
          //backgroundColor: ['#3B82F6', '#F59E0B', '#10B981', '#8B5CF6'],
          borderWidth: 2,
          borderColor: '#FFFFFF',
          animation: {
             duration: 3000
          }
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'bottom',
            labels: { padding: 20 }
          }
        },
      }
    });

    /*const chart = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: ['Pendientes', 'En Proceso', 'Completadas', 'Facturadas'],
        datasets: [{
          data: [12, 8, 4, 15],
          backgroundColor: ['#3B82F6', '#F59E0B', '#10B981', '#8B5CF6'],
          borderWidth: 2,
          borderColor: '#FFFFFF',
          // Configurar animación a nivel de dataset
          animation: {
            //animateRotate: true,
            //animateScale: true,
            duration: 2000,
          }
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        animation: {
          animateRotate: true,
          animateScale: true,
          duration: 3000,
          easing: 'easeOutQuart',
        },
        plugins: {
          legend: {
            position: 'bottom',
            labels: { padding: 20 }
          }
        },
        // Configuración específica para doughnut
        cutout: '60%', // Asegurar que tenga espacio para animar
        radius: '90%'  // Dejar margen
      }
    });*/

    this.charts.push(chart);
  }

  private initOrdersChartOLD() {
    const canvas = this.ordersChartCanvas.nativeElement;
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      console.error('No se pudo obtener el contexto 2D del canvas');
      return; // Salir temprano si no hay contexto
    }

    const existingChart = Chart.getChart(canvas);
    if (existingChart) {
      existingChart.destroy();
    }

    /*original
    const chart = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: ['Pendientes', 'En Proceso', 'Completadas', 'Facturadas'],
        datasets: [{
          data: [12, 8, 4, 15],
          backgroundColor: ['#3B82F6', '#F59E0B', '#10B981', '#8B5CF6'],
          borderWidth: 2,
          borderColor: '#FFFFFF'
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        animation: {
          animateScale: true, // Asegurar animación de escala
          animateRotate: true, // Asegurar animación de rotación (para doughnut)
          duration: 3000,
          easing: 'easeOutQuart',
        },
        plugins: {
          legend: {
            position: 'bottom',
            labels: { padding: 20 }
          }
        }
      }
    });*/

    const chart = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: ['Pendientes', 'En Proceso', 'Completadas', 'Facturadas'],
        datasets: [{
          data: [12, 8, 4, 15],
          backgroundColor: ['#3B82F6', '#F59E0B', '#10B981', '#8B5CF6'],
          borderWidth: 2,
          borderColor: '#FFFFFF',
          animation: {
             duration: 3000
          }
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'bottom',
            labels: { padding: 20 }
          }
        },
      }
    });

    /*const chart = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: ['Pendientes', 'En Proceso', 'Completadas', 'Facturadas'],
        datasets: [{
          data: [12, 8, 4, 15],
          backgroundColor: ['#3B82F6', '#F59E0B', '#10B981', '#8B5CF6'],
          borderWidth: 2,
          borderColor: '#FFFFFF',
          // Configurar animación a nivel de dataset
          animation: {
            //animateRotate: true,
            //animateScale: true,
            duration: 2000,
          }
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        animation: {
          animateRotate: true,
          animateScale: true,
          duration: 3000,
          easing: 'easeOutQuart',
        },
        plugins: {
          legend: {
            position: 'bottom',
            labels: { padding: 20 }
          }
        },
        // Configuración específica para doughnut
        cutout: '60%', // Asegurar que tenga espacio para animar
        radius: '90%'  // Dejar margen
      }
    });*/

    this.charts.push(chart);
  }

  private initRevenueChart() {

    const canvas = this.revenueChartCanvas.nativeElement;
    const ctx = canvas.getContext('2d');

    const existingChart = Chart.getChart(canvas);
    if (existingChart) {
      existingChart.destroy();
    }

    const chart =  new Chart(ctx!, {
      type: 'line',
      data: {
        labels: ['May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct'],
        datasets: [{
          label: 'Ingresos ($)',
          data: [32000, 35000, 38000, 41000, 39500, 42580],
          borderColor: '#10B981',
          backgroundColor: 'rgba(16, 185, 129, 0.1)',
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
        //animation: {
        //  duration: 2500,
        //  easing: 'easeOutQuart',
        //},
        plugins: { legend: { display: false } },
        scales: {
          y: {
            beginAtZero: false,
            ticks: { callback: (value) => '$' + value.toLocaleString() }
          }
        }
      }
    });

    this.charts.push(chart);
  }

  private initCompanyChart() {
    const canvas = this.companyChartCanvas.nativeElement;
    const ctx = canvas.getContext('2d');

    const existingChart = Chart.getChart(canvas);
    if (existingChart) {
      existingChart.destroy();
    }

    const chart = new Chart(ctx!, {
      type: 'bar',
      data: {
        labels: ['Automotriz Pérez', 'Transportes Rápidos', 'Logística Integral', 'Distribuidora MX', 'Otros'],
        datasets: [{
          label: 'Facturación ($)',
          data: [12450, 8920, 7310, 5640, 8260],
          backgroundColor: ['#3B82F6', '#10B981', '#8B5CF6', '#F59E0B', '#6B7280'],
          borderRadius: 4,
          animation: {
            duration: 3000,
          }
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        //animation: {
        //  duration: 2000,
        //  easing: 'easeOutQuart',
        //},
        plugins: {
          legend: { display: false }
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              callback: (value) => '$' + value.toLocaleString()
            }
          }
        }
      }
    });

    this.charts.push(chart);
  }

  /*
  private obtenerNombresMeses( grafica6Meses: Grafica6Meses[] ):Grafica6MesesCompleto[]{

    return grafica6Meses.map( (g:any) => {

      return {
        ...g,
        nombreCorto: meses.find( mC => mC.valor === g.mes )?.nombreCorto,
        nombre: meses.find( mC => mC.valor === g.mes )?.nombre
      }

    })

  }*/

  private combinarTotales(arr1: any[], arr2: any[]): any[] {
    const mapa = new Map<string, any>();

    // Función para procesar cada arreglo y sumar en el mapa
    const procesar = (item: any) => {
      const llave = `${item.anio}-${item.mes}`; // Ejemplo: "2026-1"
      if (mapa.has(llave)) {
        const existente = mapa.get(llave);
        existente.total += Number(item.total);
      } else {
        mapa.set(llave, { ...item, total: Number(item.total) });
      }
    };

    arr1.forEach(procesar);
    arr2.forEach(procesar);

    // Convertir el mapa de nuevo a un arreglo y ordenar por fecha
    return Array.from(mapa.values()).sort((a, b) => {
      return a.anio - b.anio || a.mes - b.mes;
    });
  }

  private ordenarOrdenesEstatusTotales(ordenes: OrdenEstatusTotalResponse[]){

    const ordenPrioridad: Record<EnumEstatusOrden, number> = {
      [EnumEstatusOrden.PROCESO]: 1,
      [EnumEstatusOrden.FINALIZADO]: 2,
      [EnumEstatusOrden.PAUSADO]: 3,
      [EnumEstatusOrden.CANCELADO]: 4,
    };

    const ordenadas = ordenes.sort(
      (a,b) => ordenPrioridad[a.estatus as EnumEstatusOrden] - ordenPrioridad[b.estatus as EnumEstatusOrden]
    )

    return ordenadas

  }

  obtenerTotalPorEstatus( estatus: EnumEstatusOrden){

    return this.graficaOrdenesEstatusTotalOrdenadas().find( o => o.estatus === estatus )?.total ?? 0

  }

}
