import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiCreatedResponse, ApiTags } from '@nestjs/swagger';
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
  @ApiCreatedResponse({ type: CompanyResponseDto })
  create(@Body() input: CreateCompanyDto): Promise<CompanyResponseDto> {
    return this.companies.create(input);
  }
}
