import { ApiProperty } from "@nestjs/swagger";
import { Transform, Type  } from "class-transformer";
import { IsDecimal, IsNotEmpty, IsString, Matches, Min } from "class-validator";

export class CreateProductoServicioDto {

    @ApiProperty({example: 'Esta es la descripción del producto ó servicio', description: 'Descripción' })
    @IsNotEmpty()
    @IsString()
    descripcion: string;

    /*@ApiProperty({example: '1000', description: 'Costo estimado del trabajo'})
    @IsNotEmpty({message: 'Debes agregar el Valor Unitario'})
    @Type( () => Number )
    @IsNumber({maxDecimalPlaces: 2}, {message: 'El Valor Unitario solo puede tener máximo 2 decimales'})
    @Min(0, { message: 'El valor unitario no puede ser negativo'})*/
    
    @ApiProperty({ example: '1000.00', description: 'Costo estimado del trabajo' })
    @IsNotEmpty({ message: 'Debes agregar el Valor Unitario' })
    @IsDecimal({ decimal_digits: '0,2' }, { message: 'El Valor Unitario solo puede tener máximo 2 decimales' })
    @Matches(/^(?!-)(\d+)(\.\d{1,2})?$/, {
        message: 'El valor unitario no puede ser negativo y debe tener máximo 2 decimales',
    })
    valorUnitario: string;    

    /*@ApiProperty({ example: 150.75, description: 'Valor unitario del producto/servicio', type: Number })
    @IsNotEmpty({ message: 'El valor unitario es obligatorio para cada concepto.' })    
    @IsNumber({ maxDecimalPlaces: 2}, {message: 'El Valor Unitario solo puede tener máximo 2 decimales'})
    @Type( () => Number)
    @Min(0, {message: 'El valor unitario no puede ser negativo'})
    //@Transform(({value}) => parseFloat(value))
    valorUnitario: number;*/

    @ApiProperty({example: 'POS123', description: 'ID del Producto ó Servicio del catálogo'})
    @IsNotEmpty({message: 'Debe de incluir un producto ó servicio'})
    @Transform(({value}) => value?.toLowerCase())
    idSatProductoServicio: string

}