import { ApiProperty } from '@nestjs/swagger';

export class GastoCategoriaResponseDto {
  @ApiProperty()
  id: number;

  @ApiProperty()
  nombre: string;

  @ApiProperty()
  descripcion?: string;  

  @ApiProperty()
  activo: boolean;
}