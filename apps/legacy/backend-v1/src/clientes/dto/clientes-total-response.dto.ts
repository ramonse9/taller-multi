import { ApiProperty } from "@nestjs/swagger";

export class ClientesTotalResponseDto{
    @ApiProperty({example: 123, description: 'Total de Clientes Activos' })
    total: number;
}