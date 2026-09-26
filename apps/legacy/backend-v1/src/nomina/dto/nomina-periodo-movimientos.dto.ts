import { ApiProperty } from "@nestjs/swagger";
import { Type } from "class-transformer";
import { IsNumber } from "class-validator";

export class NominaPeriodoMovimientosDto{

    @ApiProperty({description: 'Id de Periodo', example: 123, type: Number})
    @Type( () => Number)
    @IsNumber()
    id_periodo: number;
}