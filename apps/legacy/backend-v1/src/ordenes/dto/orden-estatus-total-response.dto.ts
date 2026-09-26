import { ApiProperty, OmitType, PartialType } from "@nestjs/swagger";

export class OrdenEstatusTotalResponseDto {

    @ApiProperty()
    estatus: string;

    @ApiProperty()
    total: number;

}