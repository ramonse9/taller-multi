import { ApiProperty } from "@nestjs/swagger";
import { Transform  } from "class-transformer";
import { IsNotEmpty, IsString } from "class-validator";

export class CreateSatProductoServicioDto {

    @ApiProperty({example: 'Esta es la descripción del producto ó servicio', description: 'Descripción' })
    @IsNotEmpty()
    @IsString()
    clave: string;

    @ApiProperty({example: 'Esta es la descripción del producto ó servicio', description: 'Descripción' })
    @IsNotEmpty()
    @IsString()
    descripcion: string;

    @ApiProperty({example: 'Esta son palabras similares a la ddescripción del producto ó servicio', description: 'Palabras Similares|' })
    @IsNotEmpty()
    @IsString()
    palabrasSimilares: string;

    @ApiProperty({example: 'CARROCERIA', description: 'Tipo del giro de la Compañía'})
    @IsNotEmpty({message: 'Debe de incluir un giro de compañía'})
    @Transform(({value}) => value?.toLowerCase())
    tipo_compania_tipo_giro: string    

    @ApiProperty({example: '02', description: 'ID si es Producto ó Servicio'})
    @IsNotEmpty({message: 'Debe de incluir un ID de producto ó servicio'})
    @Transform(({value}) => value?.toLowerCase())
    tipo_sat_tipo_producto_servicio: string

    @ApiProperty({example: 'UNI123', description: 'ID de la unidad del Producto ó Servicio'})
    @IsNotEmpty({message: 'Debe de incluir un ID de la Unidad de Medida'})
    @Transform(({value}) => value?.toLowerCase())
    clave_sat_clave_unidad: string

}
