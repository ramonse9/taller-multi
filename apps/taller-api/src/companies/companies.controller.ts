import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiForbiddenResponse,
  ApiOperation,
  ApiTags,
  ApiUnprocessableEntityResponse,
} from '@nestjs/swagger';
import { JwtAuthGuard, Roles, RolesGuard } from '../auth/roles';
import { PlatformRole } from '../platform-users/entities/platform-user.entity';
import { CompaniesService } from './companies.service';
import { CompanyResponseDto, CreateCompanyDto } from './dto/create-company.dto';

@ApiTags('companies')
@ApiBearerAuth()
@Controller('companies')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(PlatformRole.PlatformAdmin)
export class CompaniesController {
  constructor(private readonly companies: CompaniesService) {}
  @Post()
  @ApiOperation({ summary: 'Registrar compañía, schema y primer administrador tenant' })
  @ApiCreatedResponse({ type: CompanyResponseDto })
  @ApiConflictResponse({ description: 'Compañía, schema o correo ya registrado' })
  @ApiForbiddenResponse({ description: 'Se requiere administrador de plataforma' })
  @ApiUnprocessableEntityResponse({ description: 'Catálogo global inválido' })
  create(@Body() input: CreateCompanyDto): Promise<CompanyResponseDto> {
    return this.companies.create(input);
  }
}
