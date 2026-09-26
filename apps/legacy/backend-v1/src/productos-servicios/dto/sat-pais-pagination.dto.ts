import { ApiProperty } from "@nestjs/swagger";
import { PaginationResponseDto } from "../../DTOs/pagination/pagination-response.dto";
import { SatPaisResponseDto } from "./sat-pais-response.dto";
import { Type } from "class-transformer";

export class SatPaisPaginationDto extends PaginationResponseDto{

    @ApiProperty({type: [SatPaisResponseDto], description: 'Listado de Países'})
    @Type( () => SatPaisResponseDto )
    satPaises: SatPaisResponseDto[];    

}