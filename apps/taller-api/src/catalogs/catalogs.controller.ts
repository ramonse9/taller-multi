import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { DataSource } from 'typeorm';
import { JwtAuthGuard } from '../auth/roles';

interface CatalogItem {
  code: string;
  name: string;
}

@ApiTags('catalogs')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('catalogs')
export class CatalogsController {
  constructor(private readonly dataSource: DataSource) {}

  @Get('company-types')
  async companyTypes(): Promise<CatalogItem[]> {
    return this.dataSource.query<CatalogItem[]>(
      'SELECT code, name FROM public.company_types WHERE is_active ORDER BY name',
    );
  }

  @Get('person-types')
  async personTypes(): Promise<CatalogItem[]> {
    return this.dataSource.query<CatalogItem[]>(
      'SELECT code, name FROM public.person_types WHERE is_active ORDER BY name',
    );
  }
}
