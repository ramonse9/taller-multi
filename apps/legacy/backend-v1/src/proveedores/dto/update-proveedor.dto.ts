import { ApiProperty, PartialType } from '@nestjs/swagger';
import { CreateProveedorDto } from './create-proveedor.dto';
import { IsBoolean, IsOptional } from 'class-validator';

export class UpdateProveedorDto extends PartialType(CreateProveedorDto) {

    @ApiProperty({ required: false, default: false })
    @IsOptional()
    @IsBoolean()
    activo?: boolean;

}
