import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsNotEmpty, MinLength, MaxLength } from 'class-validator';

export class CreateMarcaDto {

    @ApiProperty({example: 'nissan', description: 'Nombre de la Marca'})
    @IsNotEmpty({message: 'El Nombre de la marca no puede estar vacía'})
    @MinLength(2,{message: 'El nombre de la marca debe tener al menos 2 caracteres'})
    @MaxLength(30,{message: 'El nombre de la marca no puede tener mas de 30 caracteres'})
    @Transform(({value}) => value?.toLowerCase())
    nombre: string;
}
