import { ApiProperty, PartialType } from '@nestjs/swagger';
import { CreateEmisorDto } from './create-emisor.dto';
import { IsNotEmpty, IsString } from 'class-validator';

export class UpdateEmisorDto extends PartialType(CreateEmisorDto) {

    @ApiProperty({ example: '123456789', description: 'Password'})
    @IsNotEmpty({message:'El password no puede estar vacío'})
    @IsString()
    contrasena: string;
}
