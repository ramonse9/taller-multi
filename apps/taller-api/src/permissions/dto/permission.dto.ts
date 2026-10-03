import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ArrayUnique, IsArray, IsIn, IsOptional } from 'class-validator';
import {
  PERMISSION_CODES,
  PERMISSION_TEMPLATE_CODES,
  PermissionCode,
  PermissionTemplateCode,
} from '../permission.types';

export class PermissionCatalogItemDto {
  @ApiProperty({ enum: PERMISSION_CODES }) code!: PermissionCode;
  @ApiProperty() module!: string;
  @ApiProperty() action!: string;
  @ApiProperty() name!: string;
  @ApiProperty() description!: string;
  @ApiProperty() sortOrder!: number;
}

export class PermissionTemplateDto {
  @ApiProperty({ enum: PERMISSION_TEMPLATE_CODES }) code!: PermissionTemplateCode;
  @ApiProperty() name!: string;
  @ApiProperty() description!: string;
  @ApiProperty() sortOrder!: number;
  @ApiProperty({ enum: PERMISSION_CODES, isArray: true }) permissionCodes!: PermissionCode[];
}

export class UserPermissionProfileDto {
  @ApiProperty({ format: 'uuid' }) userId!: string;
  @ApiProperty() role!: string;
  @ApiPropertyOptional({ enum: PERMISSION_TEMPLATE_CODES, nullable: true })
  templateCode!: PermissionTemplateCode | null;
  @ApiProperty() isCustomized!: boolean;
  @ApiProperty({ description: 'Verdadero para el Administrador principal' }) automatic!: boolean;
  @ApiProperty({ enum: PERMISSION_CODES, isArray: true }) permissionCodes!: PermissionCode[];
}

export class UpdateUserPermissionsDto {
  @ApiPropertyOptional({ enum: PERMISSION_TEMPLATE_CODES, nullable: true })
  @IsOptional()
  @IsIn(PERMISSION_TEMPLATE_CODES)
  templateCode?: PermissionTemplateCode | null;

  @ApiProperty({ enum: PERMISSION_CODES, isArray: true })
  @IsArray()
  @ArrayUnique()
  @IsIn(PERMISSION_CODES, { each: true })
  permissionCodes!: PermissionCode[];
}
