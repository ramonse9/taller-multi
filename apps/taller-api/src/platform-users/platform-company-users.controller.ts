import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { JwtAuthGuard, Roles, RolesGuard } from '../auth/roles';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { AuthenticatedUser } from '../common/types/authenticated-user';
import {
  CreatePlatformCompanyUserDto,
  PaginatedUsersResponseDto,
  PlatformCompanyUserResponseDto,
  UserQueryDto,
} from './dto/user.dto';
import { PlatformRole } from './entities/platform-user.entity';
import { UsersService } from './users.service';

@ApiTags('platform company users')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(PlatformRole.PlatformAdmin)
@Controller('companies/:companyId/users')
export class PlatformCompanyUsersController {
  constructor(private readonly users: UsersService) {}

  @Get()
  @ApiOperation({ summary: 'Listar usuarios de una compañía como administrador de plataforma' })
  @ApiOkResponse({ type: PaginatedUsersResponseDto })
  @ApiNotFoundResponse({ description: 'Compañía no encontrada' })
  list(
    @CurrentUser() actor: AuthenticatedUser,
    @Param('companyId', new ParseUUIDPipe({ version: '4' })) companyId: string,
    @Query() query: UserQueryDto,
  ): Promise<PaginatedUsersResponseDto> {
    return this.users.listForPlatform(actor, companyId, query);
  }

  @Post()
  @ApiOperation({
    summary: 'Crear un usuario tenant con rol y permisos como administrador de plataforma',
  })
  @ApiCreatedResponse({ type: PlatformCompanyUserResponseDto })
  @ApiForbiddenResponse({ description: 'Compañía desactivada o suscripción no disponible' })
  @ApiNotFoundResponse({ description: 'Compañía, plan o plantilla no encontrados' })
  @ApiConflictResponse({ description: 'Límite del plan, usuario o correo duplicado' })
  create(
    @CurrentUser() actor: AuthenticatedUser,
    @Param('companyId', new ParseUUIDPipe({ version: '4' })) companyId: string,
    @Body() input: CreatePlatformCompanyUserDto,
  ): Promise<PlatformCompanyUserResponseDto> {
    return this.users.createForPlatform(actor, companyId, input);
  }
}
