import { ApiProperty } from "@nestjs/swagger";
import { Type } from "class-transformer";
import { PaginationResponseDto } from "../../DTOs/pagination/pagination-response.dto";
import { SatImpuestoResponseDto } from './sat-impuesto-response.dto';

export class SatImpuestoPaginationDto extends PaginationResponseDto{

    @ApiProperty({type: [SatImpuestoResponseDto], description: 'Listado de Impuestos'})
    @Type( () => SatImpuestoResponseDto )
    satImpuestos: SatImpuestoResponseDto[];    

}