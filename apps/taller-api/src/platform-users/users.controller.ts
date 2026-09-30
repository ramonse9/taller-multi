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
  ApiCreatedResponse,
  ApiNoContentResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { AllowPendingPasswordChange, JwtAuthGuard, Roles, RolesGuard } from '../auth/roles';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { AuthenticatedUser } from '../common/types/authenticated-user';
import {
  ChangePasswordDto,
  CreateUserDto,
  PaginatedUsersResponseDto,
  ResetPasswordDto,
  UpdateUserDto,
  UserQueryDto,
  UserResponseDto,
} from './dto/user.dto';
import { PlatformRole } from './entities/platform-user.entity';
import { UsersService } from './users.service';
import {
  AllowInactiveSubscription,
  RequiresSubscription,
  SubscriptionGuard,
} from '../subscriptions/subscription.guard';

@ApiTags('users')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard, SubscriptionGuard)
@RequiresSubscription()
@Controller('users')
export class UsersController {
  constructor(private readonly users: UsersService) {}

  @Get()
  @Roles(PlatformRole.CompanyAdmin)
  @ApiOperation({ summary: 'Listar usuarios de la compañía autenticada' })
  @ApiOkResponse({ type: PaginatedUsersResponseDto })
  list(
    @CurrentUser() user: AuthenticatedUser,
    @Query() query: UserQueryDto,
  ): Promise<PaginatedUsersResponseDto> {
    return this.users.list(user, query);
  }

  @Get(':id')
  @Roles(PlatformRole.CompanyAdmin)
  @ApiOperation({ summary: 'Consultar un usuario de la compañía' })
  @ApiOkResponse({ type: UserResponseDto })
  getOne(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
  ): Promise<UserResponseDto> {
    return this.users.getOne(user, id);
  }

  @Post()
  @Roles(PlatformRole.CompanyAdmin)
  @ApiOperation({ summary: 'Crear un usuario en la compañía' })
  @ApiCreatedResponse({ type: UserResponseDto })
  create(
    @CurrentUser() user: AuthenticatedUser,
    @Body() input: CreateUserDto,
  ): Promise<UserResponseDto> {
    return this.users.create(user, input);
  }

  @Patch('me/password')
  @AllowPendingPasswordChange()
  @AllowInactiveSubscription()
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Cambiar la contraseña del usuario autenticado' })
  @ApiNoContentResponse()
  changeOwnPassword(
    @CurrentUser() user: AuthenticatedUser,
    @Body() input: ChangePasswordDto,
  ): Promise<void> {
    return this.users.changeOwnPassword(user, input);
  }

  @Patch(':id/password')
  @Roles(PlatformRole.CompanyAdmin)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Restablecer la contraseña de otro usuario' })
  @ApiNoContentResponse()
  resetPassword(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Body() input: ResetPasswordDto,
  ): Promise<void> {
    return this.users.resetPassword(user, id, input);
  }

  @Patch(':id')
  @Roles(PlatformRole.CompanyAdmin)
  @ApiOperation({ summary: 'Actualizar datos, rol o activación de un usuario' })
  @ApiOkResponse({ type: UserResponseDto })
  update(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Body() input: UpdateUserDto,
  ): Promise<UserResponseDto> {
    return this.users.update(user, id, input);
  }

  @Delete(':id')
  @Roles(PlatformRole.CompanyAdmin)
  @ApiOperation({ summary: 'Desactivar un usuario sin eliminar su historial' })
  @ApiOkResponse({ type: UserResponseDto })
  deactivate(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
  ): Promise<UserResponseDto> {
    return this.users.deactivate(user, id);
  }
}
