import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsIn, IsOptional, IsString, Length } from 'class-validator';
import {
  SUBSCRIPTION_FEATURES,
  SUBSCRIPTION_PLAN_CODES,
  SUBSCRIPTION_STATUSES,
  SubscriptionFeature,
  SubscriptionPlanCode,
  SubscriptionStatus,
} from '../subscription.types';

export class SubscriptionPlanResponseDto {
  @ApiProperty({ enum: SUBSCRIPTION_PLAN_CODES }) code!: SubscriptionPlanCode;
  @ApiProperty() name!: string;
  @ApiProperty() description!: string;
  @ApiProperty() sortOrder!: number;
  @ApiProperty({ enum: SUBSCRIPTION_FEATURES, isArray: true })
  features!: SubscriptionFeature[];
  @ApiProperty({ example: { max_users: 3, max_branches: 1, max_monthly_invoices: 0 } })
  limits!: Record<string, number | null>;
}

export class SubscriptionResponseDto {
  @ApiProperty() companyId!: string;
  @ApiProperty({ enum: SUBSCRIPTION_PLAN_CODES }) planCode!: SubscriptionPlanCode;
  @ApiProperty() planName!: string;
  @ApiProperty({ enum: SUBSCRIPTION_STATUSES }) status!: SubscriptionStatus;
  @ApiProperty() usable!: boolean;
  @ApiProperty({ enum: SUBSCRIPTION_FEATURES, isArray: true })
  features!: SubscriptionFeature[];
  @ApiProperty({ example: { max_users: 3, max_branches: 1, max_monthly_invoices: 0 } })
  limits!: Record<string, number | null>;
}

export class CompanySubscriptionResponseDto extends SubscriptionResponseDto {
  @ApiProperty() companyName!: string;
  @ApiProperty() companyLoginCode!: string;
}

export class ChangeSubscriptionDto {
  @ApiProperty({ enum: SUBSCRIPTION_PLAN_CODES })
  @IsIn(SUBSCRIPTION_PLAN_CODES)
  planCode!: SubscriptionPlanCode;

  @ApiProperty({ enum: SUBSCRIPTION_STATUSES })
  @IsIn(SUBSCRIPTION_STATUSES)
  status!: SubscriptionStatus;

  @ApiPropertyOptional({ example: 'Cambio solicitado por la compañía' })
  @IsOptional()
  @Transform(({ value }: { value: unknown }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @Length(2, 300)
  reason?: string;
}
