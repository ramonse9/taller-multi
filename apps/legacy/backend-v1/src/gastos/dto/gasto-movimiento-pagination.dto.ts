import { ApiProperty } from "@nestjs/swagger";
import { PaginationResponseDto } from "../../DTOs/pagination/pagination-response.dto";
import { Type } from "class-transformer";
import { GastoMovimientoResponseDto } from "./gasto-movimiento-response.dto";

export class GastoMovimientoPaginationDto extends PaginationResponseDto{

    @ApiProperty({ type: [GastoMovimientoResponseDto], description: 'Listado de Movimientos Gastos'})
    @Type( () => GastoMovimientoResponseDto )
    gastosMovimientos: GastoMovimientoResponseDto[];
    
}