import { ApiProperty } from "@nestjs/swagger";
import { Type } from "class-transformer";
import { GastoConMovimientosResponseDto } from "./gasto-con-movimientos-response.dto";

export class GastoConMovimientosDto{

    @ApiProperty({type: Number, description: 'Cantidad total de Gastos encontrados' })
    totalItems: number;

    @ApiProperty({ type: [GastoConMovimientosResponseDto], description: 'Listado de Gastos con Movimientos'})
    @Type( () => GastoConMovimientosResponseDto )
    gastosConMovimientos: GastoConMovimientosResponseDto[];
    
}