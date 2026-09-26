import { ApiProperty } from "@nestjs/swagger";

export class GastosTotalesPorMesDto{
    @ApiProperty()
    anio: number;

    @ApiProperty()
    mes: number;

    @ApiProperty()
    total: number;
}