import { ApiProperty } from "@nestjs/swagger";
import { IsDateString, IsEnum, IsNotEmpty, IsOptional, IsString } from "class-validator";
import { EnumSatExportacion, EnumSatMetodoPago, EnumSatTipoComprobante, EnumSatTipoPersona } from './../../commom/enums/general.enum';

export class CreateFacturaDto {

    @ApiProperty({
        type: String,
        format: 'date-time',
        description: 'Fecha emision formato ISO (UTC)',
        example: '2025-12-31T04:13:00.000Z',
    })    
    @IsNotEmpty({ message: 'La Fecha Emision es obligatoria' })
    @IsDateString(
        {},
        { message: 'La fecha debe ser una fecha ISO 8601 válida (ej: 2025-12-31T04:13:00.000Z)'}
    )      
    fechaEmision: string;

    @ApiProperty({example: '01', description: 'Forma de Pago'})
    @IsNotEmpty({message: 'La forma de pago es obligatoria'})
    @IsString()     
    claveSatFormaPago: string

    @ApiProperty({example: 'Contado', description: 'Condiciones de Pago'})
    @IsNotEmpty({message: 'La condicion de pago es obligatoria'})
    condicionesPago: string
    
    @ApiProperty({ 
        enum: EnumSatMetodoPago, 
        description: 'Metodo de Pago',
        example: EnumSatMetodoPago.PUE_PAGO_EN_UNA_SOLA_EXHIBICION
    })
    @IsEnum(EnumSatMetodoPago, {message: 'Método de Pago PUE ó PPD'})
    claveSatMetodoPago: EnumSatMetodoPago;

    @ApiProperty({example: 'MXN', description: 'Moneda utilizada por la factura'})
    @IsNotEmpty({message: 'La moneda es obligatoria'})
    @IsString()
    claveSatMoneda: string = 'MXN';

    @ApiProperty({example: '1', description: 'Tipo Cambio'})
    @IsNotEmpty({message: 'El tipo de cambio es obligatorio'})
    tipoCambio: number = 1;

    @ApiProperty({example: '80050', description: 'Lugar Expedición' })
    @IsNotEmpty({message: 'El lugar de expedición es obligatorio'})
    @IsString()
    lugarExpedicion: string;

    @ApiProperty({example: 'Estas son mis observaciones...', description: 'Observaciones' })
    @IsNotEmpty({message: 'Las observaciones son obligatorias'})
    @IsString()
    observaciones: string;

    @ApiProperty({         
        enum: EnumSatTipoComprobante,
        description: 'Tipo de Comprobante',
        example: EnumSatTipoComprobante.INGRESO
    })
    @IsEnum(EnumSatTipoComprobante, {message: 'El tipo de comprobante debe ser Ingreso'})
    claveSatTipoComprobante: EnumSatTipoComprobante;

    @ApiProperty({ enum: EnumSatTipoPersona, example: EnumSatTipoPersona.MORAL, description: 'SAT Tipo de Persona'})
    @IsEnum(EnumSatTipoPersona, { message: 'El tipo de persona debe ser FISICA o MORAL' })
    receptorClaveSatTipoPersona: EnumSatTipoPersona;   
    
    @ApiProperty({enum: EnumSatExportacion, example: EnumSatExportacion.NO_APLICA, description: 'No aplica Exportación' })
    @IsNotEmpty({message: 'La clave de Exportacion es obligatoria'})
    @IsEnum(EnumSatExportacion, {message: 'Debes elegir la clave de exportación'})    
    claveSatExportacion: EnumSatExportacion = EnumSatExportacion.NO_APLICA;

    @ApiProperty({example: 'ORD000123', description: 'Id de la Orden' })
    @IsOptional()
    @IsString()
    id_orden: string;
}
