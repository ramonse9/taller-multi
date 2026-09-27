import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsString, Length, Matches } from 'class-validator';

export class LoginDto {
  @ApiProperty({ example: 'yovany@melkars' })
  @Transform(({ value }) => {
    const input: unknown = value;
    return typeof input === 'string' ? input.trim().toLowerCase() : input;
  })
  @IsString()
  @Length(3, 100)
  @Matches(/^[a-z0-9._-]+@[a-z0-9._-]+$/)
  identifier!: string;

  @ApiProperty({ minLength: 6, maxLength: 128 })
  @IsString()
  @Length(6, 128)
  password!: string;
}

export class LoginUserResponseDto {
  @ApiProperty() id!: string;
  @ApiProperty({ nullable: true, type: String }) email!: string | null;
  @ApiProperty({ nullable: true, type: String }) username!: string | null;
  @ApiProperty() loginName!: string;
  @ApiProperty({ nullable: true, type: String }) phone!: string | null;
  @ApiProperty({ nullable: true, type: Date }) phoneVerifiedAt!: Date | null;
  @ApiProperty() fullName!: string;
  @ApiProperty() role!: string;
  @ApiProperty({ nullable: true, type: String }) companyId!: string | null;
  @ApiProperty() mustChangePassword!: boolean;
}

export class LoginResponseDto {
  @ApiProperty() accessToken!: string;
  @ApiProperty({ type: LoginUserResponseDto }) user!: LoginUserResponseDto;
}
