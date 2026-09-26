import { ApiProperty } from "@nestjs/swagger";
import { Transform } from "class-transformer";
import { IsDateString, IsEnum, IsInt, IsNotEmpty, Max, Min } from "class-validator";
import { EnumNominaPeriodicidad } from "../../commom/enums/general.enum";

export class CreateNominaPeriodoDto {

    @ApiProperty({example: '2026', description: 'Año de los periodos'})
    @IsInt({message: "El año debe ser un número entero"})
    @IsNotEmpty({message: 'El año no puede estar vacío'})
    @Min(1900, {message: 'El año no puede ser menor a 2026'})
    @Max(new Date().getFullYear() + 1, {message: `El año no puede ser mayor a ${ new Date().getFullYear() + 1 }`})
    @Transform( ({value}) => Number(value))
    anio: number
    
    @ApiProperty({example: 'semanal', description: 'Periodicidad de la nómina', enum: EnumNominaPeriodicidad})
    @IsEnum(EnumNominaPeriodicidad, {
        message: 'La periodicidad debe ser semanal, catorcenal_1, catorcenal_2 ó quincenal'
    })
    periodicidad: EnumNominaPeriodicidad;

    @ApiProperty({ example: '2026-02-23T12:00:00Z', description: 'Fecha fin del primer periodo' })
    @IsDateString()
    fechaFinPrimerPeriodo: string;

}
