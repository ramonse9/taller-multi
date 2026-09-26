import { EnumPrefijoEntity } from './../commom/enums/general.enum';
import { SatService } from './../sat/sat.service';
import { UpdateProductoServicioDto } from './dto/update-producto-servicio.dto';
import { ProductoServicio } from './entities/producto-servicio.entity';
import { CreateProductoServicioDto } from './dto/create-producto-servicio.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { BadRequestException, Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { User } from './../auth/entities/user.entity';
import { Compania } from './../companias/entities/compania.entity';
import { generarEntityId } from '../config/generarEntityId';
import { CompaniaTipoGiro } from '../companias/entities/compania-tipo-giro.entity';

@Injectable()
export class ProductosServiciosService {
  
  constructor(
    private readonly dataSource: DataSource,
    private readonly satService: SatService,
    @InjectRepository(Compania) private readonly companiaRepository: Repository<Compania>,
    @InjectRepository(CompaniaTipoGiro) private readonly companiaTipoGiroRepository: Repository<CompaniaTipoGiro>
  ){}

  async update(id: string, updateProductoServicioDto: UpdateProductoServicioDto, user: User) {
  
      const schema = user.compania.schema;
  
      const queryRunner = this.dataSource.createQueryRunner()
      await queryRunner.connect();
  
      try{
  
        await queryRunner.query(`SET search_path TO ${schema}, public`);
  
        const repoProductoServicio = queryRunner.manager.getRepository(ProductoServicio);
  
        //const productoServicio = await repoProductoServicio.findOneBy({id:id})
        const productoServicio = await repoProductoServicio.findOne({
          where: { id: id},
          relations: ['satProductoServicio']
        })        
  
        if(!productoServicio){
          throw new NotFoundException(`El Producto ó Servicio con el ID: ${ id.toUpperCase() } no fué encontrado`)
        }  

        //TODO
        const satProductoServicio = await this.satService.getSatProductoServicioById( productoServicio.satProductoServicio.id)
        //const satProductoServicio = await this.satProductoServicioRepository.findOneBy({id: productoServicio.satProductoServicio.id})

        if( !satProductoServicio ){
          throw new NotFoundException('Producto ó Servicio base no encontrado')
        }      
        
        Object.assign( productoServicio, updateProductoServicioDto )
  
        productoServicio.updatedAtUser = user;
        productoServicio.satProductoServicio = satProductoServicio
  
        return await repoProductoServicio.save( productoServicio )
  
      }catch(error){    
        
        if( error instanceof NotFoundException ){
          throw error
        }
      
        if( error instanceof BadRequestException){
          throw error
        }
        
        throw new InternalServerErrorException('Ocurrió un error inesperado al actualizar el Producto ó Servicio')
      }finally{
        await queryRunner.release();
      }
  }  

  remove(id: number) {
    return `This action removes a #${id} productosServicio`;
  }

