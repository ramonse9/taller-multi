import { ApiProperty } from "@nestjs/swagger";
import { Type } from "class-transformer";
import { PaginationResponseDto } from "./../../DTOs/pagination/pagination-response.dto";
import { CotizacionResponseDto } from "./cotizacion-response.dto";

export class CotizacionPaginationDto extends PaginationResponseDto{
    @ApiProperty({type: [CotizacionResponseDto], description: 'Listado de Cotizaciones'})
    @Type( () => CotizacionResponseDto)
    cotizaciones: CotizacionResponseDto[]
}