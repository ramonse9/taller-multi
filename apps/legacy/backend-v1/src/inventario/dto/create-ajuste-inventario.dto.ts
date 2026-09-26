import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';

export class CreateAjusteInventarioDto {
  @ApiProperty({ example: 'prd_0001' })
  @IsNotEmpty()
  @IsString()
  id_producto: string;

  @ApiProperty({
    example: 5,
    description: 'Positivo suma stock, negativo resta',
  })
  @IsNumber()
  cantidad: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  observaciones?: string;
}
