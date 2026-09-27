import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsIn, IsString, Length, Matches } from 'class-validator';

const normalizeIdentifier = ({ value }: { value: unknown }): unknown =>
  typeof value === 'string' ? value.trim().toLowerCase() : value;

const IDENTIFIER_PATTERN = /^[a-z0-9._-]+@[a-z0-9._-]+$/;
const PASSWORD_PATTERN = /^(?=.*[A-Za-z])(?=.*\d).+$/;

export class RequestPasswordRecoveryDto {
  @ApiProperty({ example: 'yovany@melkars' })
  @Transform(normalizeIdentifier)
  @IsString()
  @Length(3, 100)
  @Matches(IDENTIFIER_PATTERN)
  identifier!: string;

  @ApiProperty({ enum: ['sms', 'whatsapp'], default: 'sms' })
  @IsIn(['sms', 'whatsapp'])
  channel!: 'sms' | 'whatsapp';
}

export class VerifyPasswordRecoveryDto {
  @ApiProperty({ example: 'yovany@melkars' })
  @Transform(normalizeIdentifier)
  @IsString()
  @Length(3, 100)
  @Matches(IDENTIFIER_PATTERN)
  identifier!: string;

  @ApiProperty({ example: '123456' })
  @IsString()
  @Matches(/^\d{6}$/)
  code!: string;
}

export class CompletePasswordRecoveryDto {
  @ApiProperty({ minLength: 40, writeOnly: true })
  @IsString()
  @Length(40, 200)
  resetToken!: string;

  @ApiProperty({ minLength: 6, maxLength: 10, writeOnly: true })
  @IsString()
  @Length(6, 10)
  @Matches(PASSWORD_PATTERN, {
    message: 'La contraseña debe incluir al menos una letra y un número',
  })
  password!: string;
}

export class PasswordRecoveryRequestedDto {
  @ApiProperty() accepted!: boolean;
  @ApiProperty() message!: string;
  @ApiPropertyOptional({ description: 'Sólo se devuelve con el proveedor local' })
  developmentCode?: string;
}

export class PasswordRecoveryVerifiedDto {
  @ApiProperty() resetToken!: string;
  @ApiProperty() expiresInSeconds!: number;
}
