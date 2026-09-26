import { IsString, Matches, MinLength, MaxLength } from "class-validator";
import { Transform } from "class-transformer";
import { ApiProperty } from "@nestjs/swagger";

export class ChangePasswordDto {

  @ApiProperty({example: '123456', description: 'Contraseña actual'})
  @IsString()
  @MinLength(6)
  @Transform(({ value }) => value.trim())
  currentPassword: string;
  
  @ApiProperty({example: '654321', description: 'Contraseña nueva'})
  @IsString()
  @MinLength(6)
  @MaxLength(20)
  @Transform(({ value }) => value.trim())
  @Matches(
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{6,}$/,
    {
      message: 'La contraseña debe tener al menos una mayúscula, una minúscula, un número y mínimo 6 caracteres'
    }
  )
  newPassword: string;
}