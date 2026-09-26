import { SatTipoPersonaResponseDto } from './../../productos-servicios/dto/sat-tipo-persona-response.dto';
import { SatFormaPagoResponseDto } from './../../productos-servicios/dto/sat-forma-pago-response.dto';
import { SatMetodoPagoResponseDto } from './../../productos-servicios/dto/sat-metodo-pago-response.dto';
import { SatUsoCFDI } from './../../sat/entities/sat-uso-cfdi.entity';
import { ApiProperty } from "@nestjs/swagger";
import { SatRegimenFiscalResponseDto } from "../../productos-servicios/dto/sat-regimen-fiscal-response.dto";
import { Type } from "class-transformer";

export class FacturaResponseDto {

    @ApiProperty({example: 'FAC000123', description: 'ID de la Factura'})
    id: string;

    @ApiProperty({example: 'Contado', description: 'Condiciones de Pago'})
    condicionesPago: string;

    @ApiProperty({ type: () => SatMetodoPagoResponseDto, description: 'Metodo de Pago'})
    @Type( () => SatMetodoPagoResponseDto )
    satMetodoPago: SatMetodoPagoResponseDto;

    @ApiProperty({ type: () => SatFormaPagoResponseDto, description: 'Forma de Pago'})
    @Type( () => SatFormaPagoResponseDto )
    satFormaPago: SatFormaPagoResponseDto;

    @ApiProperty({example: '80000', description: 'Lugar de Expedición'})
    lugarExpedicion: string;

    @ApiProperty({example: '10000.00', description: 'Subtotal'})
    subtotal: string;

    @ApiProperty({example: '0', description: 'Descuento'})
    descuento: string;

    @ApiProperty({example: '10000.00', description: 'Total'})
    total: string;

    @ApiProperty({example: 'RFC1234567890', description: 'RFC del Emisor'})
    emisorRFC: string;

    @ApiProperty({type: () => SatTipoPersonaResponseDto, description: 'Receptor Tipo Persona'})
    @Type( () => SatTipoPersonaResponseDto )
    receptorSatTipoPersona: SatTipoPersonaResponseDto;
    
    @ApiProperty({description: 'Receptor RFC'})
    receptorRFC: string;
    
    @ApiProperty({description: 'Receptor Razón Social'})
    receptorRazonSocial: string    
    
    @ApiProperty({description: 'Receptor Código Postal'})
    receptorCodigoPostal: string;
    
    @ApiProperty({type: () => SatRegimenFiscalResponseDto, description: 'Receptor Regimen Fiscal' })
    @Type( () => SatRegimenFiscalResponseDto )
    receptorSatRegimenFiscal: SatRegimenFiscalResponseDto;

    @ApiProperty({type: () => SatUsoCFDI, description: 'Receptor Uso CFDI' })
    @Type( () => SatUsoCFDI )
    receptorSatUsoCFDI: SatUsoCFDI;

    @ApiProperty({example: '2025-01-02 20:14:44.933942+00'})
    updatedAt: Date;

    @ApiProperty({example: '2025-01-01 20:14:44.933942+00'})
    createdAt: Date;
}