import { ApiProperty } from "@nestjs/swagger";
import { Type } from "class-transformer";
import { IsDecimal, IsNotEmpty, IsNumber, IsString, Matches, Min } from "class-validator";

export class CreateCotizacionConceptoDto{
    @ApiProperty({ example: 1, description: 'Cantidad del producto/servicio' })
    @IsNotEmpty({ message: 'La cantidad es obligatoria para cada concepto.' })
    @Type(() => Number)
    @IsNumber({ maxDecimalPlaces: 0 }, { message: 'La cantidad debe ser un número entero sin decimales.' })
    @Min(1, { message: 'La cantidad debe ser al menos 1.' })
    cantidad: number;
    
    @ApiProperty({ example: '150.75', description: 'Valor unitario del producto/servicio' })
    @IsNotEmpty({ message: 'El valor unitario es obligatorio para cada concepto.' })
    @IsDecimal({ decimal_digits: '0,2' }, { message: 'El Valor Unitario del concepto solo puede tener máximo 2 decimales' })
    @Matches(/^(?!-)(\d+)(\.\d{1,2})?$/, {
        message: 'El valor unitario del concepto no puede ser negativo y debe tener máximo 2 decimales',
    })
    valorUnitario: string;

    @ApiProperty({ example: 'PROD001', description: 'ID del producto o servicio asociado al concepto' })
    @IsNotEmpty({ message: 'El ID del producto o servicio es obligatorio para cada concepto.' })
    @IsString({ message: 'El ID del producto o servicio debe ser una cadena de texto.' })
    id_producto_servicio: string;

}