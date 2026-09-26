import { fromZonedTime, toZonedTime } from "date-fns-tz";

export function dateIsDistinctMonthAndYear( dateA: Date, dateB: Date): boolean {
    return dateA.getFullYear() !== dateB.getFullYear() ||
              dateA.getMonth() !== dateB.getMonth();
}

export function dateIsGreaterThan(dateA: Date, dateB: Date): boolean{
    return dateA.getTime() > dateB.getTime();
}

export function dateGetHoursDifference(fechaInicio: Date, fechaFin: Date): number{

    const milisegundosPorHora = 1000 * 60 * 60;
    const diferenciaEnMilisegundos = fechaFin.getTime() - fechaInicio.getTime();
    return diferenciaEnMilisegundos / milisegundosPorHora;

}

export function obtenerFechaToZonedTime( fecha: Date, claveZonaHoraria: string ){

      const fechaToZonedTime = toZonedTime(fecha, claveZonaHoraria)

      return fechaToZonedTime
    
}

export function obtenerFechaFromZonedTime( fecha: Date, claveZonaHoraria: string ){
    
    const fechaFromZonedTime = fromZonedTime( fecha, claveZonaHoraria )

    return fechaFromZonedTime;

}


