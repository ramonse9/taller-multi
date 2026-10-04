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
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnprocessableEntityResponse,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/roles';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { AuthenticatedUser } from '../../common/types/authenticated-user';
import { RequiresFeature, SubscriptionGuard } from '../../subscriptions/subscription.guard';
import { PermissionGuard, RequiresPermissions } from '../../permissions/permission.guard';
import { PermissionsService } from '../../permissions/permissions.service';
import {
  ChangeOrderStatusDto,
  ChangeOrderPaymentStatusDto,
  CreateOrderDto,
  CreateOrderNoteDto,
  OrderNoteResponseDto,
  OrderQueryDto,
  OrderResponseDto,
  PaginatedOrdersResponseDto,
  UpdateOrderDto,
  OrderStatus,
  OrderSummaryResponseDto,
} from './dto/order.dto';
import { OrdersService } from './orders.service';

@ApiTags('orders')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, SubscriptionGuard, PermissionGuard)
@RequiresFeature('service_orders')
@Controller('orders')
export class OrdersController {
  constructor(
    private readonly orders: OrdersService,
    private readonly permissions: PermissionsService,
  ) {}

  @Get()
  @RequiresPermissions('orders.view')
  @ApiOperation({ summary: 'Listar órdenes de servicio de la compañía' })
  @ApiOkResponse({ type: PaginatedOrdersResponseDto })
  list(
    @CurrentUser() user: AuthenticatedUser,
    @Query() query: OrderQueryDto,
  ): Promise<PaginatedOrdersResponseDto> {
    return this.orders.list(user, query).then((result) => {
      if (!this.permissions.has(user, 'catalog.view_costs')) {
        result.items.forEach((order) => this.redactOrderCosts(order));
      }
      return result;
    });
  }

  @Get(':id')
  @RequiresPermissions('orders.view')
  @ApiOperation({ summary: 'Consultar orden, conceptos, notas e historial' })
  @ApiOkResponse({ type: OrderResponseDto })
  getOne(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
  ): Promise<OrderResponseDto> {
    return this.secureOrder(user, this.orders.getOne(user, id));
  }

  @Post()
  @RequiresPermissions('orders.create')
  @ApiOperation({ summary: 'Crear una orden con conceptos de catálogo o captura libre' })
  @ApiCreatedResponse({ type: OrderResponseDto })
  @ApiUnprocessableEntityResponse({
    description: 'Cliente o vehículo inactivo, inexistente o sin relación',
  })
  create(
    @CurrentUser() user: AuthenticatedUser,
    @Body() input: CreateOrderDto,
  ): Promise<OrderResponseDto> {
    if (input.items.some((item) => item.unitCost !== undefined && item.unitCost !== null)) {
      this.permissions.assert(user, 'catalog.view_costs');
    }
    return this.secureOrder(user, this.orders.create(user, input));
  }

  @Patch(':id')
  @RequiresPermissions('orders.edit')
  @ApiOperation({ summary: 'Actualizar cliente, vehículo o conceptos de una orden editable' })
  @ApiOkResponse({ type: OrderResponseDto })
  update(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Body() input: UpdateOrderDto,
  ): Promise<OrderResponseDto> {
    if (input.items?.some((item) => item.unitCost !== undefined && item.unitCost !== null)) {
      this.permissions.assert(user, 'catalog.view_costs');
    }
    return this.secureOrder(user, this.orders.update(user, id, input));
  }

  @Post(':id/status')
  @RequiresPermissions('orders.change_status')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Cambiar el estado y registrar el historial de la orden' })
  @ApiOkResponse({ type: OrderResponseDto })
  changeStatus(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Body() input: ChangeOrderStatusDto,
  ): Promise<OrderResponseDto> {
    if (input.status === OrderStatus.Cancelled) this.permissions.assert(user, 'orders.cancel');
    return this.secureOrder(user, this.orders.changeStatus(user, id, input));
  }

  @Patch(':id/payment-status')
  @RequiresPermissions('orders.manage_payment')
  @ApiOperation({ summary: 'Marcar una orden como pagada o pendiente' })
  @ApiOkResponse({ type: OrderResponseDto })
  changePaymentStatus(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Body() input: ChangeOrderPaymentStatusDto,
  ): Promise<OrderResponseDto> {
    return this.secureOrder(user, this.orders.changePaymentStatus(user, id, input));
  }

  @Post(':id/notes')
  @RequiresPermissions('orders.add_notes')
  @ApiOperation({ summary: 'Agregar una nota a la orden' })
  @ApiCreatedResponse({ type: OrderNoteResponseDto })
  addNote(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Body() input: CreateOrderNoteDto,
  ): Promise<OrderNoteResponseDto> {
    return this.orders.addNote(user, id, input);
  }

  private async secureOrder(
    user: AuthenticatedUser,
    response: Promise<OrderResponseDto>,
  ): Promise<OrderResponseDto> {
    const order = await response;
    if (!this.permissions.has(user, 'catalog.view_costs')) this.redactOrderCosts(order);
    return order;
  }

  private redactOrderCosts(order: OrderSummaryResponseDto): void {
    order.totalCost = null;
    order.grossProfit = null;
    if ('items' in order) {
      for (const item of (order as OrderResponseDto).items) {
        item.unitCost = null;
        item.costAmount = null;
        item.costLayers = [];
      }
    }
  }
}
