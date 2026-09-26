import { PaginationResponseDto } from "../../DTOs/pagination/pagination-response.dto";
import { ApiProperty } from '@nestjs/swagger';
import { ModeloResponseDto } from './modelo-response.dto';


export class ModeloPaginationDto extends PaginationResponseDto{

    @ApiProperty({type: [ModeloResponseDto], description: 'Listado de Modelos' })
    modelos: ModeloResponseDto[]

}