import { ApiProperty } from "@nestjs/swagger";
import { Type } from "class-transformer";
import { PaginationResponseDto } from "../../DTOs/pagination/pagination-response.dto";
import { SatImpuestoPorcentajeResponseDto } from "./sat-impuesto-porcentaje-response.dto";

export class SatImpuestoPorcentajePaginationDto extends PaginationResponseDto{

    @ApiProperty({type: [SatImpuestoPorcentajeResponseDto], description: 'Listado de Impuestos y Porcentajes'})
    @Type( () => SatImpuestoPorcentajeResponseDto )
    satImpuestosPorcentajes: SatImpuestoPorcentajeResponseDto[];    

}