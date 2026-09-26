import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsString } from "class-validator";

export class CreateSatClaveUnidadDto {

    @ApiProperty({example: 'La clave de la Unidad del producto ó servicio', description: 'Clave' })
    @IsNotEmpty()
    @IsString()
    clave: string;

    @ApiProperty({example: 'El nombre de la Unidad del producto ó servicio', description: 'Nombre' })
    @IsNotEmpty()
    @IsString()
    nombre: string;

    @ApiProperty({example: 'La descripción de la Unidad del producto ó servicio', description: 'Descripción' })
    @IsNotEmpty()
    @IsString()
    descripcion: string;

    @ApiProperty({example: 'La nota de la Unidad del producto ó servicio', description: 'Nota' })
    @IsNotEmpty()
    @IsString()
    nota: string;

}
