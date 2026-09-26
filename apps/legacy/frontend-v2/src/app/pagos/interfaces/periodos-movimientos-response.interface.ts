export interface PeriodosMovimientosResponse {
    periodos:         Periodo[];
    granTotalGeneral: number;
}

export interface Periodo {
    idPeriodo:     number;
    nombrePeriodo: string;
    rangoFechas:   string;
    totalPeriodo:  number;
    empleados:     Empleado[];
}

export interface Empleado {
    id:          string;
    nombre:      string;
    salarioBase: string;
    totalNeto:   number;
    fecha:       Date | null;
}
