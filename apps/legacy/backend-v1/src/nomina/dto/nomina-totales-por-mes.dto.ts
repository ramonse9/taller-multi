import { ApiProperty } from "@nestjs/swagger";

export class NominaTotalesPorMesDto{
    @ApiProperty()
    anio: number;

    @ApiProperty()
    mes: number;

    @ApiProperty()
    total: number;
}