export interface PeriodosMovimientosTotalesResponse {
    granTotalMes:   GranTotalMes;
    nominaPeriodos: NominaPeriodoTotal[];
}

export interface GranTotalMes {
    neto:         number;
    percepciones: number;
    deducciones:  number;
}

export interface NominaPeriodoTotal {
    id:                number;
    nombre:            string;
    fechaInicio:       Date;
    fechaFin:          Date;
    totalNeto:         string;
    totalPercepciones: string;
    totalDeducciones:  string;
}
