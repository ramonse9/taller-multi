import { ClassSerializerInterceptor, Controller, Get, UseInterceptors } from '@nestjs/common';
import { DashboardService } from './dashboard.service';
import { ApiBearerAuth, ApiOkResponse, ApiOperation, ApiTags, ApiUnauthorizedResponse } from '@nestjs/swagger';
import { CountAllResponseDto } from './dto/count-all-response.dto';
import { Auth, GetUser } from '../auth/decorators';
import { User } from '../auth/entities/user.entity';
import { EnumRole } from '../commom/enums/general.enum';

@ApiTags('Dashboard')
@UseInterceptors(ClassSerializerInterceptor)
@ApiUnauthorizedResponse({ description: 'No autorizado' })
@Controller('dashboard')
export class DashboardController {
  
  constructor(private readonly dashboardService: DashboardService) {}
  
  @Get('/count')
  @Auth(EnumRole.ADMIN)
  @ApiOperation({summary: 'Obtener el número total de todas las entidades'})
  @ApiOkResponse({type: CountAllResponseDto, description: 'Cantidad total de todas las entidades'})
  getCountAll( @GetUser() user: User ): Promise<CountAllResponseDto>{
    return this.dashboardService.getCountAll( user );
  }

}
