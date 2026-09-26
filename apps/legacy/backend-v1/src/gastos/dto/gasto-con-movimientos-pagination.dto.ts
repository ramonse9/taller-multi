import { ApiProperty } from "@nestjs/swagger";
import { PaginationResponseDto } from "../../DTOs/pagination/pagination-response.dto";
import { Type } from "class-transformer";
import { GastoConMovimientosResponseDto } from "./gasto-con-movimientos-response.dto";

export class GastoConMovimientosPaginationDto extends PaginationResponseDto{

    @ApiProperty({ type: [GastoConMovimientosResponseDto], description: 'Listado de Gastos con Movimientos'})
    @Type( () => GastoConMovimientosResponseDto )
    gastosConMovimientos: GastoConMovimientosResponseDto[];
    
}