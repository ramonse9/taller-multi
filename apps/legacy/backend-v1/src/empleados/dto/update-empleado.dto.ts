import { ApiProperty, PartialType } from '@nestjs/swagger';
import { IsBoolean, IsOptional } from 'class-validator';
import { CreateEmpleadoDto } from './create-empleado.dto';

export class UpdateEmpleadoDto extends PartialType(CreateEmpleadoDto) {
    @ApiProperty({required: false, default: true})
    @IsOptional()
    @IsBoolean()
    activo?: boolean;
}
