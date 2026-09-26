import { ApiProperty, PartialType } from '@nestjs/swagger';
import { CreateGastoDto } from './create-gasto.dto';
import { IsBoolean, IsOptional } from 'class-validator';


export class UpdateGastoDto extends PartialType(CreateGastoDto) {

    @ApiProperty({ example: false, description: 'Si el gasto está activo' })  
    @IsBoolean()
    @IsOptional()
    activo?: boolean;

}
