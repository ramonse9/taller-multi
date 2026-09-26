import { ApiPropertyOptional } from "@nestjs/swagger";
import { PaginationQueryDto } from "../../DTOs/pagination/pagination-query.dto";
import { IsIn, IsOptional } from "class-validator";

export class PaginationQueryProductosServiciosDto extends PaginationQueryDto{
    
    @ApiPropertyOptional({
        example: 'producto',
        description: 'Filtrar por tipo: producto o servicio',
        enum: ['producto','servicio']
    })
    @IsOptional()
    @IsIn(['producto','servicio'])
    tipo?: string;

}