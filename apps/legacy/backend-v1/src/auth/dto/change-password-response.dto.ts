import { ApiProperty } from "@nestjs/swagger";

export class ChangePasswordResponseDto {
  
  @ApiProperty({example: 'Contraseña actualizada correctamente', description: 'Mensaje de confirmación al cambiar la contraseña'})  
  message: string;
  
}