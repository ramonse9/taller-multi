import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBadRequestResponse,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiForbiddenResponse,
  ApiNoContentResponse,
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
  ResetPasswordDto,
  UpdatePlatformCompanyUserDto,
  UserQueryDto,
} from './dto/user.dto';
import { PlatformRole } from './entities/platform-user.entity';
import { UsersService } from './users.service';
import { PasswordResetService } from './password-reset.service';

@ApiTags('platform company users')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(PlatformRole.PlatformAdmin)
@Controller('companies/:companyId/users')
export class PlatformCompanyUsersController {
  constructor(
    private readonly users: UsersService,
    private readonly passwordResets: PasswordResetService,
  ) {}

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

  @Get(':userId')
  @ApiOperation({ summary: 'Consultar un usuario y sus permisos como administrador de plataforma' })
  @ApiOkResponse({ type: PlatformCompanyUserResponseDto })
  @ApiNotFoundResponse({ description: 'Compañía o usuario no encontrado' })
  getOne(
    @CurrentUser() actor: AuthenticatedUser,
    @Param('companyId', new ParseUUIDPipe({ version: '4' })) companyId: string,
    @Param('userId', new ParseUUIDPipe({ version: '4' })) userId: string,
  ): Promise<PlatformCompanyUserResponseDto> {
    return this.users.getOneForPlatform(actor, companyId, userId);
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

  @Patch(':userId')
  @ApiOperation({
    summary: 'Editar datos, rol, estatus y permisos de un usuario como administrador de plataforma',
  })
  @ApiOkResponse({ type: PlatformCompanyUserResponseDto })
  @ApiForbiddenResponse({ description: 'Compañía desactivada o suscripción no disponible' })
  @ApiNotFoundResponse({ description: 'Compañía, usuario, plan o plantilla no encontrados' })
  @ApiConflictResponse({ description: 'Último administrador, límite o identidad duplicada' })
  update(
    @CurrentUser() actor: AuthenticatedUser,
    @Param('companyId', new ParseUUIDPipe({ version: '4' })) companyId: string,
    @Param('userId', new ParseUUIDPipe({ version: '4' })) userId: string,
    @Body() input: UpdatePlatformCompanyUserDto,
  ): Promise<PlatformCompanyUserResponseDto> {
    return this.users.updateForPlatform(actor, companyId, userId, input);
  }

  @Patch(':userId/password')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Asignar una contraseña temporal a un usuario tenant como administrador de plataforma',
    description:
      'Conserva el rol, los permisos y el estatus del usuario; reinicia bloqueos, revoca sus sesiones y exige cambiar la contraseña en el siguiente acceso.',
  })
  @ApiNoContentResponse({ description: 'Contraseña temporal asignada y sesiones revocadas' })
  @ApiBadRequestResponse({
    description: 'La contraseña temporal no cumple las reglas de longitud o complejidad',
  })
  @ApiForbiddenResponse({ description: 'Se requiere administrador de plataforma' })
  @ApiNotFoundResponse({ description: 'Compañía o usuario no encontrado' })
  resetPassword(
    @CurrentUser() actor: AuthenticatedUser,
    @Param('companyId', new ParseUUIDPipe({ version: '4' })) companyId: string,
    @Param('userId', new ParseUUIDPipe({ version: '4' })) userId: string,
    @Body() input: ResetPasswordDto,
  ): Promise<void> {
    return this.passwordResets.resetCompanyUserForPlatform(
      actor,
      companyId,
      userId,
      input.password,
    );
  }

  @Delete(':userId')
  @ApiOperation({ summary: 'Desactivar un usuario como administrador de plataforma' })
  @ApiOkResponse({ type: PlatformCompanyUserResponseDto })
  @ApiNotFoundResponse({ description: 'Compañía o usuario no encontrado' })
  @ApiConflictResponse({ description: 'La compañía debe conservar un administrador activo' })
  deactivate(
    @CurrentUser() actor: AuthenticatedUser,
    @Param('companyId', new ParseUUIDPipe({ version: '4' })) companyId: string,
    @Param('userId', new ParseUUIDPipe({ version: '4' })) userId: string,
  ): Promise<PlatformCompanyUserResponseDto> {
    return this.users.deactivateForPlatform(actor, companyId, userId);
  }

  @Patch(':userId/activate')
  @ApiOperation({ summary: 'Reactivar un usuario como administrador de plataforma' })
  @ApiOkResponse({ type: PlatformCompanyUserResponseDto })
  @ApiForbiddenResponse({ description: 'Compañía desactivada o suscripción no disponible' })
  @ApiNotFoundResponse({ description: 'Compañía o usuario no encontrado' })
  @ApiConflictResponse({ description: 'Límite de usuarios activos alcanzado' })
  activate(
    @CurrentUser() actor: AuthenticatedUser,
    @Param('companyId', new ParseUUIDPipe({ version: '4' })) companyId: string,
    @Param('userId', new ParseUUIDPipe({ version: '4' })) userId: string,
  ): Promise<PlatformCompanyUserResponseDto> {
    return this.users.activateForPlatform(actor, companyId, userId);
  }
}
