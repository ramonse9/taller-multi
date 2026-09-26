import { ApiProperty } from "@nestjs/swagger";
import { Transform } from "class-transformer";
import { IsEmpty, IsNotEmpty, IsOptional, Length, MaxLength } from "class-validator";

export class CreateOrdenNotaDto {

    @ApiProperty({example: 'ORD000123', description: 'Orden de la Nota' })
    @IsNotEmpty({message: 'La orden no puede estar vacía'})
    @Length(9, 9, {message: 'La orden debe ser de 9 caracteres'})
    @Transform(({value}) => value?.toLowerCase())
    id_orden: string
    
    @ApiProperty({example: 'Esta nota es para esta orden', description: 'Debes indicar una descripción' })
    @IsNotEmpty({ message: 'Debes agregar una nota'})
    @MaxLength(1000, {message: 'La nota no puede tener mas de 1000 caracteres'})
    nota: string
    
    
    @IsOptional()
    @MaxLength(3, {message: 'El estatus no puede tener mas de 3 caracteres'})
    @Transform(({value}) => value?.toLowerCase())
    estatus?: string
}