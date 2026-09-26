import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, Length } from 'class-validator';
import { Transform } from 'class-transformer';

export class UpdateCotizacionDto {
        
    @ApiProperty({example: 'Descripción breve de lo que se hará en esta Cotizacion', description: 'Descripción de la Cotizacion'})
    @IsOptional()
    @IsString({message: 'La descripcion debe ser un texto'})
    descripcion?: string;

    @ApiProperty({example: 'ORD000123', description: 'Orden'})
    @IsOptional()
    @IsString()
    @Length(6, 9, {message: 'La Orden debe ser de 9 caracteres'})    
    @Transform( ({value}) => value?.toLowerCase() )
    id_orden?: string;

}
