import { SatTipoPersonaResponseDto } from './../../productos-servicios/dto/sat-tipo-persona-response.dto';
import { SatFormaPagoResponseDto } from '../../productos-servicios/dto/sat-forma-pago-response.dto';
import { SatMetodoPagoResponseDto } from '../../productos-servicios/dto/sat-metodo-pago-response.dto';
import { ApiProperty } from "@nestjs/swagger";
import { Type } from "class-transformer";
import { FacturaConceptoResponseDto } from './factura-concepto-response.dto';

export class FacturaMinimalResponseDto {

    @ApiProperty({example: 'FAC000123', description: 'ID del Complemento de Pagos'})
    id: string;

    @ApiProperty({example: 'Vigente', description: 'Estatus'})
    estatus: string;

    @ApiProperty({example: 'Contado', description: 'Condiciones de Pago'})
    condicionesPago: string;
    
    @ApiProperty({example: '2025-01-01 10:25:00+00', description: 'Fecha de Emisión'})
    fechaEmision: Date;
    
    @ApiProperty({example: '80000', description: 'Lugar de Expedición'})
    lugarExpedicion: string;

    @ApiProperty({example: 'Factura desde una Orden...', description: 'Observaciones'})
    observaciones: string;

    /*@ApiProperty({example: 'Receptor RFC', description: 'Receptor RFC'})
    receptorRFC: string;

    @ApiProperty({example: 'Receptor Razón Social', description: 'Receptor Razón Social'})
    receptorRazonSocial: string;

    @ApiProperty({example: 'Receptor Código Postal', description: 'Receptor Código Postal'})
    receptorCodigoPostal: string;

    @ApiProperty({example: 'Receptor Email', description: 'Receptor Email'})
    receptorEmail: string;
    */

    @ApiProperty({ type: () => SatMetodoPagoResponseDto, description: 'Metodo de Pago'})
    @Type( () => SatMetodoPagoResponseDto )
    satMetodoPago: SatMetodoPagoResponseDto;

    @ApiProperty({ type: () => SatFormaPagoResponseDto, description: 'Forma de Pago'})
    @Type( () => SatFormaPagoResponseDto )
    satFormaPago: SatFormaPagoResponseDto;

    @ApiProperty({ type: () => SatTipoPersonaResponseDto, description: 'Receptor Tipo de Persona'})
    @Type( () => SatTipoPersonaResponseDto )
    receptorSatTipoPersona: SatTipoPersonaResponseDto;

    //@ApiProperty({ type: () => SatRegimenFiscalResponseDto, description: 'Receptor Regimen Fiscal'})
    //@Type( () => SatRegimenFiscalResponseDto )
    //receptorSatRegimenFiscalPersona: SatRegimenFiscalResponseDto;

    //@ApiProperty({ type: () => SatUsoCFDIResponseDto, description: 'Receptor Uso CFDI'})
    //@Type( () => SatUsoCFDIResponseDto )
    //receptorSatUsoCFDI: SatUsoCFDIResponseDto;
    
    @ApiProperty({ type: () => [FacturaConceptoResponseDto], description: 'Conceptos asociados a la Factura'})
    @Type(() => FacturaConceptoResponseDto)
    conceptos: FacturaConceptoResponseDto[];

    /*@ApiProperty({type: () => OrdenMinimalResponseDto, description: 'Orden'})
    @Type( () => OrdenMinimalResponseDto )
    orden: OrdenMinimalResponseDto;*/

}