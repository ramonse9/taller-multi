import { ApiProperty } from "@nestjs/swagger";
import { Type } from "class-transformer";
import { ArrayMaxSize, IsInt } from "class-validator";

export class NominaPeriodosMovimientosDto{

    @ApiProperty({description: 'Ids Periodos', example: [6,7,8,9], type: Number, isArray: true})
    @Type( () => Number)
    @IsInt({each: true})
    @ArrayMaxSize(5)
    ids_periodos: number[];

}