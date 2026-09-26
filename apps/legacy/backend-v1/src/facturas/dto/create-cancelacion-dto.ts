import { EnumSatCancelacionMotivo, EnumSatFormaPago, EnumSatMetodoPago, EnumSatTipoTimbrado } from './../../commom/enums/general.enum';
import { CreateOrdenConceptoDto } from './../../ordenes/dto/create-orden-concepto.dto';
import { ApiProperty } from "@nestjs/swagger";
import { Type } from 'class-transformer';
import { IsArray, IsDate, IsEnum, IsNotEmpty, IsOptional, IsString, IsUUID, ValidateIf, ValidateNested } from "class-validator";

export class CreateCancelacionDto{    

    @ApiProperty({ 
        enum: EnumSatCancelacionMotivo, 
        description: 'Clave SAT Motivo de Cancelacion', 
        example: EnumSatCancelacionMotivo.COMPROBANTE_EMITIDO_CON_ERRORES_CON_RELACION
    })
    @IsEnum(EnumSatCancelacionMotivo, { message: 'Indica la Clave del listado de Cancelacion Motivo'})
    claveSatCancelacionMotivo: EnumSatCancelacionMotivo;

    @ApiProperty({
        enum: EnumSatTipoTimbrado,
        description: 'Factura ó Complemento',
        example: EnumSatTipoTimbrado.FACTURA
    })
    @IsEnum(EnumSatTipoTimbrado, { message: 'Indica la clave del tipo de CFDI a Cancelar' })
    claveSatTipoTimbrado: EnumSatTipoTimbrado;
       
    @ApiProperty({example: 'ID', description: 'ID del Pago (solo si es Complemento)'})
    @ValidateIf( o => o.claveSatTipoTimbrado === EnumSatTipoTimbrado.COMPLEMENTO )
    @IsNotEmpty({message: 'El ID del Pago es obligatorio cuando se Cancela un Pago'})
    @IsString()    
    id_pago?: string;
    
    @ApiProperty({example: 'ID', description: 'ID de la Factura (solo si es Factura)'})    
    @ValidateIf(o => o.claveSatTipoTimbrado === EnumSatTipoTimbrado.FACTURA )
    @IsNotEmpty({message: 'El ID de la Factura es obligatorio cuando se Cancela una Factura'})
    @IsString()
    id_factura?: string;

    @ApiProperty({example: 'UUID', description: 'UUID'})
    @IsNotEmpty({message: 'El UUID es obligatorio'})
    @IsUUID()
    @IsOptional()
    uuid: string;

    @ApiProperty({example: 'PUE', description: 'Metodo Pago' })
    @ValidateIf( (o) => o.claveSatCancelacionMotivo === EnumSatCancelacionMotivo.COMPROBANTE_EMITIDO_CON_ERRORES_CON_RELACION )
    @IsNotEmpty({message: 'El método de pago es obligatorio'})
    @IsString()
    claveSatMetodoPago?: EnumSatMetodoPago;

    @ApiProperty({
        type: String,
        format: 'date-time',
        description: 'Fecha emision formato ISO (UTC)',
        example: '2025-08-08T18:00:00.000Z',
    })
    @ValidateIf( (o) => o.claveSatCancelacionMotivo === EnumSatCancelacionMotivo.COMPROBANTE_EMITIDO_CON_ERRORES_CON_RELACION )
    @IsNotEmpty({ message: 'La Fecha Emision es obligatoria' })
    @IsDate({message: 'La Fecha de Emision debe ser correcta'})
    @Type(() => Date)   
    fechaEmision?: Date;

    @ApiProperty({example: '01', description: 'Forma de Pago'})
    @ValidateIf( (o) => o.claveSatCancelacionMotivo === EnumSatCancelacionMotivo.COMPROBANTE_EMITIDO_CON_ERRORES_CON_RELACION )
    @IsNotEmpty({message: 'La forma de pago es obligatoria'})
    @IsString()     
    claveSatFormaPago?: EnumSatFormaPago;
    
    @ApiProperty({example: 'Contado', description: 'Condiciones de Pago'})
    @ValidateIf( (o) => o.claveSatCancelacionMotivo === EnumSatCancelacionMotivo.COMPROBANTE_EMITIDO_CON_ERRORES_CON_RELACION )
    @IsNotEmpty({message: 'La condicion de pago es obligatoria'})
    condicionesPago?: string

    @ApiProperty({example: '80050', description: 'Lugar Expedición' })
    @ValidateIf( (o) => o.claveSatCancelacionMotivo === EnumSatCancelacionMotivo.COMPROBANTE_EMITIDO_CON_ERRORES_CON_RELACION )
    @IsNotEmpty({message: 'El lugar de expedición es obligatorio'})
    @IsString()
    lugarExpedicion?: string;

    @ApiProperty({example: 'Estas son mis observaciones...', description: 'Observaciones' })
    @ValidateIf( (o) => o.claveCancelacionMotivo === EnumSatCancelacionMotivo.COMPROBANTE_EMITIDO_CON_ERRORES_CON_RELACION )
    @IsNotEmpty({message: 'Las observaciones son obligatorias'})
    @IsString()
    observaciones?: string;

    @ApiProperty({
        type: CreateOrdenConceptoDto,
        description: 'Listado de conceptos que componen esta orden de trabajo',
        isArray: true
    })
    @ValidateIf( (o) => o.claveCancelacionmotivo === EnumSatCancelacionMotivo.COMPROBANTE_EMITIDO_CON_ERRORES_CON_RELACION )
    @IsArray({message: 'Los conceptos deben ser un array'})
    @ValidateNested({ each: true })
    @Type(() => CreateOrdenConceptoDto)
    conceptos?: CreateOrdenConceptoDto[];
}