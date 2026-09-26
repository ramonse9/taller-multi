import { EnumEstatusOrden } from './../../commom/enums/general.enum';
import { ApiProperty } from "@nestjs/swagger";
import { IsEnum } from "class-validator";


export class UpdateOrdenEstatusDto{

    @ApiProperty({ enum: EnumEstatusOrden, example: EnumEstatusOrden.PROCESO, description: 'proceso'})
    @IsEnum(EnumEstatusOrden, {message: 'Estatus de la Orden'})    
    estatus: EnumEstatusOrden;
}