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
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/roles';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { AuthenticatedUser } from '../../common/types/authenticated-user';
import { RequiresFeature, SubscriptionGuard } from '../../subscriptions/subscription.guard';
import { PermissionGuard, RequiresPermissions } from '../../permissions/permission.guard';
import { PermissionsService } from '../../permissions/permissions.service';
import {
  ChangeExpenseStatusDto,
  CreateExpenseDto,
  ExpenseCategoryResponseDto,
  ExpenseMonthlySummaryQueryDto,
  ExpenseMonthlySummaryResponseDto,
  ExpenseQueryDto,
  ExpenseResponseDto,
  PaginatedExpensesResponseDto,
  UpdateExpenseDto,
  ExpenseStatus,
} from './dto/expense.dto';
import { ExpensesService } from './expenses.service';

@ApiTags('expenses')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, SubscriptionGuard, PermissionGuard)
@RequiresFeature('expenses')
@Controller('expenses')
export class ExpensesController {
  constructor(
    private readonly expenses: ExpensesService,
    private readonly permissions: PermissionsService,
  ) {}

  @Get('categories')
  @RequiresPermissions('expenses.view')
  @ApiOperation({ summary: 'Consultar categorías disponibles para gastos' })
  @ApiOkResponse({ type: ExpenseCategoryResponseDto, isArray: true })
  categories(@CurrentUser() user: AuthenticatedUser): Promise<ExpenseCategoryResponseDto[]> {
    return this.expenses.categories(user);
  }

  @Get('summary')
  @RequiresPermissions('expenses.view')
  @ApiOperation({ summary: 'Consultar resumen mensual y comparación contra el mes anterior' })
  @ApiOkResponse({ type: ExpenseMonthlySummaryResponseDto })
  summary(
    @CurrentUser() user: AuthenticatedUser,
    @Query() query: ExpenseMonthlySummaryQueryDto,
  ): Promise<ExpenseMonthlySummaryResponseDto> {
    return this.expenses.monthlySummary(user, query);
  }

  @Get()
  @RequiresPermissions('expenses.view')
  @ApiOperation({ summary: 'Listar y buscar gastos de la compañía' })
  @ApiOkResponse({ type: PaginatedExpensesResponseDto })
  list(
    @CurrentUser() user: AuthenticatedUser,
    @Query() query: ExpenseQueryDto,
  ): Promise<PaginatedExpensesResponseDto> {
    return this.expenses.list(user, query);
  }

  @Get(':id')
  @RequiresPermissions('expenses.view')
  @ApiOperation({ summary: 'Consultar un gasto con sus historiales de estados y ediciones' })
  @ApiOkResponse({ type: ExpenseResponseDto })
  getOne(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
  ): Promise<ExpenseResponseDto> {
    return this.expenses.getOne(user, id);
  }

  @Post()
  @RequiresPermissions('expenses.create')
  @ApiOperation({ summary: 'Registrar y confirmar un gasto automáticamente' })
  @ApiCreatedResponse({ type: ExpenseResponseDto })
  create(
    @CurrentUser() user: AuthenticatedUser,
    @Body() input: CreateExpenseDto,
  ): Promise<ExpenseResponseDto> {
    return this.expenses.create(user, input);
  }

  @Patch(':id')
  @RequiresPermissions('expenses.edit')
  @ApiOperation({ summary: 'Editar un gasto confirmado mientras no esté cancelado' })
  @ApiOkResponse({ type: ExpenseResponseDto })
  update(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Body() input: UpdateExpenseDto,
  ): Promise<ExpenseResponseDto> {
    return this.expenses.update(user, id, input);
  }

  @Post(':id/status')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Cancelar un gasto',
    description:
      'La confirmación se conserva únicamente por compatibilidad con clientes anteriores.',
  })
  @ApiOkResponse({ type: ExpenseResponseDto })
  changeStatus(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Body() input: ChangeExpenseStatusDto,
  ): Promise<ExpenseResponseDto> {
    this.permissions.assert(
      user,
      input.status === ExpenseStatus.Confirmed ? 'expenses.confirm' : 'expenses.cancel',
    );
    return this.expenses.changeStatus(user, id, input);
  }
}
