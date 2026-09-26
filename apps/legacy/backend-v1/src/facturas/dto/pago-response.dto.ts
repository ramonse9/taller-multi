import { ApiProperty } from "@nestjs/swagger"
import { Type } from "class-transformer";

class SatFormaPagoResponseDto{
    @ApiProperty({example: '03', description: 'Sat Forma Pago Clave'})
    clave: string;

    @ApiProperty({example: 'Transferencia electrónica de fondos', description: 'Sat Forma Pago Descripción'})
    descripcion: string;
}

class ComplementoResponseDto{
    @ApiProperty({example: '2026-12-31T02:48:00.000Z', description: 'Fecha emision en formato ISO (UTC)'})
    fechaEmision: string;

    @ApiProperty({example: '2026-12-31T02:48:00.000Z', description: 'Fecha pago en formato ISO (UTC)'})
    fechaPago: string;

    @ApiProperty({ type: () => SatFormaPagoResponseDto})
    @Type(() => SatFormaPagoResponseDto)
    satFormaPago: SatFormaPagoResponseDto
}

export class PagoResponseDto{

    @ApiProperty({example: '1', description: 'Número de parcialidad'})
    numeroParcialidad: number

    @ApiProperty({example: '8000', description: 'Saldo anterior'})
    saldoAnterior: number;

    @ApiProperty({example: '3000', description: 'Monto' })
    monto: number;

    @ApiProperty({example: '1000', description: 'Saldo insoluto'})
    saldoInsoluto: number;

    @ApiProperty({type: () => ComplementoResponseDto})
    @Type( () => ComplementoResponseDto)
    complemento: ComplementoResponseDto

}