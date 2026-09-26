import { ApiProperty } from "@nestjs/swagger";
import { PaginationResponseDto } from "../../DTOs/pagination/pagination-response.dto";
import { VehiculoResponseDto } from "./vehiculo-response.dto";
import { Type } from "class-transformer";

export class VehiculoPaginationDto extends PaginationResponseDto{

    @ApiProperty({type: [VehiculoResponseDto], description: 'Listado de Vehículos' })
    @Type( () => VehiculoResponseDto )
    vehiculos: VehiculoResponseDto[];

}