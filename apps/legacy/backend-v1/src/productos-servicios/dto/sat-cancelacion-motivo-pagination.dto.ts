import { ApiProperty } from "@nestjs/swagger";
import { PaginationResponseDto } from "../../DTOs/pagination/pagination-response.dto";
import { Type } from "class-transformer";
import { SatCancelacionMotivoResponseDto } from "./sat-cancelacion-motivo-response.dto";

export class SatCancelacionMotivoPaginationDto extends PaginationResponseDto{

    @ApiProperty({type: [SatCancelacionMotivoResponseDto], description: 'Listado de Cancelaciones Motivos'})
    @Type( () => SatCancelacionMotivoResponseDto )
    satCancelacionesMotivos: SatCancelacionMotivoResponseDto[];    

}