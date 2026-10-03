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
import {
  ChangeExpenseStatusDto,
  CreateExpenseDto,
  ExpenseCategoryResponseDto,
  ExpenseQueryDto,
  ExpenseResponseDto,
  PaginatedExpensesResponseDto,
  UpdateExpenseDto,
} from './dto/expense.dto';
import { ExpensesService } from './expenses.service';

@ApiTags('expenses')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, SubscriptionGuard)
@RequiresFeature('expenses')
@Controller('expenses')
export class ExpensesController {
  constructor(private readonly expenses: ExpensesService) {}

  @Get('categories')
  @ApiOperation({ summary: 'Consultar categorías disponibles para gastos' })
  @ApiOkResponse({ type: ExpenseCategoryResponseDto, isArray: true })
  categories(@CurrentUser() user: AuthenticatedUser): Promise<ExpenseCategoryResponseDto[]> {
    return this.expenses.categories(user);
  }

  @Get()
  @ApiOperation({ summary: 'Listar y buscar gastos de la compañía' })
  @ApiOkResponse({ type: PaginatedExpensesResponseDto })
  list(
    @CurrentUser() user: AuthenticatedUser,
    @Query() query: ExpenseQueryDto,
  ): Promise<PaginatedExpensesResponseDto> {
    return this.expenses.list(user, query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Consultar un gasto y su historial de estados' })
  @ApiOkResponse({ type: ExpenseResponseDto })
  getOne(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
  ): Promise<ExpenseResponseDto> {
    return this.expenses.getOne(user, id);
  }

  @Post()
  @ApiOperation({ summary: 'Registrar un gasto en borrador' })
  @ApiCreatedResponse({ type: ExpenseResponseDto })
  create(
    @CurrentUser() user: AuthenticatedUser,
    @Body() input: CreateExpenseDto,
  ): Promise<ExpenseResponseDto> {
    return this.expenses.create(user, input);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Editar un gasto mientras permanece en borrador' })
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
  @ApiOperation({ summary: 'Confirmar o cancelar un gasto' })
  @ApiOkResponse({ type: ExpenseResponseDto })
  changeStatus(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Body() input: ChangeExpenseStatusDto,
  ): Promise<ExpenseResponseDto> {
    return this.expenses.changeStatus(user, id, input);
  }
}
