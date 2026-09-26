import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { GastoCategoriaResponseDto } from './gasto-categoria-response.dto';

export class GastoResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  nombre: string;

  //@ApiProperty()  
  //monto: number;

  @ApiProperty()
  recurrente: boolean;

  @ApiProperty()
  activo: boolean;
  
  @ApiProperty({ type: () => GastoCategoriaResponseDto, description: 'Gasto Categoria'})
  @Type( () => GastoCategoriaResponseDto )
  gastoCategoria: GastoCategoriaResponseDto;  

  @ApiProperty({example: '2025-04-18 20:14:44.933942+00' })
  updatedAt: string

  @ApiProperty({example: '2025-04-18 20:14:44.933942+00' })
  createdAt: string
}