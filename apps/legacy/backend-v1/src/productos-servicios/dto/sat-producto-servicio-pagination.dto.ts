import { ApiProperty } from "@nestjs/swagger";
import { PaginationResponseDto } from "../../DTOs/pagination/pagination-response.dto";
import { SatProductoServicioResponseDto } from "./sat-producto-servicio-response.dto";
import { Type } from "class-transformer";

export class SatProductoServicioPaginationDto extends PaginationResponseDto{

    @ApiProperty({type: [SatProductoServicioResponseDto], description: 'Listado de Productos y Servicios'})
    @Type( () => SatProductoServicioResponseDto )
    satProductosServicios: SatProductoServicioResponseDto[];

}