import { EnumEstatusOrden } from './../../commom/enums/general.enum';
import { ApiProperty } from "@nestjs/swagger";

export class UpdateOrdenEstatusResponseDto{

    @ApiProperty({example: '123', description: 'Id de la Nota'})
    id: number;

    @ApiProperty({example: 'ord000123', description: 'Id de la Orden'})
    id_orden: string;

    @ApiProperty({example: 'proceso', description: 'Estatus de la Orden'})
    estatus: EnumEstatusOrden;

    @ApiProperty({example: 'Esto es una nota', description: 'Descripción de la Nota'})
    nota: string;

    @ApiProperty({example: '2025-12-31T04:13:00.000Z', description: 'Fecha en que fué creada'})
    createdAt: string;
}