import { ApiProperty } from "@nestjs/swagger";
import { PaginationResponseDto } from "../../DTOs/pagination/pagination-response.dto";
import { EmpresaResponseDto } from "./empresa-response.dto";

export class EmpresaPaginationDto extends PaginationResponseDto{

    @ApiProperty({type: [EmpresaResponseDto], description: 'Listado de Empresas'})
    empresas: EmpresaResponseDto[];

}