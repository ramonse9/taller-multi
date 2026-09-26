import { SatTipoComprobanteResponseDto } from './sat-tipo-comprobante-response.dto';
import { ApiProperty } from "@nestjs/swagger";
import { PaginationResponseDto } from "../../DTOs/pagination/pagination-response.dto";
import { Type } from 'class-transformer';

export class SatTipoComprobantePaginationDto extends PaginationResponseDto {

    @ApiProperty({type: [SatTipoComprobanteResponseDto], description: 'Listado de Uso CFDI'})
    @Type( () => SatTipoComprobanteResponseDto )
    satTiposComprobantes: SatTipoComprobanteResponseDto[];

}