import { ApiProperty } from "@nestjs/swagger";
import { EnumNominaPeriodicidad } from "./../../commom/enums/general.enum";

export class NominaPeriodoResponseDto{

    @ApiProperty({example: 123, description: 'Id del Periodo'})
    id: number; 

    @ApiProperty({example: 2026, description: 'Año de los periodos'})
    anio: number
    
    @ApiProperty({example: 'semanal', description: 'Periodicidad de la nómina', enum: EnumNominaPeriodicidad})
    periodicidad: EnumNominaPeriodicidad;
}