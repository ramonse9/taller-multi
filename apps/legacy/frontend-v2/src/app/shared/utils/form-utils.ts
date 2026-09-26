import {
  AbstractControl,
  FormArray,
  FormGroup,
  ValidationErrors,
  ValidatorFn,
} from '@angular/forms';
import { EnumZonaHoraria } from '@shared/enums/general-estatus.enum';

import { format, parseISO, parse, formatISO } from 'date-fns';
import { toZonedTime, fromZonedTime, formatInTimeZone } from 'date-fns-tz';

async function sleep() {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(true);
    }, 2500);
  });
}

export class FormUtils {
  // Expresiones regulares
  static namePattern = '([a-zA-Z]+) ([a-zA-Z]+)';
  static emailPattern = '^[a-z0-9._%+-]+@[a-z0-9.-]+\\.[a-z]{2,4}$';
  static notOnlySpacesPattern = '^[a-zA-Z0-9]+$';
  static slugPattern = '^[a-z0-9_]+(?:-[a-z0-9_]+)*$';
  static phonePattern = '^[0-9]{10}$';

  static getTextError(errors: ValidationErrors) {
    for (const key of Object.keys(errors)) {
      switch (key) {
        case 'required':
          return 'Este campo es requerido';

        case 'minlength':
          return `Mínimo de ${errors['minlength'].requiredLength} caracteres.`;

        case 'maxlength':
          return `Máximo de ${errors['maxlength'].requiredLength} caracteres.`;

        case 'min':
          return `Valor mínimo de ${errors['min'].min}`;

        case 'email':
          return `El valor ingresado no es un correo electrónico`;

        case 'emailTaken':
          return `El correo electrónico ya está siendo usado por otro usuario`;

        case 'noStrider':
          return `No se puede usar el username de strider en la app`;

        case 'pattern':
          if (errors['pattern'].requiredPattern === FormUtils.emailPattern) {
            return 'El valor ingresado no luce como un correo electrónico';
          }

          if (errors['pattern'].requiredPattern === FormUtils.phonePattern) {
            return 'El valor ingresado debe ser un número telefónico de 10 dígitos';
          }

          //if (errors['pattern'].requiredPattern === FormUtils.phonePattern) {
          //  return 'El valor ingresado no luce como un numero telefónico de 10 dígitos';
          //}

          return 'Error de patrón contra expresión regular';

        default:
          return `Error de validación no controlado ${key}`;
      }
    }

    return null;
  }

  static isValidField(form: FormGroup, fieldName: string): boolean | null {
    return (
      !!form.controls[fieldName].errors && form.controls[fieldName].touched
    );
  }

  static getFieldError(form: FormGroup, fieldName: string): string | null {
    if (!form.controls[fieldName]) return null;

    const errors = form.controls[fieldName].errors ?? {};

    return FormUtils.getTextError(errors);
  }

  static getControlErrors( control: AbstractControl ){

    const errors: ValidationErrors = control.errors || {}

    return control.touched && Object.keys(errors).length > 0
      ? FormUtils.getTextError( errors )
      : null

  }

  static isValidFieldInArray(formArray: FormArray, index: number) {
    return (
      formArray.controls[index].errors && formArray.controls[index].touched
    );
  }

  static getFieldErrorInArray(
    formArray: FormArray,
    index: number
  ): string | null {
    if (formArray.controls.length === 0) return null;

    const errors = formArray.controls[index].errors ?? {};

    return FormUtils.getTextError(errors);
  }

  static isFieldOneEqualFieldTwo(field1: string, field2: string) {
    return (formGroup: AbstractControl) => {
      const field1Value = formGroup.get(field1)?.value;
      const field2Value = formGroup.get(field2)?.value;

      return field1Value === field2Value ? null : { passwordsNotEqual: true };
    };
  }

  static async checkingServerResponse(
    control: AbstractControl
  ): Promise<ValidationErrors | null> {

    await sleep(); // 2 segundos y medio

    const formValue = control.value;

    if (formValue === 'hola@mundo.com') {
      return {
        emailTaken: true,
      };
    }

    return null;
  }

  /*
  static notStrider(control: AbstractControl): ValidationErrors | null {
    const value = control.value;

    return value === 'strider' ? { noStrider: true } : null;
  }*/


  static dateFormatISOToDisplay(isoDate: string):string{

    if( !isoDate ) return ''

    const date = new Date( isoDate );
    return date.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric'});
    //return date.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric'});
    //return date.toLocaleDateString('es-ES',{ timeZoneName: hour: '2-digit', minute: '2-digit'});
    //return date.toLocaleTimeString('es-ES');

  }

  /*
  static dateFormatISOToDisplayHour(isoDate: string):string{

    if( !isoDate ) return ''

    const date = new Date( isoDate );

    return date.toLocaleString('es-MX', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: false, timeZone: 'America/Mazatlan' })
            .replace(',','')
            .replace(/\//g, '-');

  }*/

  /*
  static dateFormatISOToUTCLocalDisplayHour(isoDate: string):string{

    if( !isoDate ) return ''

    const date = new Date( isoDate );

    return date.toLocaleString('es-MX', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: false, timeZone: 'America/Mazatlan' })
            .replace(',','')
            .replace(/\//g, '-');

  }*/

  /*
  static dateFormatDisplayToISO( displayDate: string | undefined ): string{

    if( !displayDate ) return ''

    const [day, month, year] = displayDate.split('/').map(Number);
    const date = new Date(year, month - 1, day);
    return date.toISOString();

  }*/

