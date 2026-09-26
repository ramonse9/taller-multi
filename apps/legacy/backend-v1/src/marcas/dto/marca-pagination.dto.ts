import { PaginationResponseDto } from "../../DTOs/pagination/pagination-response.dto";
import { MarcaResponseDto } from './marca-response.dto';
import { ApiProperty } from "@nestjs/swagger";

export class MarcaPaginationDto extends PaginationResponseDto{

    @ApiProperty({type: [MarcaResponseDto], description: 'Listado de Marcas'})
    marcas: MarcaResponseDto[]

}