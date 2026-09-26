import { ApiProperty, PartialType } from '@nestjs/swagger';
import { CreateServicioDto } from './create-servicio.dto';
import { IsBoolean, IsOptional } from 'class-validator';

export class UpdateServicioDto extends PartialType(CreateServicioDto) {
    @ApiProperty({required: false, default: true})
    @IsOptional()
    @IsBoolean()
    activo?: boolean;
}
