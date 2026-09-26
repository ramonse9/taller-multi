import { EmpleadoResponseDto } from './empleado-response.dto';
import { PaginationResponseDto } from '../../DTOs/pagination/pagination-response.dto';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class EmpleadoPaginationDto extends PaginationResponseDto{

    @ApiProperty({ type: [EmpleadoResponseDto], description: 'Listado de Empleados'})    
    @Type( () => EmpleadoResponseDto )
    empleados: EmpleadoResponseDto[];

}