import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
  IsDateString,
  IsEnum,
  IsIn,
  IsInt,
  IsNumber,
  IsOptional,
  Matches,
  IsString,
  IsUUID,
  Length,
  Max,
  Min,
} from 'class-validator';

const nullableText = ({ value }: { value: unknown }): unknown =>
  typeof value === 'string' ? value.trim() || null : value;

const cleanText = ({ value }: { value: unknown }): unknown =>
  typeof value === 'string' ? value.trim() : value;

export enum ExpenseStatus {
  Draft = 'draft',
  Confirmed = 'confirmed',
  Cancelled = 'cancelled',
}

export enum ExpenseRecurrenceType {
  OneTime = 'one_time',
  Recurring = 'recurring',
}

export class CreateExpenseDto {
  @ApiProperty({ format: 'uuid' })
  @IsUUID('4')
  categoryId!: string;

  @ApiPropertyOptional({
    format: 'uuid',
    description: 'Si se omite, se utiliza Proveedor general',
  })
  @IsOptional()
  @IsUUID('4')
  supplierId?: string;

  @ApiProperty({ format: 'date', example: '2026-10-02' })
  @IsDateString({ strict: true })
  occurredOn!: string;

  @ApiProperty({ minLength: 1, maxLength: 250 })
  @Transform(cleanText)
  @IsString()
  @Length(1, 250)
  description!: string;

  @ApiPropertyOptional({ nullable: true, maxLength: 120 })
  @Transform(nullableText)
  @IsOptional()
  @IsString()
  @Length(1, 120)
  reference?: string | null;

  @ApiProperty({ minimum: 0.01, maximum: 999999999999.99, example: 1250.5 })
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2, allowInfinity: false, allowNaN: false })
  @Min(0.01)
  @Max(999999999999.99)
  amount!: number;

  @ApiPropertyOptional({ nullable: true, maxLength: 2000 })
  @Transform(nullableText)
  @IsOptional()
  @IsString()
  @Length(1, 2000)
  notes?: string | null;

  @ApiPropertyOptional({ enum: ExpenseRecurrenceType, default: ExpenseRecurrenceType.OneTime })
  @IsOptional()
  @IsEnum(ExpenseRecurrenceType)
  recurrenceType?: ExpenseRecurrenceType;
}

export class UpdateExpenseDto extends PartialType(CreateExpenseDto) {}

export class ChangeExpenseStatusDto {
  @ApiProperty({ enum: [ExpenseStatus.Confirmed, ExpenseStatus.Cancelled] })
  @IsIn([ExpenseStatus.Confirmed, ExpenseStatus.Cancelled])
  status!: ExpenseStatus.Confirmed | ExpenseStatus.Cancelled;
}

