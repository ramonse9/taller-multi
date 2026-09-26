import { ApiProperty } from "@nestjs/swagger";
import { PaginationResponseDto } from "../../DTOs/pagination/pagination-response.dto";
import { SatUsoCFDIResponseDto } from "./sat-uso-cfdi-response.dto";
import { Type } from "class-transformer";

export class SatUsoCFDIPaginationDto extends PaginationResponseDto {

    @ApiProperty({type: [SatUsoCFDIResponseDto], description: 'Listado de Uso CFDI'})
    @Type( () => SatUsoCFDIResponseDto )
    satUsosCFDIs: SatUsoCFDIResponseDto[];

}