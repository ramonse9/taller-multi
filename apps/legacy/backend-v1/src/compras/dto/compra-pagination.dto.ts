import { ApiProperty } from "@nestjs/swagger";
import { PaginationResponseDto } from "../../DTOs/pagination/pagination-response.dto";
import { Type } from "class-transformer";
import { CompraResponseDto } from "./compra-response.dto";
import { Compra } from "../entities/compra.entity";

export class CompraPaginationDto extends PaginationResponseDto{

    @ApiProperty({ type: [CompraResponseDto], description: 'Listado de Órdenes'})
    @Type( () => CompraResponseDto )
    compras: Compra[];
    //compras: CompraResponseDto[];
    
}