export class ExpenseQueryDto {
  @ApiPropertyOptional({ default: 1, minimum: 1 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page = 1;

  @ApiPropertyOptional({ default: 20, minimum: 1, maximum: 100 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit = 20;

  @ApiPropertyOptional({ default: '', maxLength: 120 })
  @Transform(cleanText)
  @IsOptional()
  @IsString()
  @Length(0, 120)
  search = '';

  @ApiPropertyOptional({ enum: ExpenseStatus })
  @IsOptional()
  @IsEnum(ExpenseStatus)
  status?: ExpenseStatus;

  @ApiPropertyOptional({ enum: ExpenseRecurrenceType })
  @IsOptional()
  @IsEnum(ExpenseRecurrenceType)
  recurrenceType?: ExpenseRecurrenceType;

  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID('4')
  categoryId?: string;

  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID('4')
  supplierId?: string;

  @ApiPropertyOptional({ format: 'date' })
  @IsOptional()
  @IsDateString({ strict: true })
  occurredFrom?: string;

  @ApiPropertyOptional({ format: 'date' })
  @IsOptional()
  @IsDateString({ strict: true })
  occurredTo?: string;
}

export class ExpenseMonthlySummaryQueryDto {
  @ApiPropertyOptional({
    example: '2026-10',
    description: 'Mes a comparar; por defecto, el actual',
  })
  @IsOptional()
  @Matches(/^\d{4}-(0[1-9]|1[0-2])$/)
  month?: string;
}

export class ExpenseCategoryResponseDto {
  @ApiProperty({ format: 'uuid' }) id!: string;
  @ApiProperty() code!: string;
  @ApiProperty() name!: string;
  @ApiProperty() isActive!: boolean;
  @ApiProperty() isSystem!: boolean;
}

export class ExpenseSupplierResponseDto {
  @ApiProperty({ format: 'uuid' }) id!: string;
  @ApiProperty() commercialName!: string;
  @ApiProperty() isDefault!: boolean;
}

export class ExpenseStatusHistoryResponseDto {
  @ApiProperty({ format: 'uuid' }) id!: string;
  @ApiProperty({ enum: ExpenseStatus, nullable: true })
  previousStatus!: ExpenseStatus | null;
  @ApiProperty({ enum: ExpenseStatus }) newStatus!: ExpenseStatus;
  @ApiProperty({ format: 'uuid' }) changedByUserId!: string;
  @ApiProperty() changedByName!: string;
  @ApiProperty() changedAt!: Date;
}

export class ExpenseChangeHistoryResponseDto {
  @ApiProperty({ format: 'uuid' }) id!: string;
  @ApiProperty({
    type: [String],
    example: ['amount', 'notes'],
    description: 'Campos que cambiaron en esta edición',
  })
  changedFields!: string[];
  @ApiProperty({
    type: Object,
    example: { amount: '12500.50', notes: 'Pago mensual' },
  })
  previousValues!: Record<string, string | null>;
  @ApiProperty({
    type: Object,
    example: { amount: '12750.00', notes: 'Renta actualizada' },
  })
  newValues!: Record<string, string | null>;
  @ApiProperty({ format: 'uuid' }) changedByUserId!: string;
  @ApiProperty() changedByName!: string;
  @ApiProperty() changedAt!: Date;
}

export class ExpenseSummaryResponseDto {
  @ApiProperty({ format: 'uuid' }) id!: string;
  @ApiProperty({ type: ExpenseCategoryResponseDto }) category!: ExpenseCategoryResponseDto;
  @ApiProperty({ type: ExpenseSupplierResponseDto }) supplier!: ExpenseSupplierResponseDto;
  @ApiProperty({ enum: ExpenseStatus }) status!: ExpenseStatus;
  @ApiProperty({ enum: ExpenseRecurrenceType }) recurrenceType!: ExpenseRecurrenceType;
  @ApiProperty({ format: 'date' }) occurredOn!: string;
  @ApiProperty() description!: string;
  @ApiProperty({ nullable: true, type: String }) reference!: string | null;
  @ApiProperty({ description: 'Importe monetario entregado como texto' }) amount!: string;
  @ApiProperty({ nullable: true, type: String }) notes!: string | null;
  @ApiProperty({ nullable: true, type: String, description: 'Reservado para una fase posterior' })
  receiptFileKey!: string | null;
  @ApiProperty({ nullable: true, type: Date }) confirmedAt!: Date | null;
  @ApiProperty({ nullable: true, type: Date }) cancelledAt!: Date | null;
  @ApiProperty({ format: 'uuid' }) createdByUserId!: string;
  @ApiProperty({ format: 'uuid' }) updatedByUserId!: string;
  @ApiProperty() createdAt!: Date;
  @ApiProperty() updatedAt!: Date;
}

export class ExpenseResponseDto extends ExpenseSummaryResponseDto {
  @ApiProperty({ type: ExpenseStatusHistoryResponseDto, isArray: true })
  statusHistory!: ExpenseStatusHistoryResponseDto[];
  @ApiProperty({ type: ExpenseChangeHistoryResponseDto, isArray: true })
  changeHistory!: ExpenseChangeHistoryResponseDto[];
}

export class PaginatedExpensesResponseDto {
  @ApiProperty() page!: number;
  @ApiProperty() limit!: number;
  @ApiProperty() totalItems!: number;
  @ApiProperty() totalPages!: number;
  @ApiProperty() hasNextPage!: boolean;
  @ApiProperty({ type: ExpenseSummaryResponseDto, isArray: true })
  items!: ExpenseSummaryResponseDto[];
}

export class ExpenseCategoryAmountResponseDto {
  @ApiProperty({ type: ExpenseCategoryResponseDto }) category!: ExpenseCategoryResponseDto;
  @ApiProperty() count!: number;
  @ApiProperty({ description: 'Importe monetario entregado como texto' }) amount!: string;
}

export class ExpenseMonthlySummaryResponseDto {
  @ApiProperty({ example: '2026-10' }) month!: string;
  @ApiProperty({ example: '2026-09' }) previousMonth!: string;
  @ApiProperty() confirmedCount!: number;
  @ApiProperty({ description: 'Total confirmado del mes' }) confirmedAmount!: string;
  @ApiProperty() previousConfirmedCount!: number;
  @ApiProperty({ description: 'Total confirmado del mes anterior' })
  previousConfirmedAmount!: string;
  @ApiProperty({ description: 'Diferencia contra el mes anterior' }) changeAmount!: string;
  @ApiProperty({
    nullable: true,
    type: String,
    description: 'Null cuando el mes anterior fue cero',
  })
  changePercent!: string | null;
  @ApiProperty({ enum: ['increase', 'decrease', 'same'] })
  direction!: 'increase' | 'decrease' | 'same';
  @ApiProperty() draftCount!: number;
  @ApiProperty({ description: 'Total de borradores del mes seleccionado' }) draftAmount!: string;
  @ApiProperty({ type: ExpenseCategoryAmountResponseDto, isArray: true })
  byCategory!: ExpenseCategoryAmountResponseDto[];
  @ApiProperty({ type: ExpenseSummaryResponseDto, isArray: true })
  recentExpenses!: ExpenseSummaryResponseDto[];
}
