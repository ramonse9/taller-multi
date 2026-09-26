import { ApiProperty } from "@nestjs/swagger";
import { PaginationResponseDto } from "../../DTOs/pagination/pagination-response.dto";
import { ProductoServicioResponseDto } from "./producto-servicio-response.dto";
import { Type } from "class-transformer";

export class ProductoServicioPaginationDto extends PaginationResponseDto{

    @ApiProperty({type: [ProductoServicioResponseDto], description: 'Listado de Productos y Servicios'})
    @Type( () => ProductoServicioResponseDto )
    productosServicios: ProductoServicioResponseDto[];

}