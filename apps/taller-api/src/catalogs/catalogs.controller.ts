import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { DataSource } from 'typeorm';
import { JwtAuthGuard } from '../auth/roles';
import { CatalogItemDto, TimezoneCatalogItemDto } from './dto/catalog.dto';

@ApiTags('catalogs')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('catalogs')
export class CatalogsController {
  constructor(private readonly dataSource: DataSource) {}

  @Get('company-types')
  @ApiOkResponse({ type: CatalogItemDto, isArray: true })
  async companyTypes(): Promise<CatalogItemDto[]> {
    return this.dataSource.query<CatalogItemDto[]>(
      'SELECT code, name FROM public.company_types WHERE is_active ORDER BY name',
    );
  }

  @Get('person-types')
  @ApiOkResponse({ type: CatalogItemDto, isArray: true })
  async personTypes(): Promise<CatalogItemDto[]> {
    return this.dataSource.query<CatalogItemDto[]>(
      'SELECT code, name FROM public.person_types WHERE is_active ORDER BY name',
    );
  }

  @Get('timezones')
  @ApiOkResponse({ type: TimezoneCatalogItemDto, isArray: true })
  async timezones(): Promise<TimezoneCatalogItemDto[]> {
    return this.dataSource.query<TimezoneCatalogItemDto[]>(
      'SELECT code, description FROM public.timezones WHERE is_active ORDER BY description',
    );
  }
}
