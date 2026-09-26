import { Body, ClassSerializerInterceptor, Controller, Get, HttpCode, Param, Patch, Post, Query, UseInterceptors } from "@nestjs/common";
import { ApiBadRequestResponse, ApiBody, ApiCreatedResponse, ApiNotFoundResponse, ApiOkResponse, ApiOperation, ApiParam, ApiTags, ApiUnauthorizedResponse } from "@nestjs/swagger";
import { EmpleadosService } from "./empleados.service";
import { Auth, GetUser } from "../auth/decorators";
import { CreateEmpleadoDto } from "./dto/create-empleado.dto";
import { EnumRole } from "../commom/enums/general.enum";
import { EmpleadoResponseDto } from "./dto/empleado-response.dto";
import { User } from "../auth/entities/user.entity";
import { EmpleadoPaginationDto } from "./dto/empleado-pagination.dto";
import { PaginationQueryDto } from "../DTOs/pagination/pagination-query.dto";
import { LowercasePipe } from "../pipes/lowercase/lowercase.pipe";
import { UpdateEmpleadoDto } from "./dto/update-empleado.dto";

@ApiTags('Empleados')
@UseInterceptors(ClassSerializerInterceptor)
@ApiUnauthorizedResponse({ description: 'No autorizado' })
@Controller('empleados')
export class EmpleadosController {
  constructor(private readonly empleadosService: EmpleadosService) {}  
  
    @Post()
    @Auth(EnumRole.ADMIN)
    @HttpCode(201)
    @ApiOperation({summary: 'Crear a un Empleado'})
    @ApiBody({type: CreateEmpleadoDto, description: 'Datos requeridos para crear un Empleado' })
    @ApiCreatedResponse({ 
        description: 'Empleado creado exitosamente',
        type: EmpleadoResponseDto
    })
    createEmpleado(@Body() createEmpleadoDto: CreateEmpleadoDto, @GetUser() user: User ): Promise<EmpleadoResponseDto> {
        return this.empleadosService.createEmpleado(createEmpleadoDto, user);
    }

    @Get()
    @Auth(EnumRole.ADMIN)
    @HttpCode(201)
    @ApiOperation({summary: 'Obtener Empleados (paginado y filtrado)'})
    @ApiOkResponse({description: 'Listado de Empleados', type: EmpleadoPaginationDto})
    async getPaginadoEmpleados(
        @Query() query: PaginationQueryDto,
        @GetUser() user: User,
    ): Promise<EmpleadoPaginationDto> {

        const { page, limit, fSearch } = query;
        const { count, pages, empleados } = await this.empleadosService.getPaginadoEmpleados( page, limit, fSearch, user);

        return {
        page: page,
        limit: limit,
        totalItems: count, 
        totalPages: pages,
        hasNextPage: page < pages,
        empleados: empleados
        }    
        
    }

    @Get(':id')
    @Auth(EnumRole.ADMIN)
    @ApiOperation({summary: 'Obtener un Empleado por su ID'})
    @ApiParam({ name: 'id', description: 'ID del Empleado', example: 'EMP000123'})
    @ApiOkResponse({description: 'Empleado encontrado', type: EmpleadoResponseDto})
    @ApiNotFoundResponse({description: 'Empleado no encontrado'})
    getOne(@Param('id', new LowercasePipe()) id: string, @GetUser() user: User): Promise<EmpleadoResponseDto> {

        return this.empleadosService.getOne(id, user);

    }

    @Patch(':id')
    @Auth(EnumRole.CAPTURISTA)
    @ApiOperation({summary: 'Actualizar información de un Cliente'})
    @ApiParam({name: 'id', description: 'ID del Cliente', example: 'CLI000123'})
    @ApiBody({type: UpdateEmpleadoDto})
    @ApiOkResponse({description: 'Empleado actualizado exitosamente', type: EmpleadoResponseDto})
    @ApiBadRequestResponse({description: 'Datos inválidos'})
    @ApiNotFoundResponse({description: 'Cliente no encontrado'})
    update(@Param('id', new LowercasePipe()) id: string, @Body() updateClienteDto: UpdateEmpleadoDto, @GetUser() user: User): Promise<EmpleadoResponseDto> {

        return this.empleadosService.update(id, updateClienteDto, user);

    }

}  