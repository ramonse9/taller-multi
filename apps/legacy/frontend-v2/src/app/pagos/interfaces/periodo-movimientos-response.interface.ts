export interface PeriodoMovimientosResponse {
    empleadosConMovimientos: EmpleadoConMovimiento[];
}

export interface Movimiento {
    id:                       string;
    salarioBase:              string;
    totalPercepciones:        string;
    totalDeducciones:         string;
    totalNeto:                string;
    fecha:                    Date;
    estatus:                  string;
    detalles: any[];
}

export interface EmpleadoConMovimiento {
    id:          string;
    nombre:      string;
    salarioBase: string;
    activo:      boolean;
    movimiento?: Movimiento | null;
}
