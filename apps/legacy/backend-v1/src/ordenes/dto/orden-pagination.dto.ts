import { ApiProperty } from "@nestjs/swagger";
import { OrdenResponseDto } from "./orden-response.dto";
import { PaginationResponseDto } from "../../DTOs/pagination/pagination-response.dto";
import { Type } from "class-transformer";

export class OrdenPaginationDto extends PaginationResponseDto{

    @ApiProperty({ type: [OrdenResponseDto], description: 'Listado de Órdenes'})
    @Type( () => OrdenResponseDto )
    ordenes: OrdenResponseDto[];
    
}