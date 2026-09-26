import { ApiProperty } from "@nestjs/swagger";
import { PaginationResponseDto } from "../../DTOs/pagination/pagination-response.dto";
import { Type } from "class-transformer";
import { GastoResponseDto } from "./gasto-response.dto";

export class GastoPaginationDto extends PaginationResponseDto{

    @ApiProperty({ type: [GastoResponseDto], description: 'Listado de Gastos'})
    @Type( () => GastoResponseDto )
    gastos: GastoResponseDto[];
    
}