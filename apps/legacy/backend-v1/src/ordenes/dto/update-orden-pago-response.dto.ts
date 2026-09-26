import { ApiProperty } from "@nestjs/swagger";

export class UpdateOrdenPagoResponseDto{

    @ApiProperty({ example: false, description: 'Indica si la orden ha sido pagada'})   
    pagada: boolean;

    @ApiProperty({
        type: String,
        format: 'date-time',
        description: 'Fecha Pago de la Orden en formato ISO (UTC)',
        example: '2025-12-31T04:13:00.000Z',
    })
    fechaPago: string | null;
}