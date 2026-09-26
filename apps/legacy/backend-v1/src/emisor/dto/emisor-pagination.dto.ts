import { ApiProperty } from "@nestjs/swagger";
import { PaginationResponseDto } from "../../DTOs/pagination/pagination-response.dto";
import { EmisorResponseDto } from './emisor-response.dto';

export class EmisorPaginationDto extends PaginationResponseDto{

    /*@ApiProperty({ type: [OrdenResponseDto], description: 'Listado de Órdenes'})
    ordenes: OrdenResponseDto[];*/

    @ApiProperty({ type: [EmisorResponseDto], description: 'Listado de Emisores'})
    emisores: EmisorResponseDto[];
}