  /*
  static dateFormatDisplayToISOHour( displayDate: string | undefined ): string{

    if( !displayDate ) return ''

    const [fechaPart, horaPart] = displayDate.split(' ');

    //const [day, month, year] = fechaPart.split('-').map(Number);
    const [day, month, year] = fechaPart.split('-').map(Number);
    const [hora, minuto] = horaPart.split(':').map(Number);

    const date = new Date( Date.UTC( year, month - 1, day, hora, minuto) );

    return date.toISOString();
  }*/

  static dateFormat(isoDate: string):string{

    if( !isoDate ) return ''

    return new Date( isoDate ).toString();
    //return date.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric'});
    //return date.toLocaleDateString('es-ES',{ timeZoneName: hour: '2-digit', minute: '2-digit'});
    //return date.toLocaleTimeString('es-ES');
  }

  static dateFormatCustomyyyymmdd( fecha: Date):string{

    const newDate = format( fecha, 'yyyy-MM-dd HH:mm:ss');

    return newDate;

  }

  static dateLocal(isoDate: string):Date | null{

    if( !isoDate ) return null

    return new Date( isoDate );
  }

  static addDays(date: Date, days: number): Date{
    const result = new Date(date)
    result.setDate(result.getDate() + days)
    return new Date( result )
  }

  /*static dateUTCToZonedTime( fechaUTC: string, zonaHoraria: string = EnumZonaHoraria.America_Mazatlan ){

    const fechaZonificada = toZonedTime( fechaUTC, zonaHoraria );
    const fechaFormateada = format( fechaZonificada, 'dd-MM-yyyy HH:mm' )

    return fechaFormateada

  }*/

  /*

  import { fromZonedTime, toZonedTime, format, formatInTimeZone } from 'date-fns-tz';

  */

  /*static dateToISOString(date: string){

    if( !date ) return '';

    const parsed = parse( date, 'dd-MM-yyyy HH:mm', new Date())
    return parsed.toISOString()

  }*/

  /*static dateFromISOStringToLocalDisplay( isoDate: string, zonaHoraria: string = EnumZonaHoraria.America_Mazatlan ){

    if( !isoDate ) return '';

    const fechaUTC = parseISO( isoDate ) // convierte string ISO a Date
    const fechaLocal = toZonedTime( fechaUTC, zonaHoraria ) // convierte a hora local
    return format( fechaLocal, 'dd-MM-yyyy HH:mm') // formato display

  }*/

  //--------------------------

  static fechaFormatISO( fecha: Date ){

    return formatISO( fecha)

  }

  static fechaFormatLocal( fecha: Date, claveZonaHoraria: string ){


    return formatInTimeZone( fecha, claveZonaHoraria, "dd-MM-yyyy HH:mmXXX" );
    //return format( fecha, 'dd-MM-yyyy HH:mm', { timeZone: claveZonaHoraria })

  }

  static formatLocalDisplayToOffset(fechaLocal: string, zonaHoraria: string = EnumZonaHoraria.America_Mazatlan): string {
    if (!fechaLocal) return '';

    try {

      // Parseamos la fecha local según el formato del input
      const parsedLocal = parse(fechaLocal, 'dd-MM-yyyy HH:mm', new Date());


              // Convertimos la fecha local a UTC
              //const fechaUTC = fromZonedTime(parsedLocal, zonaHoraria);

              // Serializamos como ISO string
              //return fechaUTC.toISOString();
      return parsedLocal.toISOString();
    } catch (e) {
      return '';
    }
  }

  static fechaToUtcFromLocal( fecha: Date, claveTimezone: string){

    const fechaUtc = fromZonedTime( fecha, claveTimezone )

    return fechaUtc.toISOString()

  }

  static fechaParseISOTOUtc( fecha: Date, claveTimeZone: string){

    const fechaUTC = toZonedTime(fecha, claveTimeZone);

    return formatISO(fechaUTC, { representation: 'complete' });

  }

  static formatLocalDisplayToISOString(fechaLocal: string, zonaHoraria: string = EnumZonaHoraria.America_Mazatlan): string {
    if (!fechaLocal) return '';

    try {
      // Parseamos la fecha local según el formato del input
      const parsedLocal = parse(fechaLocal, 'dd-MM-yyyy HH:mm', new Date());

      // Convertimos la fecha local a UTC
      const fechaUTC = fromZonedTime(parsedLocal, zonaHoraria);

      // Serializamos como ISO string
      return fechaUTC.toISOString();
    } catch (e) {
      return '';
    }
  }

  //--------------------------
  static formatIsoStringToLocalDisplay(fecha: string, zonaHoraria: string = EnumZonaHoraria.America_Mazatlan): string {

    if (!fecha) return '';

    let fechaDate: Date;

    // Detecta si es ISO (contiene 'T' y 'Z' o '+00')
    const esISO = /\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(Z|[\+\-]\d{2}:\d{2})?/.test(fecha);

    try {
      fechaDate = esISO ? parseISO(fecha) : parse(fecha, 'dd-MM-yyyy HH:mm', new Date());
    } catch (e) {
      return '';
    }

          //const fechaLocal = toZonedTime(fechaDate, zonaHoraria);

          //return format(fechaLocal, 'dd-MM-yyyy HH:mm');
    return format(fechaDate, 'dd-MM-yyyy HH:mm');
  }

  static formatToStringDecimals( value: unknown, decimales: number = 2 ): string{

    const num = typeof value === 'string' ? Number( value ) : value;

    if( typeof num !== 'number' || isNaN(num)){
      return '';
    }

    return num.toFixed( decimales )

  }

  static minLengthArray(min: number): ValidatorFn{
    return(control: AbstractControl): ValidationErrors | null => {
      if( control.value && control.value.length >= min ) {
        return null
      }
      return { minLengthArray: { valid: false } }
    }
  }

}
