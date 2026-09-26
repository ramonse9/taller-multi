import { ApiProperty } from "@nestjs/swagger";
import { PaginationResponseDto } from "../../DTOs/pagination/pagination-response.dto";
import { SatEstadoResponseDto } from "./sat-estado-response.dto";
import { Type } from "class-transformer";

export class SatEstadoPaginationDto extends PaginationResponseDto{

    @ApiProperty({type: [SatEstadoResponseDto], description: 'Listado de Estados'})
    @Type( () => SatEstadoResponseDto )
    satEstados: SatEstadoResponseDto[];    

}