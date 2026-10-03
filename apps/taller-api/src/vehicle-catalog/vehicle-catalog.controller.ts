import {
  Body,
  Controller,
  Delete,
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
import { JwtAuthGuard, Roles, RolesGuard } from '../auth/roles';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { AuthenticatedUser } from '../common/types/authenticated-user';
import { PlatformRole } from '../platform-users/entities/platform-user.entity';
import {
  CreateVehicleBrandDto,
  CreateVehicleModelDto,
  PaginatedVehicleBrandsDto,
  PaginatedVehicleModelsDto,
  UpdateVehicleBrandDto,
  UpdateVehicleModelDto,
  VehicleBrandResponseDto,
  VehicleCatalogQueryDto,
  VehicleModelQueryDto,
  VehicleModelResponseDto,
} from './dto/vehicle-catalog.dto';
import { VehicleCatalogService } from './vehicle-catalog.service';
import { RequiresSubscription, SubscriptionGuard } from '../subscriptions/subscription.guard';
import { PermissionGuard, RequiresPermissions } from '../permissions/permission.guard';

const CATALOG_ADMIN_ROLES = [PlatformRole.PlatformAdmin, PlatformRole.CompanyAdmin];

@ApiTags('vehicle-catalogs')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard, SubscriptionGuard, PermissionGuard)
@RequiresSubscription()
@Controller('catalogs')
export class VehicleCatalogController {
  constructor(private readonly catalog: VehicleCatalogService) {}

  @Get('vehicle-brands')
  @RequiresPermissions('vehicle_catalog.view')
  @ApiOperation({ summary: 'Listar marcas de vehículos' })
  @ApiOkResponse({ type: PaginatedVehicleBrandsDto })
  listBrands(@Query() query: VehicleCatalogQueryDto): Promise<PaginatedVehicleBrandsDto> {
    return this.catalog.listBrands(query);
  }

  @Get('vehicle-brands/:id')
  @RequiresPermissions('vehicle_catalog.view')
  @ApiOperation({ summary: 'Consultar una marca' })
  @ApiOkResponse({ type: VehicleBrandResponseDto })
  getBrand(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
  ): Promise<VehicleBrandResponseDto> {
    return this.catalog.getBrand(id);
  }

  @Post('vehicle-brands')
  @Roles(...CATALOG_ADMIN_ROLES)
  @RequiresPermissions('vehicle_catalog.manage')
  @ApiOperation({ summary: 'Crear una marca global' })
  @ApiCreatedResponse({ type: VehicleBrandResponseDto })
  @ApiConflictResponse({ description: 'La marca ya existe' })
  createBrand(
    @CurrentUser() user: AuthenticatedUser,
    @Body() input: CreateVehicleBrandDto,
  ): Promise<VehicleBrandResponseDto> {
    return this.catalog.createBrand(user, input);
  }

  @Patch('vehicle-brands/:id')
  @Roles(...CATALOG_ADMIN_ROLES)
  @RequiresPermissions('vehicle_catalog.manage')
  @ApiOperation({ summary: 'Editar o reactivar una marca' })
  @ApiOkResponse({ type: VehicleBrandResponseDto })
  updateBrand(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Body() input: UpdateVehicleBrandDto,
  ): Promise<VehicleBrandResponseDto> {
    return this.catalog.updateBrand(user, id, input);
  }

  @Delete('vehicle-brands/:id')
  @Roles(...CATALOG_ADMIN_ROLES)
  @RequiresPermissions('vehicle_catalog.manage')
  @ApiOperation({ summary: 'Desactivar una marca sin eliminarla' })
  @ApiOkResponse({ type: VehicleBrandResponseDto })
  deactivateBrand(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
  ): Promise<VehicleBrandResponseDto> {
    return this.catalog.deactivateBrand(user, id);
  }

  @Get('vehicle-models')
  @RequiresPermissions('vehicle_catalog.view')
  @ApiOperation({ summary: 'Listar modelos de una marca' })
  @ApiOkResponse({ type: PaginatedVehicleModelsDto })
  listModels(@Query() query: VehicleModelQueryDto): Promise<PaginatedVehicleModelsDto> {
    return this.catalog.listModels(query);
  }

  @Get('vehicle-models/:id')
  @RequiresPermissions('vehicle_catalog.view')
  @ApiOperation({ summary: 'Consultar un modelo' })
  @ApiOkResponse({ type: VehicleModelResponseDto })
  getModel(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
  ): Promise<VehicleModelResponseDto> {
    return this.catalog.getModel(id);
  }

  @Post('vehicle-models')
  @Roles(...CATALOG_ADMIN_ROLES)
  @RequiresPermissions('vehicle_catalog.manage')
  @ApiOperation({ summary: 'Crear un modelo dentro de una marca' })
  @ApiCreatedResponse({ type: VehicleModelResponseDto })
  @ApiConflictResponse({ description: 'El modelo ya existe para esa marca' })
  createModel(
    @CurrentUser() user: AuthenticatedUser,
    @Body() input: CreateVehicleModelDto,
  ): Promise<VehicleModelResponseDto> {
    return this.catalog.createModel(user, input);
  }

  @Patch('vehicle-models/:id')
  @Roles(...CATALOG_ADMIN_ROLES)
  @RequiresPermissions('vehicle_catalog.manage')
  @ApiOperation({ summary: 'Editar o reactivar un modelo' })
  @ApiOkResponse({ type: VehicleModelResponseDto })
  updateModel(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Body() input: UpdateVehicleModelDto,
  ): Promise<VehicleModelResponseDto> {
    return this.catalog.updateModel(user, id, input);
  }

  @Delete('vehicle-models/:id')
  @Roles(...CATALOG_ADMIN_ROLES)
  @RequiresPermissions('vehicle_catalog.manage')
  @ApiOperation({ summary: 'Desactivar un modelo sin eliminarlo' })
  @ApiOkResponse({ type: VehicleModelResponseDto })
  deactivateModel(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
  ): Promise<VehicleModelResponseDto> {
    return this.catalog.deactivateModel(user, id);
  }
}
