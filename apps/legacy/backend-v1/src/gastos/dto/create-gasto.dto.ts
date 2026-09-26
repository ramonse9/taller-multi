import { IsString, IsBoolean, IsNotEmpty} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';

export class CreateGastoDto {
  
  @ApiProperty({ example: 'Nómina Yovany', description: 'Nombre del gasto' })
  @IsString()
  nombre: string;

  @ApiProperty({ example: false, description: 'Si es un gasto recurrente' })  
  @IsBoolean()
  recurrente: boolean;
   
  @ApiProperty({example: '1', description: 'Categoria del Gasto' })
  @IsNotEmpty({message: 'La categoría del gasto no puede estar vacía'})  
  id_gasto_categoria: number;

}