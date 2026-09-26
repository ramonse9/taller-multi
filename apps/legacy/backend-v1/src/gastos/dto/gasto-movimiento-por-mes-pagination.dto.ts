import { ApiProperty } from "@nestjs/swagger";
import { Type } from "class-transformer";
import { IsInt, Max, Min } from "class-validator";
import { PaginationQueryDto } from "../../DTOs/pagination/pagination-query.dto";

export class GastoMovimientoPorMesPaginationDto extends PaginationQueryDto{

    @ApiProperty({description: 'Mes (1-12)', example: 2})
    @Type(() => Number)
    @IsInt()
    @Min(1)
    @Max(12)
    mes: number;

    @ApiProperty({description: 'Año', example: 2026})
    @Type(() => Number)
    @IsInt()
    @Min(2000)
    @Max(2100)
    anio: number;
    
}