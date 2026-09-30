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
@UseGuards(JwtAuthGuard, SubscriptionGuard)
@RequiresFeature('item_catalog')
@Controller('catalogs')
export class ConceptCatalogController {
  constructor(private readonly catalog: ConceptCatalogService) {}

  @Get('units')
  @ApiOperation({ summary: 'Listar unidades internas de la compañía' })
  @ApiOkResponse({ type: MeasurementUnitResponseDto, isArray: true })
  listUnits(
    @CurrentUser() user: AuthenticatedUser,
    @Query() query: MeasurementUnitQueryDto,
  ): Promise<MeasurementUnitResponseDto[]> {
    return this.catalog.listUnits(user, query);
  }

  @Get('units/:id')
  @ApiOperation({ summary: 'Consultar una unidad interna' })
  @ApiOkResponse({ type: MeasurementUnitResponseDto })
  getUnit(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
  ): Promise<MeasurementUnitResponseDto> {
    return this.catalog.getUnit(user, id);
  }

  @Post('units')
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
  @ApiOperation({ summary: 'Listar productos y servicios de la compañía' })
  @ApiOkResponse({ type: PaginatedConceptsResponseDto })
  listConcepts(
    @CurrentUser() user: AuthenticatedUser,
    @Query() query: ConceptQueryDto,
  ): Promise<PaginatedConceptsResponseDto> {
    return this.catalog.listConcepts(user, query);
  }

  @Get('concepts/:id')
  @ApiOperation({ summary: 'Consultar un producto o servicio' })
  @ApiOkResponse({ type: ConceptResponseDto })
  getConcept(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
  ): Promise<ConceptResponseDto> {
    return this.catalog.getConcept(user, id);
  }

  @Post('concepts')
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
  @ApiOperation({ summary: 'Editar, activar o desactivar un producto o servicio' })
  @ApiOkResponse({ type: ConceptResponseDto })
  updateConcept(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Body() input: UpdateConceptDto,
  ): Promise<ConceptResponseDto> {
    return this.catalog.updateConcept(user, id, input);
  }
}
