import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { Transform, Type } from "class-transformer";
import { IsInt, IsOptional, IsString, Max, Min } from "class-validator";

export class NominaMovimientosPorMesDto{

    @ApiProperty({description: 'Mes (1-12)', example: 2})
    @Type(() => Number)
    @IsInt()
    @Min(1)
    @Max(12)
    mes: number;

    @ApiProperty({description: 'Año', example: 2026})
    @Type(() => Number)
    @IsInt()
    @Min(2000)
    @Max(2100)
    anio: number;

    @ApiPropertyOptional({description: 'Texto de búsqueda', default: ''})
    @IsOptional()
    @IsString()
    @Transform(({ value }) => value?.toLowerCase().trim())
    fSearch?: string = '';
    
}