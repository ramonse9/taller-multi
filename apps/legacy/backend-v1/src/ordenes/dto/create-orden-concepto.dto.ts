import { ApiProperty } from "@nestjs/swagger";
import { Type } from "class-transformer";
import { IsDecimal, IsDefined, IsIn, IsNotEmpty, IsNumber, IsString, Matches, MaxLength, Min } from "class-validator";

export class CreateOrdenConceptoDto{

    @ApiProperty({ example: 1, description: 'Cantidad del producto/servicio' })
    @Type(() => Number)
    @IsNumber({ maxDecimalPlaces: 0 }, { message: 'La cantidad debe ser un número entero sin decimales.' })
    @Min(1, { message: 'La cantidad debe ser al menos 1.' })
    @IsDefined({message: 'La cantidad del producto o servicio es obligatorio para cada concepto.'})
    cantidad: number;

    @ApiProperty({
        example: 'producto',
        description: 'Tipo de concepto (producto ó servicio)',
        enum: ['producto', 'servicio'], // Swagger mostrará las opciones válidas
    })
    @IsIn(['producto', 'servicio'], { message: 'El tipo debe ser "producto" o "servicio".' })
    @IsDefined({message: 'El tipo del producto o servicio es obligatorio para cada concepto.'})
    tipo: 'producto' | 'servicio'; // aquí defines el tipo literal en TS

    @ApiProperty({ example: 'PROD000001', description: 'ID del producto o servicio asociado al concepto' })
    @IsString({ message: 'El ID del producto o servicio debe ser una cadena de texto.' })
    @IsDefined({message: 'El ID del producto o servicio es obligatorio para cada concepto.'})
    id_producto_servicio: string;
    
}