  async createProductoServicio( createProductoServicioDto: CreateProductoServicioDto, user: User){       
  
      const schema = user.compania.schema;
  
      const queryRunner = this.dataSource.createQueryRunner();
  
      await queryRunner.connect();
  
      await queryRunner.startTransaction();
  
      try{
  
        await queryRunner.query(`SET search_path TO ${schema}, public`);
        
        const repoProductoServicio = queryRunner.manager.getRepository(ProductoServicio);
        
        const satProductoServicio = await this.satService.getSatProductoServicioById( createProductoServicioDto.idSatProductoServicio);
  
        if( !satProductoServicio){
          throw new BadRequestException(`No se puede guardar el producto ó servicio por que no pertenece al catálogo`);
        }

        const compania = await this.companiaRepository.findOne({
          where: {
            id: user.compania.id
          },
          relations: ['companiaTipoGiro']
        })

        if( satProductoServicio.companiaTipoGiro.tipo !== compania.companiaTipoGiro.tipo ){
          throw new BadRequestException(`No se puede guardar el producto ó servicio por que no pertenece al catálogo de tu tipo de giro (${ user.compania.companiaTipoGiro.tipo })`)
        }
        
        const nuevoId = await generarEntityId( repoProductoServicio, EnumPrefijoEntity.PRODUCTOSSERVICIOS );
  
        const productoServicio = repoProductoServicio.create({
          id: nuevoId,
          descripcion: createProductoServicioDto.descripcion,
          valorUnitario: Number( createProductoServicioDto.valorUnitario ),
          satProductoServicio: satProductoServicio,
          createdAtUser: user,
          updatedAtUser: user
        })
  
        const productoServicioBD = await repoProductoServicio.save( productoServicio )

        await queryRunner.commitTransaction();
  
        return productoServicioBD      
  
      }catch(error){
  
        await queryRunner.rollbackTransaction();
  
        
        if(error instanceof NotFoundException ){
          throw error
        }
  
        if(error instanceof BadRequestException){
          throw error
        }
  
        throw new InternalServerErrorException(`Ocurrió un error inesperado al intentar guardar al Producto ó Servicio: ${error}`)        
  
      }finally{
        await queryRunner.release();
      }
  
  }

  async getPaginadoProductosServicios( page: number, limit: number, fSearch: string, user: User){

    const schema = user.compania.schema;

    const queryRunner = this.dataSource.createQueryRunner();

    await queryRunner.connect();

    try{

      await queryRunner.query(`SET search_path TO ${schema}, public`);

      const repoProductoServicio = queryRunner.manager.getRepository(ProductoServicio);

      const query = repoProductoServicio.createQueryBuilder('productoServicio');
      query.leftJoinAndSelect('productoServicio.satProductoServicio', 'satProductosServicios');
      query.leftJoinAndSelect('satProductosServicios.satTipoProductoServicio','satTipoProductoServicio')

      if(fSearch !== ''){

        const search = `%${fSearch.trim().toLowerCase()}%`
        
        query.andWhere(
          `(
            LOWER( productoServicio.descripcion ) LIKE :search
            )`,
            {
              search: search              
            }
        )

      }

      query.orderBy(`productoServicio.id`, 'DESC');

      const offset = (page - 1) * limit;
      query.skip(offset).take(limit);

      const [ data, totalItems ] = await query.getManyAndCount();

      return {
        count: totalItems, 
        pages: Math.ceil(totalItems / limit),
        productosServicios: data
      }

    }catch(error){
    
      if( error instanceof BadRequestException){
        throw error
      }

      if(error instanceof NotFoundException){
        throw error
      }
      
      throw new InternalServerErrorException('Ocurrió un error inesperado al obtener las facturas')

    }finally{
      await queryRunner.release()
    }

  }

  async getProductoServicioById( id: string, user: User){

    const schema = user.compania.schema;

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();

    try{

      await queryRunner.query(`SET search_path TO ${schema}, public`);

      const repoProductoServicio = queryRunner.manager.getRepository(ProductoServicio);

      const query = repoProductoServicio.createQueryBuilder('productoServicio');

      //query.leftJoinAndSelect('productoServicio.id_sat_producto_servicio', 'satProductoServicio');
      query.leftJoinAndSelect('productoServicio.satProductoServicio', 'satProductoServicio');      

      query.andWhere('productoServicio.id LIKE :id', { id: `${ id }`})

      const data = await query.getOne();

      if(!data){
        throw new NotFoundException(`El Producto ó Servicio con el ID: ${ id } no existe`);
      }

      return data;

    }catch(error){

      
      if( error instanceof NotFoundException ){
        throw error
      }
      
      if( error instanceof BadRequestException){
        throw error
      }

      throw new InternalServerErrorException('Ocurrió un error inespearado al obtener el Producto ó Servicio.')
    
    }finally{
      await queryRunner.release();
    }

  }

}
