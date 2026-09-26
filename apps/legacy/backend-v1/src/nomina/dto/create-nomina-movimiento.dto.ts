import { ApiProperty } from "@nestjs/swagger";
import { Transform } from "class-transformer";
import { IsDateString, IsDecimal, IsNotEmpty, Matches} from "class-validator";

export class CreateNominaMovimientoDto {

    @ApiProperty({ example: '2000', description: 'Salario Base' })
    @IsNotEmpty({ message: 'El salario base es obligatorio para cada empleado.' })
    @IsDecimal({ decimal_digits: '0,2' }, { message: 'El salario base solo puede tener máximo 2 decimales' })
    @Matches(/^(?!-)(\d+)(\.\d{1,2})?$/, {
        message: 'El salario base no puede ser negativo y debe tener máximo 2 decimales',
    })
    salarioBase: string;

    @ApiProperty({ example: '2000', description: 'Total Percepciones' })
    @IsNotEmpty({ message: 'El Total de Percepciones es obligatorio para cada movimiento.' })
    @IsDecimal({ decimal_digits: '0,2' }, { message: 'El Total de Percepciones solo puede tener máximo 2 decimales' })
    @Matches(/^(?!-)(\d+)(\.\d{1,2})?$/, {
        message: 'El Total de Percepciones no puede ser negativo y debe tener máximo 2 decimales',
    })
    totalPercepciones: string;

    @ApiProperty({ example: '2000', description: 'Total Deducciones' })
    @IsNotEmpty({ message: 'El Total de Deducciones es obligatorio para cada movimiento.' })
    @IsDecimal({ decimal_digits: '0,2' }, { message: 'El Total de Deducciones solo puede tener máximo 2 decimales' })
    @Matches(/^(?!-)(\d+)(\.\d{1,2})?$/, {
        message: 'El Total de Deducciones no puede ser negativo y debe tener máximo 2 decimales',
    })
    totalDeducciones: string;

    @ApiProperty({ example: '2000', description: 'Total Neto' })
    @IsNotEmpty({ message: 'El Total Neto es obligatorio para cada movimiento.' })
    @IsDecimal({ decimal_digits: '0,2' }, { message: 'El Total Neto solo puede tener máximo 2 decimales' })
    @Matches(/^(?!-)(\d+)(\.\d{1,2})?$/, {
        message: 'El Total Neto no puede ser negativo y debe tener máximo 2 decimales',
    })
    totalNeto: string;

    @ApiProperty({ example: '2026-02-23T12:00:00Z', description: 'Fecha del Movimiento' })
    @IsDateString()
    fecha: string;

    @ApiProperty({example: 'EMP000123', description: 'ID del Empleado'})
    @IsNotEmpty({message: 'Debe de incluir un Empleado'})
    @Transform(({value}) => value?.toLowerCase())
    id_empleado: string

    @ApiProperty({example: 123, description: 'ID del Periodo'})
    @IsNotEmpty({message: 'Debe de incluir un Periodo'})
    //@Transform(({value}) => value?.toLowerCase())
    id_periodo: number

    //TODO
    //nominaMovimientoDetalles

}
