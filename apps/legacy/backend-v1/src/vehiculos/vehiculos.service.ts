import { EnumPrefijoEntity } from './../commom/enums/general.enum';
import { BadRequestException, Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { CreateVehiculoDto } from './dto/create-vehiculo.dto';
import { UpdateVehiculoDto } from './dto/update-vehiculo.dto';
import { Vehiculo } from './entities/vehiculo.entity';
import { DataSource } from 'typeorm';
import { Modelo } from '../modelos/entities/modelo.entity';
import { User } from '../auth/entities/user.entity';
import { generarEntityId } from '../config/generarEntityId';

@Injectable()
export class VehiculosService {

  constructor(    
    private readonly dataSource: DataSource
  ){}
  
  async create(createVehiculoDto: CreateVehiculoDto, user: User) {

    const schema = user.compania.schema;
    const queryRunner = this.dataSource.createQueryRunner();
    queryRunner.connect();

    try{

      await queryRunner.query(`SET search_path TO ${schema}, public`);

      const repoVehiculo = queryRunner.manager.getRepository(Vehiculo);

      if( !createVehiculoDto.numeroSerie ){
        throw new BadRequestException(`Debes ingresar el Número de Serie`)
      }

      const numeroSerieRegistradoPreviamente = await repoVehiculo.findOneBy({numeroSerie: createVehiculoDto.numeroSerie.toLowerCase()})        

      if( numeroSerieRegistradoPreviamente ){
        throw new BadRequestException(`El Número de Serie ingresado ya fué registrado con el vehículo: ${ numeroSerieRegistradoPreviamente.id }`)
      }
       
      const repoModelo = queryRunner.manager.getRepository(Modelo);

      const modelo = await repoModelo.findOneBy({ id: createVehiculoDto.id_modelo })

      if( !modelo ){
        throw new NotFoundException(`El modelo con el Id: ${createVehiculoDto.id_modelo} no existe`)
      }

      const nuevoId = await generarEntityId(repoVehiculo, EnumPrefijoEntity.VEHICULOS );

      const nuevoVehiculo = repoVehiculo.create({
        id: nuevoId,
        modelo: modelo,
        ...createVehiculoDto,
        createdAtUser: user,
        updatedAtUser: user
      })     

      return await repoVehiculo.save( nuevoVehiculo )

    }catch(error){

      if( error instanceof NotFoundException ){
        throw error
      }

      if( error instanceof BadRequestException){
        throw error
      }
      
      throw new InternalServerErrorException('Ocurrió un error inesperado al crear el Vehículo')
    }finally{
      await queryRunner.release();
    }

  }

  async getPaginado( page: number, limit: number, fSearch: string, user: User ){
    
    const schema = user.compania.schema;

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect()

    try{
      
      await queryRunner.query(`SET search_path TO ${schema}, public`);

      const repoVehiculo = queryRunner.manager.getRepository(Vehiculo);
      
      const query = repoVehiculo.createQueryBuilder('vehiculo')

      if(fSearch !== ''){

        const search = `%${fSearch.trim().toLowerCase()}%`
        
        query.andWhere(
          `(
          vehiculo.id LIKE :search OR
          CAST( vehiculo.anio AS TEXT ) LIKE :search OR
          vehiculo.color LIKE :search OR
          vehiculo.placa LIKE :search OR
          vehiculo.numeroSerie LIKE :search OR
          modelo.nombre LIKE :search OR
          marca.nombre LIKE :search
          )`,
          {
            search: search
          }
        )
      }

      query.leftJoinAndSelect('vehiculo.modelo', 'modelo')

      query.leftJoinAndSelect('modelo.marca', 'marca')

      query.orderBy(`vehiculo.id`, 'DESC')

      const offset =  ( page - 1 ) * limit;
      query.skip(offset).take(limit)

      const [ data, totalItems] = await query.getManyAndCount()      

      return {
        count: totalItems,
        pages: Math.ceil(totalItems / limit),
        vehiculos: data
      }

    }finally{
      await queryRunner.release();
    }
  }
  
  async getOne(id: string, user: User){

     const schema = user.compania.schema;

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect()

    try{

      await queryRunner.query(`SET search_path TO ${schema}, public`);

      const repoVehiculo = queryRunner.manager.getRepository(Vehiculo);
    
      const query = repoVehiculo.createQueryBuilder('vehiculo')

      query.andWhere('vehiculo.id LIKE :id', { id: `${id.toLowerCase()}`})

      query.leftJoinAndSelect('vehiculo.modelo', 'modelo')

      query.leftJoinAndSelect('modelo.marca', 'marca')

      const data = await query.getOne()

      if(!data){
        throw new NotFoundException(`El vehículo con el Id ${ id.toUpperCase() } no fué encontrado`)
      }

      return data
    
    }finally{

      await queryRunner.release()

    }

  }

  async getTotalVehiculos(user: User) {
    const schema = user.compania.schema;
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();

    try {

      await queryRunner.query(`SET search_path TO ${schema}, public`);

      const repoVehiculo = queryRunner.manager.getRepository(Vehiculo);

      const total = await repoVehiculo.count()

      return{
        total: total
      }

    } finally {
      await queryRunner.release();
    }
  }

  async update(id: string, updateVehiculoDto: UpdateVehiculoDto, user: User) {

    const schema = user.compania.schema;
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect()

    try{

      await queryRunner.query(`SET search_path TO ${schema}, public`);

      const repoVehiculo = queryRunner.manager.getRepository(Vehiculo);

      const vehiculo = await repoVehiculo.findOneBy({id:id})

      if(!vehiculo){
        throw new NotFoundException(`El vehículo con el Id ${ id.toUpperCase() } no fué encontrado`)
      }
      
      Object.assign( vehiculo, updateVehiculoDto )
      vehiculo.updatedAtUser = user;

      await repoVehiculo.save(vehiculo)

      const vehiculoConRelaciones = await repoVehiculo.findOne({
        where: { id },
        relations: ['modelo', 'modelo.marca'],
      });

      return vehiculoConRelaciones

    }catch(error){      
    
      if( error instanceof BadRequestException){
        throw error
      }
      
      throw new InternalServerErrorException('Ocurrió un error inesperado al crear el Vehículo')
    }finally{
      await queryRunner.release();
    }
  }

}