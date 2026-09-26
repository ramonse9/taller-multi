import { Type } from 'class-transformer';
import { ApiProperty } from "@nestjs/swagger";
import { SatMoneda } from './../../sat/entities/sat-moneda.entity';
import { SatExportacionResponseDto } from './../../productos-servicios/dto/sat-exportacion-response.dto';
import { SatMonedaResponseDto } from './../../productos-servicios/dto/sat-moneda-response.dto';
import { SatFormaPagoResponseDto } from './../../productos-servicios/dto/sat-forma-pago-response.dto';
import { SatTipoComprobanteResponseDto } from './../../productos-servicios/dto/sat-tipo-comprobante-response.dto';

export class FacturaBaseResponseDto{

    @ApiProperty({example: '2025', description: 'Año' })
    anio: string;

    @ApiProperty({example: '2025COM000000-Pago', description: 'Serie' })
    serie: string;

    @ApiProperty({example: '000123', description: 'Folio'})
    folio: string;

    @ApiProperty({ type : SatTipoComprobanteResponseDto, description: 'Tipo Comprobante' })
    @Type( () => SatTipoComprobanteResponseDto)
    satTipoComprobante: SatTipoComprobanteResponseDto;

    @ApiProperty({ type: SatFormaPagoResponseDto, description: 'Forma Pago'})
    @Type( () => SatFormaPagoResponseDto )
    satFormaPago: SatFormaPagoResponseDto;

    @ApiProperty({ type: () => SatMonedaResponseDto, description: 'Moneda'})
    @Type( () => SatMonedaResponseDto )
    satMoneda: SatMoneda;

    @ApiProperty({type: () => SatExportacionResponseDto, description: 'Exportacion'})
    @Type( () => SatExportacionResponseDto )
    satExportacion: SatExportacionResponseDto;

    @ApiProperty({example: 1, description: 'Tipo de Cambio', type: Number})
    tipoCambio: number;

    @ApiProperty({example: 'Observaciones de la factura', description: 'Observaciones'})
    observaciones: string;  

    @ApiProperty({example: '550e8400-e29b-41d4-a716-446655440000', description: 'UUID de la factura'})
    uuid: string;

    @ApiProperty({example: 'Sello de la factura', description: 'Sello'})
    sello: string;

    @ApiProperty({example: 'Sello SAT de la factura', description: 'Sello SAT'})
    selloSat: string;

    @ApiProperty({example: 'Numero Certificado Sat', description: 'Numero de Certificado SAT'})
    numCertificadoSat: string;

    @ApiProperty({example: 'RFC1234567890', description: 'RFC que certificó la factura'})
    rfcCertifico: string;

    @ApiProperty({example: 'Vigente', description: 'Estatus'})
    estatus: string;

    @ApiProperty({example: '2025-01-01 10:25:00+00', description: 'Fecha de Emisión'})
    fechaEmision: Date;

    @ApiProperty({example: '2025-01-01 10:25:00+00', description: 'Fecha de Timbrado'})
    fechaTimbrado: Date;

    @ApiProperty({example: '2025-01-01 10:25:00+00', description: 'Fecha de Cancelación'})
    fechaCancelacion: Date;

    @ApiProperty({example: 'Motivo de cancelación', description: 'Motivo de Cancelación'})
    motivoCancelacion: string;
    
}