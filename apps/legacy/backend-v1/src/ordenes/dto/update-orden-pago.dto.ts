import { ApiProperty } from "@nestjs/swagger";
import { IsBoolean, IsDateString, IsOptional } from "class-validator";

export class UpdateOrdenPagoDto{

    @ApiProperty({ example: false, description: 'Indica si la orden ha sido pagada'})
    @IsBoolean()
    pagada: boolean;

    @ApiProperty({
        type: String,
        format: 'date-time',
        description: 'Fecha Pago de la Orden en formato ISO (UTC)',
        example: '2025-12-31T04:13:00.000Z',
    })
    @IsOptional()   
    @IsDateString(
        {},
        { message: 'La fecha debe ser una fecha ISO 8601 válida (ej: 2025-12-31T04:13:00.000Z)'}
    ) 
    fechaPago: string | null;
}