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
import { ApiBearerAuth, ApiCreatedResponse, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/roles';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { AuthenticatedUser } from '../../common/types/authenticated-user';
import { RequiresFeature, SubscriptionGuard } from '../../subscriptions/subscription.guard';
import { ClientsService } from './clients.service';
import {
  ClientQueryDto,
  ClientResponseDto,
  ClientsTotalResponseDto,
  CreateClientDto,
  PaginatedClientsResponseDto,
  UpdateClientDto,
} from './dto/client.dto';

@ApiTags('clients')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, SubscriptionGuard)
@RequiresFeature('customer_history')
@Controller('clients')
export class ClientsController {
  constructor(private readonly clients: ClientsService) {}

  @Get()
  @ApiOkResponse({ type: PaginatedClientsResponseDto })
  list(
    @CurrentUser() user: AuthenticatedUser,
    @Query() query: ClientQueryDto,
  ): Promise<PaginatedClientsResponseDto> {
    return this.clients.list(user, query);
  }

  @Get('total')
  @ApiOkResponse({ type: ClientsTotalResponseDto })
  total(@CurrentUser() user: AuthenticatedUser): Promise<ClientsTotalResponseDto> {
    return this.clients.total(user);
  }

  @Get(':id')
  @ApiOkResponse({ type: ClientResponseDto })
  getOne(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
  ): Promise<ClientResponseDto> {
    return this.clients.getOne(user, id);
  }

  @Post()
  @ApiCreatedResponse({ type: ClientResponseDto })
  create(
    @CurrentUser() user: AuthenticatedUser,
    @Body() input: CreateClientDto,
  ): Promise<ClientResponseDto> {
    return this.clients.create(user, input);
  }

  @Patch(':id')
  @ApiOkResponse({ type: ClientResponseDto })
  update(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Body() input: UpdateClientDto,
  ): Promise<ClientResponseDto> {
    return this.clients.update(user, id, input);
  }
}
