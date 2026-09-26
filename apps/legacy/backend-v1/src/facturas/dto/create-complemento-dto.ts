import { EnumSatExportacion } from '../../commom/enums/general.enum';
import { ApiProperty } from "@nestjs/swagger";
import { IsArray, IsBoolean, IsDecimal, IsNotEmpty, IsOptional, IsString, Matches } from "class-validator";


export class CreateComplementoDto{

    @ApiProperty({
        type: Boolean, 
        default: true,
        description: 'Indica si el pago es individual'
    })
    @IsOptional()
    @IsBoolean({ message: 'El campo Pago Individual debe ser booleano'})
    pagoIndividual?: boolean = true;

    @ApiProperty({
        type: String,
        format: 'date-time',
        description: 'Fecha Emision formato ISO (UTC)',
        example: '2025-12-31T04:13:00.000Z',
    })    
    @IsNotEmpty({ message: 'La Fecha Emision es obligatoria' })
    //@IsDate({message: 'La fecha de Emision debe ser correcta'})
    //@Type(() => Date)   
    fechaEmision: Date;

    @ApiProperty({
        type: String,
        format: 'date-time',
        description: 'Fecha Pago formato ISO (UTC)',
        example: '2025-12-31T04:13:00.000Z',
    })    
    @IsNotEmpty({ message: 'La fecha Pago es obligatoria' })
    //@IsDate({message: 'La Fecha de Pago debe ser correcta'})
    //@Type(() => Date)   
    fechaPago: Date;   

    @ApiProperty({ example: '150.75', description: 'Monto Pagado', default: '0' })    
    @IsOptional()
    @IsDecimal({ decimal_digits: '0,2' }, { message: 'El Monto solo puede tener máximo 2 decimales' })
    @Matches(/^(?!-)(\d+)(\.\d{1,2})?$/, {
        message: 'El Monto no puede ser negativo y debe tener máximo 2 decimales',
    })
    monto?: string = '0';

    @ApiProperty({
        type: String,
        isArray: true,
        example: "['fac000001','fac000002','fac000003']", 
        description: 'Listado de Facturas relacionadas al pago' 
    })
    @IsOptional()
    @IsArray({ message: 'idFacturas debe ser un arreglo'})
    @IsString({ each: true, message: 'Cada idFactura dene ser un string'})
    idFacturas?: string[];

    @ApiProperty({example: 'Estas son mis observaciones...', description: 'Observaciones' })
    @IsNotEmpty({message: 'Las observaciones son obligatorias'})
    @IsString()
    observaciones: string;

    @ApiProperty({example: 'P', description: 'Tipo de Comprobante' })
    @IsNotEmpty({message: 'El tipo de comprobante es obligatorio'})
    @IsString()
    claveSatTipoComprobante: string;

    @ApiProperty({example: '01', description: 'Forma de Pago'})
    @IsNotEmpty({message: 'La forma de pago es obligatoria'})
    @IsString()
    claveSatFormaPago: string
    
    @ApiProperty({example: '01', description: 'Moneda'})
    @IsString()
    claveSatMoneda: string = 'MXN';

    @ApiProperty({example: 'fac000123', description: 'Id de la Factura' })
    @IsOptional()
    id_factura: string;

    @ApiProperty({example: '01', description: 'No aplica Exportación' })
    @IsNotEmpty({message: 'La clave de Exportacion es obligatoria'})
    @IsString()
    claveSatExportacion: EnumSatExportacion = EnumSatExportacion.NO_APLICA;
}