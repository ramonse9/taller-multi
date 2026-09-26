import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsNotEmpty, MinLength } from 'class-validator';

export class UpdateModeloDto {

    @ApiProperty({example: 'sentra', description: 'Nombre del Modelo'})
    @IsNotEmpty({message: 'El nombre del modelo no pede estar vacía'})
    @MinLength(2, {message: 'El nombre del modelo debe tener al menos 2 caracteres'})
    @Transform(({value}) => value?.toLowerCase())
    nombre: string

}
