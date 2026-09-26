import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsNotEmpty, MinLength, MaxLength } from 'class-validator';

export class CreateCompaniaTipoGiroDto {

    @ApiProperty({example: 'CARROCERIA', description: 'Tipo de Negocio'})
    @IsNotEmpty({message: 'El tipo de negocio no puede estar vacía'})
    @MinLength(2,{message: 'El tipo de negocio debe tener al menos 2 caracteres'})
    @MaxLength(30,{message: 'El tipo de negocio no puede tener mas de 30 caracteres'})
    @Transform(({value}) => value?.toLowerCase())
    tipo: string;
    
}
