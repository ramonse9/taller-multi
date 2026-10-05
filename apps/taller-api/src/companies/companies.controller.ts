import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiForbiddenResponse,
  ApiOperation,
  ApiNoContentResponse,
  ApiOkResponse,
  ApiTags,
  ApiUnprocessableEntityResponse,
} from '@nestjs/swagger';
import { JwtAuthGuard, Roles, RolesGuard } from '../auth/roles';
import { PlatformRole } from '../platform-users/entities/platform-user.entity';
import { CompaniesService } from './companies.service';
import { CompanyResponseDto, CreateCompanyDto } from './dto/create-company.dto';
import { ResetPasswordDto } from '../platform-users/dto/user.dto';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { AuthenticatedUser } from '../common/types/authenticated-user';

@ApiTags('companies')
@ApiBearerAuth()
@Controller('companies')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(PlatformRole.PlatformAdmin)
export class CompaniesController {
  constructor(private readonly companies: CompaniesService) {}

  @Get()
  @ApiOperation({ summary: 'Listar compañías y su Administrador principal' })
  @ApiOkResponse({ type: CompanyResponseDto, isArray: true })
  list(): Promise<CompanyResponseDto[]> {
    return this.companies.list();
  }

  @Post()
  @ApiOperation({ summary: 'Registrar compañía, schema y primer administrador tenant' })
  @ApiCreatedResponse({ type: CompanyResponseDto })
  @ApiConflictResponse({
    description: 'Compañía, schema, código público, usuario o correo ya registrado',
  })
  @ApiForbiddenResponse({ description: 'Se requiere administrador de plataforma' })
  @ApiUnprocessableEntityResponse({ description: 'Catálogo global inválido' })
  create(@Body() input: CreateCompanyDto): Promise<CompanyResponseDto> {
    return this.companies.create(input);
  }

  @Patch(':companyId/admin/password')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Asignar una contraseña temporal al Administrador principal de una compañía',
  })
  @ApiNoContentResponse()
  resetPrimaryAdminPassword(
    @CurrentUser() user: AuthenticatedUser,
    @Param('companyId', new ParseUUIDPipe({ version: '4' })) companyId: string,
    @Body() input: ResetPasswordDto,
  ): Promise<void> {
    return this.companies.resetPrimaryAdminPassword(user, companyId, input);
  }
}
