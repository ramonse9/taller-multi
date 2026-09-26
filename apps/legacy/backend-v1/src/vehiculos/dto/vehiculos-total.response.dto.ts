import { ApiProperty } from "@nestjs/swagger";

export class VehiculosTotalResponseDto{
    @ApiProperty({example: 123, description: 'Total de Vehículos'})
    total: number;
}