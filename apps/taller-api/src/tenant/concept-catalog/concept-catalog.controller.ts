import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/roles';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { AuthenticatedUser } from '../../common/types/authenticated-user';
import { RequiresFeature, SubscriptionGuard } from '../../subscriptions/subscription.guard';
import { PermissionGuard, RequiresPermissions } from '../../permissions/permission.guard';
import { PermissionsService } from '../../permissions/permissions.service';
import { ConceptCatalogService } from './concept-catalog.service';
import {
  ConceptQueryDto,
  ConceptResponseDto,
  CreateConceptDto,
  CreateMeasurementUnitDto,
  MeasurementUnitQueryDto,
  MeasurementUnitResponseDto,
  PaginatedConceptsResponseDto,
  UpdateConceptDto,
  UpdateMeasurementUnitDto,
} from './dto/concept-catalog.dto';

@ApiTags('concept-catalog')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, SubscriptionGuard, PermissionGuard)
@RequiresFeature('item_catalog')
@Controller('catalogs')
export class ConceptCatalogController {
  constructor(
    private readonly catalog: ConceptCatalogService,
    private readonly permissions: PermissionsService,
  ) {}

  @Get('units')
  @RequiresPermissions('catalog.view')
  @ApiOperation({ summary: 'Listar unidades internas de la compañía' })
  @ApiOkResponse({ type: MeasurementUnitResponseDto, isArray: true })
  listUnits(
    @CurrentUser() user: AuthenticatedUser,
    @Query() query: MeasurementUnitQueryDto,
  ): Promise<MeasurementUnitResponseDto[]> {
    return this.catalog.listUnits(user, query);
  }

  @Get('units/:id')
  @RequiresPermissions('catalog.view')
  @ApiOperation({ summary: 'Consultar una unidad interna' })
  @ApiOkResponse({ type: MeasurementUnitResponseDto })
  getUnit(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
  ): Promise<MeasurementUnitResponseDto> {
    return this.catalog.getUnit(user, id);
  }

  @Post('units')
  @RequiresPermissions('catalog.manage')
  @ApiOperation({ summary: 'Crear una unidad interna' })
  @ApiCreatedResponse({ type: MeasurementUnitResponseDto })
  @ApiConflictResponse({ description: 'Nombre o símbolo duplicado' })
  createUnit(
    @CurrentUser() user: AuthenticatedUser,
    @Body() input: CreateMeasurementUnitDto,
  ): Promise<MeasurementUnitResponseDto> {
    return this.catalog.createUnit(user, input);
  }

  @Patch('units/:id')
  @RequiresPermissions('catalog.manage')
  @ApiOperation({ summary: 'Editar, activar o desactivar una unidad interna' })
  @ApiOkResponse({ type: MeasurementUnitResponseDto })
  updateUnit(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Body() input: UpdateMeasurementUnitDto,
  ): Promise<MeasurementUnitResponseDto> {
    return this.catalog.updateUnit(user, id, input);
  }

  @Get('concepts')
  @RequiresPermissions('catalog.view')
  @ApiOperation({ summary: 'Listar productos y servicios de la compañía' })
  @ApiOkResponse({ type: PaginatedConceptsResponseDto })
  listConcepts(
    @CurrentUser() user: AuthenticatedUser,
    @Query() query: ConceptQueryDto,
  ): Promise<PaginatedConceptsResponseDto> {
    return this.catalog.listConcepts(user, query).then((result) => {
      if (!this.permissions.has(user, 'catalog.view_costs')) {
        result.items.forEach((concept) => this.redactCosts(concept));
      }
      return result;
    });
  }

  @Get('concepts/:id')
  @RequiresPermissions('catalog.view')
  @ApiOperation({ summary: 'Consultar un producto o servicio' })
  @ApiOkResponse({ type: ConceptResponseDto })
  getConcept(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
  ): Promise<ConceptResponseDto> {
    return this.catalog.getConcept(user, id).then((concept) => {
      if (!this.permissions.has(user, 'catalog.view_costs')) this.redactCosts(concept);
      return concept;
    });
  }

  @Post('concepts')
  @RequiresPermissions('catalog.manage', 'catalog.view_costs')
  @ApiOperation({ summary: 'Crear un producto o servicio' })
  @ApiCreatedResponse({ type: ConceptResponseDto })
  @ApiConflictResponse({ description: 'SKU duplicado' })
  createConcept(
    @CurrentUser() user: AuthenticatedUser,
    @Body() input: CreateConceptDto,
  ): Promise<ConceptResponseDto> {
    return this.catalog.createConcept(user, input);
  }

  @Patch('concepts/:id')
  @RequiresPermissions('catalog.manage', 'catalog.view_costs')
  @ApiOperation({ summary: 'Editar, activar o desactivar un producto o servicio' })
  @ApiOkResponse({ type: ConceptResponseDto })
  updateConcept(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Body() input: UpdateConceptDto,
  ): Promise<ConceptResponseDto> {
    return this.catalog.updateConcept(user, id, input);
  }

  private redactCosts(concept: ConceptResponseDto): void {
    concept.cost = null;
    concept.lastCost = null;
    concept.averageCost = null;
  }
}
