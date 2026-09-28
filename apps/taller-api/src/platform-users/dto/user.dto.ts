import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
  IsBoolean,
  IsEmail,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Length,
  Matches,
  Max,
  Min,
  ValidateIf,
} from 'class-validator';
import { PlatformRole } from '../entities/platform-user.entity';

const normalizeNullableEmail = ({ value }: { value: unknown }): unknown =>
  typeof value === 'string' ? value.trim().toLowerCase() || null : value;

const normalizeUsername = ({ value }: { value: unknown }): unknown =>
  typeof value === 'string' ? value.trim().toLowerCase() : value;

const normalizeNullablePhone = ({ value }: { value: unknown }): unknown =>
  typeof value === 'string' ? value.replace(/[\s()-]/g, '') || null : value;

const PASSWORD_PATTERN = /^(?=.*[A-Za-z])(?=.*\d).+$/;
const USERNAME_PATTERN = /^[a-z][a-z0-9._-]{1,29}$/;
const PHONE_PATTERN = /^\+[1-9]\d{7,14}$/;

const trimString = ({ value }: { value: unknown }): unknown =>
  typeof value === 'string' ? value.trim() : value;

export const TENANT_ROLES = [PlatformRole.CompanyAdmin, PlatformRole.User] as const;

export class CreateTenantAdminDto {
  @ApiProperty({ example: 'María López' })
  @Transform(trimString)
  @IsString()
  @Length(2, 150)
  fullName!: string;

  @ApiProperty({ example: 'maria' })
  @Transform(normalizeUsername)
  @IsString()
  @Matches(USERNAME_PATTERN)
  username!: string;

  @ApiPropertyOptional({ example: 'admin@tallernorte.mx', nullable: true })
  @Transform(normalizeNullableEmail)
  @IsOptional()
  @IsEmail()
  @Length(3, 254)
  email?: string | null;

  @ApiProperty({ example: '+526671234567' })
  @Transform(normalizeNullablePhone)
  @IsString()
  @Matches(PHONE_PATTERN)
  phone!: string;

  @ApiProperty({ minLength: 6, maxLength: 10, writeOnly: true })
  @IsString()
  @Length(6, 10)
  @Matches(PASSWORD_PATTERN, {
    message: 'La contraseña debe incluir al menos una letra y un número',
  })
  password!: string;

  @ApiPropertyOptional({ default: 'America/Mazatlan' })
  @IsString()
  @Length(1, 80)
  timezoneCode = 'America/Mazatlan';
}

export class CreateUserDto extends CreateTenantAdminDto {
  @ApiPropertyOptional({
    enum: TENANT_ROLES,
    default: PlatformRole.User,
  })
  @IsIn(TENANT_ROLES)
  role: PlatformRole.CompanyAdmin | PlatformRole.User = PlatformRole.User;
}

export class UpdateUserDto {
  @ApiPropertyOptional({ example: 'María López' })
  @Transform(trimString)
  @IsOptional()
  @IsString()
  @Length(2, 150)
  fullName?: string;

  @ApiPropertyOptional({ example: 'maria@tallernorte.mx' })
  @Transform(normalizeNullableEmail)
  @IsOptional()
  @IsEmail()
  @Length(3, 254)
  email?: string | null;

  @ApiPropertyOptional({ example: 'maria' })
  @Transform(normalizeUsername)
  @IsOptional()
  @Matches(USERNAME_PATTERN)
  username?: string;

  @ApiPropertyOptional({ example: '+526671234567' })
  @Transform(normalizeNullablePhone)
  @ValidateIf((_object, value: unknown) => value !== undefined)
  @IsString()
  @Matches(PHONE_PATTERN)
  phone?: string;

  @ApiPropertyOptional({ enum: TENANT_ROLES })
  @IsOptional()
  @IsIn(TENANT_ROLES)
  role?: PlatformRole.CompanyAdmin | PlatformRole.User;

  @ApiPropertyOptional({ example: 'America/Mazatlan' })
  @IsOptional()
  @IsString()
  @Length(1, 80)
  timezoneCode?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class ChangePasswordDto {
  @ApiProperty({ minLength: 6, maxLength: 128, writeOnly: true })
  @IsString()
  @Length(6, 128)
  currentPassword!: string;

  @ApiProperty({ minLength: 6, maxLength: 10, writeOnly: true })
  @IsString()
  @Length(6, 10)
  @Matches(PASSWORD_PATTERN, {
    message: 'La contraseña debe incluir al menos una letra y un número',
  })
  newPassword!: string;
}

export class ResetPasswordDto {
  @ApiProperty({ minLength: 6, maxLength: 10, writeOnly: true })
  @IsString()
  @Length(6, 10)
  @Matches(PASSWORD_PATTERN, {
    message: 'La contraseña debe incluir al menos una letra y un número',
  })
  password!: string;
}

export class UserQueryDto {
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

  @ApiPropertyOptional({ default: '', maxLength: 100 })
  @IsOptional()
  @IsString()
  @Length(0, 100)
  search = '';

  @ApiPropertyOptional({ type: Boolean })
  @Transform(({ value }: { value: unknown }) => {
    if (value === undefined || value === '') return undefined;
    if (value === 'true' || value === true) return true;
    if (value === 'false' || value === false) return false;
    return value;
  })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class UserResponseDto {
  @ApiProperty({ format: 'uuid' }) id!: string;
  @ApiProperty({ nullable: true, type: String }) email!: string | null;
  @ApiProperty() username!: string;
  @ApiProperty() loginName!: string;
  @ApiProperty({ nullable: true, type: String }) phone!: string | null;
  @ApiProperty({ nullable: true, type: Date }) phoneVerifiedAt!: Date | null;
  @ApiProperty() fullName!: string;
  @ApiProperty({ enum: TENANT_ROLES }) role!: PlatformRole;
  @ApiProperty({ format: 'uuid' }) companyId!: string;
  @ApiProperty() timezoneCode!: string;
  @ApiProperty() isActive!: boolean;
  @ApiProperty() mustChangePassword!: boolean;
  @ApiProperty() createdAt!: Date;
  @ApiProperty() updatedAt!: Date;
}

export class PaginatedUsersResponseDto {
  @ApiProperty() page!: number;
  @ApiProperty() limit!: number;
  @ApiProperty() totalItems!: number;
  @ApiProperty() totalPages!: number;
  @ApiProperty() hasNextPage!: boolean;
  @ApiProperty({ type: UserResponseDto, isArray: true }) items!: UserResponseDto[];
}
