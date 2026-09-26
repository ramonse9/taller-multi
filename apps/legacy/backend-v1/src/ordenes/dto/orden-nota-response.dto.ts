import { ApiProperty, PartialType } from "@nestjs/swagger";
import { CreateOrdenNotaDto } from "./create-orden-nota.dto";
import { OrdenNotaImagenResponseDto } from "./orden-nota-imagen-response.dto";
import { Type } from "class-transformer";

export class OrdenNotaResponseDto extends PartialType( CreateOrdenNotaDto ) {

    @ApiProperty({example: '23', description: 'ID consecutivo para la nota'})
    id: number

    @ApiProperty({ example: '2025-01-01T12:00:00Z' })
    createdAt: Date;

    @ApiProperty({type: () => [OrdenNotaImagenResponseDto], description: 'Listado de imágenes' })
    @Type( () => OrdenNotaImagenResponseDto )
    imagenes?: OrdenNotaImagenResponseDto[]

}