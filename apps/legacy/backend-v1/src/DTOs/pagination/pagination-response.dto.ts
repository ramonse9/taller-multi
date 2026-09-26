import { ApiProperty } from "@nestjs/swagger";

export class PaginationResponseDto{
    @ApiProperty({type: Number, description: 'Página actual' })
    page: number;

    @ApiProperty({type: Number, description: 'Límite de registros por página' })
    limit: number;

    @ApiProperty({type: Number, description: 'Cantidad total de registros encontrados' })
    totalItems: number;

    @ApiProperty({type: Number, description: 'Cantidad total de páginas' })
    totalPages: number;

    @ApiProperty({type: Boolean, description: 'Indica si hay una página siguiente' })
    hasNextPage: boolean;

}