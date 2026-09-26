import { ApiProperty, OmitType, PartialType } from "@nestjs/swagger";
import { CreateSatProductoServicioDto } from "./create-sat-producto-servicio.dto";
import { SatTipoProductoServicioResponseDto } from "./sat-tipo-producto-servicio-response.dto";
import { SatClaveUnidadResponseDto } from "./sat-clave-unidad-response.dto";
import { CompaniaTipoGiroResponseDto } from "../../companias/dto/compania-tipo-giro-response.dto";
import { Type } from "class-transformer";
import { SatObjetoImpuestoResponseDto } from "./sat-objeto-impuesto-response.dto";

export class SatProductoServicioResponseDto extends OmitType( PartialType( CreateSatProductoServicioDto ), ['tipo_compania_tipo_giro', 'tipo_sat_tipo_producto_servicio', 'clave_sat_clave_unidad'] as const ){

    @ApiProperty({example: 'POS001', description: 'ID del Catálogo del Producto ó Servicio' })
    id: string;

    @ApiProperty({example: '12345678', description: 'Clave del Catálogo del Producto ó Servicio de SAT' })
    clave: string;

    @ApiProperty({example: 'Descripcion...', description: 'Descripción del Catálogo del Producto ó Servicio de SAT' })
    descripcion: string;

    @ApiProperty({example: 'Palabras similares', description: 'Palabras Similares del Catálogo del Producto ó Servicio de SAT' })
    palabrasSimilares: string;

    @ApiProperty({ type: () => CompaniaTipoGiroResponseDto, description: 'Tipo de Giro del negocio' })
    @Type( () => CompaniaTipoGiroResponseDto)
    companiaTipoGiro?: CompaniaTipoGiroResponseDto;

    @ApiProperty({ type: () => SatTipoProductoServicioResponseDto, description: 'Tipo de Producto ó Servicio' })
    @Type( () => SatTipoProductoServicioResponseDto)
    satTipoProductoServicio: SatTipoProductoServicioResponseDto;    

    @ApiProperty({ type: () => SatClaveUnidadResponseDto, description: 'Unidad del Producto ó Servicio' })
    @Type( () => SatClaveUnidadResponseDto)
    satClaveUnidad: SatClaveUnidadResponseDto

    @ApiProperty({ type: () => SatObjetoImpuestoResponseDto, description: 'Objeto Impuesto' })
    @Type( () => SatObjetoImpuestoResponseDto)
    satObjetoImpuesto: SatObjetoImpuestoResponseDto

    @ApiProperty()
    createdAt: Date;
}