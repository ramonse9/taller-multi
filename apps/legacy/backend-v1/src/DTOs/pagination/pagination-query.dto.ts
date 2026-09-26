import { ApiPropertyOptional } from "@nestjs/swagger";
import { Transform, Type } from "class-transformer";
import { IsNumber, IsOptional, IsString } from "class-validator";

export class PaginationQueryDto{
    @ApiPropertyOptional({ description: 'Número de página', default: 0 })
    @IsOptional()
    @Type( () => Number )
    @IsNumber()
    page?: number = 1;

    @ApiPropertyOptional({description: 'Límite de resultados por página', default: 10})
    @IsOptional()
    @Type(() => Number)
    @IsNumber()
    limit?: number = 6;

    @ApiPropertyOptional({description: 'Texto de búsqueda', default: ''})
    @IsOptional()
    @IsString()
    @Transform(({ value }) => value?.toLowerCase().trim())
    fSearch?: string = '';
}