import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
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
import {
  CreateInventoryMovementDto,
  InventoryMovementQueryDto,
  InventoryMovementResponseDto,
  InventoryLotResponseDto,
  InventoryProductQueryDto,
  InventoryProductResponseDto,
  PaginatedInventoryMovementsResponseDto,
  PaginatedInventoryProductsResponseDto,
  InventoryMovementType,
} from './dto/inventory.dto';
import { InventoryService } from './inventory.service';

@ApiTags('inventory')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, SubscriptionGuard, PermissionGuard)
@RequiresFeature('inventory')
@Controller('inventory')
export class InventoryController {
  constructor(
    private readonly inventory: InventoryService,
    private readonly permissions: PermissionsService,
  ) {}

  @Get('products')
  @RequiresPermissions('inventory.view')
  @ApiOperation({ summary: 'Listar existencias de productos con control de inventario' })
  @ApiOkResponse({ type: PaginatedInventoryProductsResponseDto })
  listProducts(
    @CurrentUser() user: AuthenticatedUser,
    @Query() query: InventoryProductQueryDto,
  ): Promise<PaginatedInventoryProductsResponseDto> {
    return this.inventory.listProducts(user, query).then((result) => {
      if (!this.permissions.has(user, 'catalog.view_costs')) {
        result.items.forEach((product) => {
          product.lastCost = null;
          product.averageCost = null;
        });
      }
      return result;
    });
  }

  @Get('products/:id')
  @RequiresPermissions('inventory.view')
  @ApiOperation({ summary: 'Consultar la existencia de un producto' })
  @ApiOkResponse({ type: InventoryProductResponseDto })
  getProduct(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
  ): Promise<InventoryProductResponseDto> {
    return this.inventory.getProduct(user, id).then((product) => {
      if (!this.permissions.has(user, 'catalog.view_costs')) {
        product.lastCost = null;
        product.averageCost = null;
      }
      return product;
    });
  }

  @Get('products/:id/lots')
  @RequiresPermissions('inventory.view', 'catalog.view_costs')
  @ApiOperation({ summary: 'Consultar los lotes y costos de adquisición de un producto' })
  @ApiOkResponse({ type: InventoryLotResponseDto, isArray: true })
  listLots(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
  ): Promise<InventoryLotResponseDto[]> {
    return this.inventory.listLots(user, id);
  }

  @Get('movements')
  @RequiresPermissions('inventory.view', 'catalog.view_costs')
  @ApiOperation({ summary: 'Consultar el historial de movimientos de inventario' })
  @ApiOkResponse({ type: PaginatedInventoryMovementsResponseDto })
  listMovements(
    @CurrentUser() user: AuthenticatedUser,
    @Query() query: InventoryMovementQueryDto,
  ): Promise<PaginatedInventoryMovementsResponseDto> {
    return this.inventory.listMovements(user, query);
  }

  @Post('movements')
  @ApiOperation({ summary: 'Registrar una entrada, salida o ajuste de inventario' })
  @ApiCreatedResponse({ type: InventoryMovementResponseDto })
  createMovement(
    @CurrentUser() user: AuthenticatedUser,
    @Body() input: CreateInventoryMovementDto,
  ): Promise<InventoryMovementResponseDto> {
    this.permissions.assert(
      user,
      input.type === InventoryMovementType.Adjustment ? 'inventory.adjust' : 'inventory.move',
    );
    if (input.unitCost !== undefined && input.unitCost !== null) {
      this.permissions.assert(user, 'catalog.view_costs');
    }
    return this.inventory.createMovement(user, input).then((movement) => {
      if (!this.permissions.has(user, 'catalog.view_costs')) movement.unitCost = null;
      return movement;
    });
  }
}
