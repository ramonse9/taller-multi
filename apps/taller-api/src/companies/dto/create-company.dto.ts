import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
  IsBoolean,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Length,
  Matches,
  Max,
  Min,
  ValidateNested,
} from 'class-validator';
import { COMPANY_TYPE_CODES, CompanyTypeCode } from '../../database/schema-name';
import { CreateTenantAdminDto, UserResponseDto } from '../../platform-users/dto/user.dto';
import {
  SUBSCRIPTION_PLAN_CODES,
  SubscriptionPlanCode,
} from '../../subscriptions/subscription.types';

export class CreateCompanyDto {
  @ApiProperty({ example: 'Taller Norte' })
  @IsString()
  @Length(2, 150)
  name!: string;

  @ApiProperty({ example: 'taller_norte', description: 'Código usado en usuario@compañía' })
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim().toLowerCase().replace(/^@/, '') : value,
  )
  @IsString()
  @Matches(/^[a-z][a-z0-9_]{1,39}$/)
  loginCode!: string;

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

  @ApiPropertyOptional({ enum: SUBSCRIPTION_PLAN_CODES, default: 'basic' })
  @IsOptional()
  @IsIn(SUBSCRIPTION_PLAN_CODES)
  planCode?: SubscriptionPlanCode = 'basic';

  @ApiPropertyOptional({ default: 14, minimum: 0, maximum: 90 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(90)
  trialDays?: number = 14;

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
