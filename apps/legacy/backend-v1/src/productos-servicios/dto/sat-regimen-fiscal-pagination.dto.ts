import { ApiProperty } from "@nestjs/swagger";
import { PaginationResponseDto } from "../../DTOs/pagination/pagination-response.dto";
import { SatRegimenFiscalResponseDto } from "./sat-regimen-fiscal-response.dto";
import { Type } from "class-transformer";

export class SatRegimenFiscalPaginationDto extends PaginationResponseDto {

    @ApiProperty({type: [SatRegimenFiscalResponseDto], description: 'Listado de Regímenes Fiscales'})
    @Type( () => SatRegimenFiscalResponseDto )
    satRegimenesFiscales: SatRegimenFiscalResponseDto[];

}