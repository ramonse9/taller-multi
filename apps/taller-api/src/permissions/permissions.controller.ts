import { Body, Controller, Get, Param, ParseUUIDPipe, Put, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard, Roles, RolesGuard } from '../auth/roles';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { AuthenticatedUser } from '../common/types/authenticated-user';
import { PlatformRole } from '../platform-users/entities/platform-user.entity';
import {
  PermissionCatalogItemDto,
  PermissionTemplateDto,
  UpdateUserPermissionsDto,
  UserPermissionProfileDto,
} from './dto/permission.dto';
import { PermissionsService } from './permissions.service';

@ApiTags('permissions')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(PlatformRole.CompanyAdmin, PlatformRole.Admin)
@Controller('permissions')
export class PermissionsController {
  constructor(private readonly permissions: PermissionsService) {}

  @Get()
  @ApiOperation({ summary: 'Consultar catálogo de permisos por módulo y acción' })
  @ApiOkResponse({ type: PermissionCatalogItemDto, isArray: true })
  catalog(): Promise<PermissionCatalogItemDto[]> {
    return this.permissions.catalog();
  }

  @Get('templates')
  @ApiOperation({ summary: 'Consultar plantillas de permisos disponibles' })
  @ApiOkResponse({ type: PermissionTemplateDto, isArray: true })
  templates(): Promise<PermissionTemplateDto[]> {
    return this.permissions.templates();
  }

  @Get('users/:userId')
  @ApiOperation({ summary: 'Consultar permisos asignados a un usuario' })
  @ApiOkResponse({ type: UserPermissionProfileDto })
  profile(
    @CurrentUser() actor: AuthenticatedUser,
    @Param('userId', new ParseUUIDPipe({ version: '4' })) userId: string,
  ): Promise<UserPermissionProfileDto> {
    return this.permissions.profile(actor, userId);
  }

  @Put('users/:userId')
  @ApiOperation({ summary: 'Aplicar una plantilla o permisos personalizados a un usuario' })
  @ApiOkResponse({ type: UserPermissionProfileDto })
  updateProfile(
    @CurrentUser() actor: AuthenticatedUser,
    @Param('userId', new ParseUUIDPipe({ version: '4' })) userId: string,
    @Body() input: UpdateUserPermissionsDto,
  ): Promise<UserPermissionProfileDto> {
    return this.permissions.updateProfile(actor, userId, input);
  }
}
