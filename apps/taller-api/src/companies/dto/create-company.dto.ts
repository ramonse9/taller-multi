import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import { IsBoolean, IsString, Length, Matches, ValidateNested } from 'class-validator';
import { CreateTenantAdminDto, UserResponseDto } from '../../platform-users/dto/user.dto';

export class CreateCompanyDto {
  @ApiProperty({ example: 'Taller Norte' })
  @IsString()
  @Length(2, 150)
  name!: string;

  @ApiProperty({ example: 'taller_norte' })
  @Transform(({ value }) => {
    const input: unknown = value;
    return typeof input === 'string' ? input.trim().toLowerCase() : input;
  })
  @IsString()
  @Length(3, 50)
  @Matches(/^[a-z][a-z0-9_]+$/)
  schemaName!: string;

  @ApiProperty({ example: 'workshop' })
  @IsString()
  @Length(1, 30)
  companyTypeCode!: string;

  @ApiProperty({ example: 'individual' })
  @IsString()
  @Length(1, 20)
  personTypeCode!: string;

  @ApiPropertyOptional({ default: false })
  @IsBoolean()
  withholdsIsr = false;

  @ApiPropertyOptional({ default: false })
  @IsBoolean()
  withholdsIva = false;

  @ApiProperty({ type: CreateTenantAdminDto })
  @ValidateNested()
  @Type(() => CreateTenantAdminDto)
  admin!: CreateTenantAdminDto;
}

export class CompanyResponseDto {
  @ApiProperty() id!: string;
  @ApiProperty() name!: string;
  @ApiProperty() schemaName!: string;
  @ApiProperty() companyTypeCode!: string;
  @ApiProperty() personTypeCode!: string;
  @ApiProperty() isActive!: boolean;
  @ApiProperty() withholdsIsr!: boolean;
  @ApiProperty() withholdsIva!: boolean;
  @ApiProperty() createdAt!: Date;
  @ApiProperty({ type: UserResponseDto }) admin!: UserResponseDto;
}
