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
import {
  ChangeOrderStatusDto,
  CreateOrderDto,
  CreateOrderNoteDto,
  OrderNoteResponseDto,
  OrderQueryDto,
  OrderResponseDto,
  PaginatedOrdersResponseDto,
  UpdateOrderDto,
} from './dto/order.dto';
import { OrdersService } from './orders.service';

@ApiTags('orders')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, SubscriptionGuard)
@RequiresFeature('service_orders')
@Controller('orders')
export class OrdersController {
  constructor(private readonly orders: OrdersService) {}

  @Get()
  @ApiOperation({ summary: 'Listar órdenes de servicio de la compañía' })
  @ApiOkResponse({ type: PaginatedOrdersResponseDto })
  list(
    @CurrentUser() user: AuthenticatedUser,
    @Query() query: OrderQueryDto,
  ): Promise<PaginatedOrdersResponseDto> {
    return this.orders.list(user, query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Consultar orden, conceptos, notas e historial' })
  @ApiOkResponse({ type: OrderResponseDto })
  getOne(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
  ): Promise<OrderResponseDto> {
    return this.orders.getOne(user, id);
  }

  @Post()
  @ApiOperation({ summary: 'Crear una orden con conceptos de catálogo o captura libre' })
  @ApiCreatedResponse({ type: OrderResponseDto })
  @ApiUnprocessableEntityResponse({
    description: 'Cliente o vehículo inactivo, inexistente o sin relación',
  })
  create(
    @CurrentUser() user: AuthenticatedUser,
    @Body() input: CreateOrderDto,
  ): Promise<OrderResponseDto> {
    return this.orders.create(user, input);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Actualizar cliente, vehículo o conceptos de una orden editable' })
  @ApiOkResponse({ type: OrderResponseDto })
  update(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Body() input: UpdateOrderDto,
  ): Promise<OrderResponseDto> {
    return this.orders.update(user, id, input);
  }

  @Post(':id/status')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Cambiar el estado y registrar el historial de la orden' })
  @ApiOkResponse({ type: OrderResponseDto })
  changeStatus(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Body() input: ChangeOrderStatusDto,
  ): Promise<OrderResponseDto> {
    return this.orders.changeStatus(user, id, input);
  }

  @Post(':id/notes')
  @ApiOperation({ summary: 'Agregar una nota a la orden' })
  @ApiCreatedResponse({ type: OrderNoteResponseDto })
  addNote(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Body() input: CreateOrderNoteDto,
  ): Promise<OrderNoteResponseDto> {
    return this.orders.addNote(user, id, input);
  }
}
