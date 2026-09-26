import { generarEntityId } from './../config/generarEntityId';
import { EnumNominaMovimientoEstatus, EnumPrefijoEntity } from './../commom/enums/general.enum';
import { User } from './../auth/entities/user.entity';
import { BadRequestException, Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { CreateEmpleadoDto } from './dto/create-empleado.dto';
import { Empleado } from './entities/empleado.entity';
import { plainToInstance } from 'class-transformer';
import { EmpleadoResponseDto } from './dto/empleado-response.dto';
import { UpdateEmpleadoDto } from './dto/update-empleado.dto';

@Injectable()
export class EmpleadosService {

  constructor(
    private dataSource: DataSource
  ){

  } 

  async createEmpleado(createEmpleadoDto: CreateEmpleadoDto, user: User ){
    
    const schema = user.compania.schema;
    
    const queryRunner = this.dataSource.createQueryRunner();

    await queryRunner.connect();

    await queryRunner.startTransaction();

    try{

      await queryRunner.query(`SET search_path TO ${schema}, public`);

      const repoEmpleado = queryRunner.manager.getRepository(Empleado);    
      
      const nuevoId = await generarEntityId( repoEmpleado, EnumPrefijoEntity.EMPLEADOS );

      const empleado = repoEmpleado.create({
        id: nuevoId,
        nombre: createEmpleadoDto.nombre,
        salarioBase: Number( createEmpleadoDto.salarioBase ),
        activo: true,
        createdAtUser: user,
        updatedAtUser: user
      })

      const empleadoBD = await repoEmpleado.save( empleado );

      await queryRunner.commitTransaction();

      const empleadoResponseDto = plainToInstance( EmpleadoResponseDto, empleadoBD, { excludeExtraneousValues: true } );

      return empleadoResponseDto;

    }catch(error){

      await queryRunner.rollbackTransaction();

      if(error instanceof NotFoundException ){
        throw error
      }

      if(error instanceof BadRequestException){
        throw error
      }

      throw new InternalServerErrorException(`Ocurrió un error inesperado al intentar guardar el Empleado: ${error}`)

    }finally{
      await queryRunner.release();
    }

  }  
  
  async getPaginadoEmpleados( page: number = 1, limit: number, fSearch: string, user: User ) {
      
      const schema = user.compania.schema;
  
      const queryRunner = this.dataSource.createQueryRunner();
      await queryRunner.connect()
  
      try{

        await queryRunner.query(`SET search_path TO ${schema}, public`);

        const repoEmpleado = queryRunner.manager.getRepository(Empleado);

        const offset = (page - 1) * limit;

        const baseQuery = repoEmpleado.createQueryBuilder('nomina_empleado')        

        if (fSearch?.trim()) {
          const search = `%${fSearch.trim().toLowerCase()}%`;
          baseQuery.where('unaccent(nomina_empleado.nombre) ILIKE :search', { search });
        }

        const [empleados, totalItems] = await baseQuery

          .addOrderBy('nomina_empleado.id', 'ASC')
          .skip(offset)
          .take(limit)
          .getManyAndCount();

        return {
          count: totalItems,
          pages: Math.ceil(totalItems / limit),
          empleados,
        };  
  
      }finally{
        await queryRunner.release();
      }
  } 

  async getOne(id: string, user: User) {
      
      const schema = user.compania.schema;
  
      const queryRunner = this.dataSource.createQueryRunner();
      await queryRunner.connect()
  
      try{
  
        await queryRunner.query(`SET search_path TO ${schema}, public`);
  
        const repoEmpleado =  queryRunner.manager.getRepository(Empleado)
        const empleado = await repoEmpleado.findOne({
          where: { id }          
        })
  
        if(!empleado){
          throw new NotFoundException(`El Empleado con el Id ${ id } no fué encontrado`)
        }
  
        return empleado
  
      }finally{
  
        await queryRunner.release()
  
      }
     
  }

  async update(id: string, updateEmpleadoDto: UpdateEmpleadoDto, user: User) {
  
    const schema = user.compania.schema;
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect()

    try{

      await queryRunner.query(`SET search_path TO ${schema}, public`);
      
      const repoEmpleado = queryRunner.manager.getRepository(Empleado)
      
      const empleado = await repoEmpleado.findOneBy({id:id})

      if(!empleado){
        throw new NotFoundException(`El Empleado con el Id ${ id.toUpperCase() } no fué encontrado`)
      }      
      
      Object.assign( empleado, updateEmpleadoDto)
      empleado.updatedAtUser = user
      empleado.nombre = updateEmpleadoDto.nombre
      empleado.salarioBase =  Number( updateEmpleadoDto.salarioBase )
      
      empleado.activo = updateEmpleadoDto.activo
      
      return await repoEmpleado.save( empleado )
    
    }catch(error){      
    
      if( error instanceof BadRequestException){
        throw error
      }

      if(error instanceof NotFoundException){
        throw error
      }
      
      throw new InternalServerErrorException('Ocurrió un error inesperado al actualizar el Cliente')
    }finally{
      await queryRunner.release()
    }

  }

}
