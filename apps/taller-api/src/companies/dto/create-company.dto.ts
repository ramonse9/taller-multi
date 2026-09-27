import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsBoolean, IsIn, IsString, Length, ValidateNested } from 'class-validator';
import { COMPANY_TYPE_CODES, CompanyTypeCode } from '../../database/schema-name';
import { CreateTenantAdminDto, UserResponseDto } from '../../platform-users/dto/user.dto';

export class CreateCompanyDto {
  @ApiProperty({ example: 'Taller Norte' })
  @IsString()
  @Length(2, 150)
  name!: string;

  @ApiProperty({ enum: COMPANY_TYPE_CODES, example: 'mul' })
  @IsIn(COMPANY_TYPE_CODES)
  companyTypeCode!: CompanyTypeCode;

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
  @ApiProperty() loginCode!: string;
  @ApiProperty() companyTypeCode!: string;
  @ApiProperty() personTypeCode!: string;
  @ApiProperty() isActive!: boolean;
  @ApiProperty() withholdsIsr!: boolean;
  @ApiProperty() withholdsIva!: boolean;
  @ApiProperty() createdAt!: Date;
  @ApiProperty({ type: UserResponseDto }) admin!: UserResponseDto;
}
