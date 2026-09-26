import { ProductoServicio } from './../productos-servicios/entities/producto-servicio.entity';
import { CotizacionConcepto } from './entities/cotizacion_concepto.entity';
import { EnumPrefijoEntity } from './../commom/enums/general.enum';
import { generarEntityId } from './../config/generarEntityId';
import { Cotizacion } from './entities/cotizacion.entity';
import { Empresa } from './../empresas/entities/empresa.entity';
import { Cliente } from './../clientes/entities/cliente.entity';
import { Vehiculo } from './../vehiculos/entities/vehiculo.entity';
import { User } from './../auth/entities/user.entity';
import { BadRequestException, Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { CreateCotizacionDto } from './dto/create-cotizacion.dto';
import { UpdateCotizacionDto } from './dto/update-cotizacion.dto';
import { DataSource, In } from 'typeorm';
import { Modelo } from '../modelos/entities/modelo.entity';
import { CreateCotizacionConceptoDto } from './dto/create-cotizacion-concepto.dto';
import { Orden } from '../ordenes/entities/orden.entity';

@Injectable()
export class CotizacionesService {

  constructor( private dataSource: DataSource){}
  
  async create(createCotizacionDto: CreateCotizacionDto, user: User) {

    const schema = user.compania.schema;

    const queryRunner = this.dataSource.createQueryRunner();

    await queryRunner.connect()

    await queryRunner.startTransaction();

    try{

      await queryRunner.query(`SET search_path TO ${schema}, public`);

      
      let vehiculo = null;
      
      if( createCotizacionDto.id_vehiculo ){
        const repoVehiculo = queryRunner.manager.getRepository(Vehiculo);
        vehiculo = await repoVehiculo.findOneBy({id:createCotizacionDto.id_vehiculo.toLowerCase()});

        if(!vehiculo){
          throw new NotFoundException(`El vehículo con el ID: ${createCotizacionDto.id_vehiculo} no existe`)
        }
        
      }

      let modelo = null;
      
      if( createCotizacionDto.id_modelo ){
        const repoModelo = queryRunner.manager.getRepository(Modelo);
        modelo = await repoModelo.findOneBy({id:createCotizacionDto.id_modelo.toLowerCase()});

        if(!modelo){
          throw new NotFoundException(`El modelo con el ID: ${createCotizacionDto.id_modelo} no existe`)
        }
        
      }

      if( !vehiculo && !modelo){
        throw new NotFoundException(`Debes indicar un vehículo o un modelo de vehiculo para la cotizacion`)
      }

      if( vehiculo && modelo){
        throw new NotFoundException(`Debes indicar un vehículo o un modelo de vehiculo para la cotizacion`)
      }

      if( modelo && !createCotizacionDto.anio){
        throw new NotFoundException(`Debes indicar el año del modelo de vehiculo para la cotizacion`)
      }

      let cliente = null      

      if( createCotizacionDto.id_cliente ) {
        
        const repoCliente = queryRunner.manager.getRepository(Cliente);
        cliente = await repoCliente.findOneBy({id: createCotizacionDto.id_cliente.toLowerCase()})        
  
        if(!cliente){
          throw new NotFoundException(`El cliente con el ID: ${createCotizacionDto.id_cliente} no existe`)
        }
      }

      let empresa = null      

      if( createCotizacionDto.id_empresa){
        
        const repoEmpresa = queryRunner.manager.getRepository(Empresa)
        empresa = await repoEmpresa.findOneBy({id: createCotizacionDto.id_empresa.toLowerCase()})
  
        if(!empresa){
          throw new NotFoundException(`La empresa con el ID: ${createCotizacionDto.id_empresa} no existe`)
        }

      }      

      if( !cliente && !empresa){
        throw new NotFoundException(`Debes indicar un cliente o una empresa para la cotizacion`)
      }

      const repoCotizacion = queryRunner.manager.getRepository(Cotizacion);

      const nuevoId = await generarEntityId( repoCotizacion, EnumPrefijoEntity.COTIZACIONES )

      //TODO-
      const nuevaCotizacion = repoCotizacion.create({
        id: nuevoId,
        descripcion: createCotizacionDto.descripcion,
        cliente: cliente,
        empresa: empresa,
        vehiculo: vehiculo,
        modelo: modelo,
        anio: createCotizacionDto.anio,
        //conceptos: conceptos,
        createdAtUser: user,
        updatedAtUser: user
      });
      
      const cotizacionGuardada = await repoCotizacion.save( nuevaCotizacion )

      /* CONCEPTOS  */
      const repoCotizacionConcepto = queryRunner.manager.getRepository(CotizacionConcepto);
      const repoProductoServicio = queryRunner.manager.getRepository(ProductoServicio);

      if( createCotizacionDto.conceptos && createCotizacionDto.conceptos.length > 0){

        const cotizacionConceptos = [];

        const ids = createCotizacionDto.conceptos.map( c => c.id_producto_servicio);
        const idsUnicos = Array.from( new Set(ids));

        const productosServicios = await repoProductoServicio.findBy({
          id: In(idsUnicos)
        });

        const productoServicioMap = new Map<string, ProductoServicio>();
        productosServicios.forEach( p => productoServicioMap.set(p.id, p))

        const conceptosConProductoServicio = createCotizacionDto.conceptos.map( dto => {
          const productoServicio = productoServicioMap.get( dto.id_producto_servicio)
          if( !productoServicio ){
            throw new BadRequestException(`No se encontró el producto ó servicio con el ID ${ dto.id_producto_servicio }`);
          }
          
          return {
            ...dto,
            cotizacion: cotizacionGuardada,
            valorUnitario: Number( dto.valorUnitario ),
            productoServicio: productoServicio
          }

        })

        await repoCotizacionConcepto.save( conceptosConProductoServicio )

      }      

      await queryRunner.commitTransaction()

      return {
        id: cotizacionGuardada.id
      }

    }catch(error){      

      await queryRunner.rollbackTransaction();

      if( error instanceof NotFoundException ){
        throw error
      }

      if( error instanceof BadRequestException){
        throw error
      }      
      
      throw new InternalServerErrorException(`Ocurrió un error inesperado al intentar crear la Cotizacion: ${error}`)
    }finally{
      await queryRunner.release();
    }
  }

  async getPaginado(page: number = 1, limit: number, fSearch: string, user: User ) {
      
      const schema = user.compania.schema;
  
      const queryRunner = this.dataSource.createQueryRunner();
      await queryRunner.connect()
  
      try{
  
        await queryRunner.query(`SET search_path TO ${schema}, public`);
  
        const repoCotizacion = queryRunner.manager.getRepository(Cotizacion);
        
        const baseQuery = repoCotizacion.createQueryBuilder('cotizacion')
          .select('cotizacion.id')
          .leftJoin('cotizacion.cliente', 'cliente')
          .leftJoin('cotizacion.empresa', 'empresa')
          .leftJoin('cotizacion.vehiculo', 'vehiculo')
          .leftJoin('vehiculo.modelo', 'modelo')
          .leftJoin('modelo.marca', 'marca')
          .leftJoin('cotizacion.modelo', 'modelo2')
          .leftJoin('modelo2.marca', 'marca2')

          .leftJoin('cotizacion.conceptos', 'conceptos')
          
        if (fSearch !== '') {
          const search = `%${fSearch.trim().toLowerCase()}%`;
  
          baseQuery.where(`(
            vehiculo.id::text LIKE :search OR
            modelo.nombre ILIKE :search OR
            marca.nombre ILIKE :search OR
            vehiculo.anio::text LIKE :search OR
            COALESCE(vehiculo.color, '') ILIKE :search OR
            COALESCE(vehiculo.placa, '') ILIKE :search OR
            vehiculo.numeroSerie ILIKE :search OR
            cliente.id::text LIKE :search OR
            unaccent(cliente.nombre) ILIKE :search OR
            cliente.telefono ILIKE :search OR
            cliente.email ILIKE :search OR
          )`, {
            search: search,          
          });
        }
  
        const offset = ( page -1 ) * limit;
        
        const [idsResults, totalItems] = await baseQuery
          .orderBy('cotizacion.id', 'DESC')
          .skip(offset)
          .take(limit)
          .getManyAndCount();
  
        if( totalItems === 0){
          return { count: 0, pages: 0, cotizaciones: [] }
        }
  
        const ids = idsResults.map( o => o.id )
  
          /*.leftJoin('productoServicio.satProductoServicio', 'satProductoServicio')        
          .leftJoin('satProductoServicio.satTipoProductoServicio', 'satTipoProductoServicio')
          .addSelect(['satTipoProductoServicio.tipo'])*/
        
        const cotizaciones = await repoCotizacion.createQueryBuilder('cotizacion')
          .leftJoinAndSelect('cotizacion.cliente', 'cliente')
          .leftJoinAndSelect('cotizacion.empresa', 'empresa')
          .leftJoinAndSelect('cotizacion.vehiculo', 'vehiculo')
          .leftJoinAndSelect('vehiculo.modelo', 'modelo')
          .leftJoinAndSelect('modelo.marca', 'marca')
          .leftJoinAndSelect('cotizacion.modelo', 'modelo2')
          .leftJoinAndSelect('modelo2.marca', 'marca2')

          .leftJoinAndSelect('cotizacion.conceptos', 'conceptos')
          .leftJoinAndSelect('conceptos.productoServicio', 'productoServicio')
          .leftJoinAndSelect('productoServicio.satProductoServicio', 'satProductoServicio')
          .leftJoinAndSelect('satProductoServicio.satTipoProductoServicio', 'satTipoProductoServicio')

          .leftJoin('cotizacion.orden', 'orden')
          .addSelect(['orden.id', 'orden.estatus'])
          
          .where('cotizacion.id IN (:...ids)', { ids })
          .orderBy('cotizacion.id', 'DESC')
          .getMany()
        
        return {
          count: totalItems,
          pages: Math.ceil( totalItems / limit ),
          cotizaciones: cotizaciones
        }
  
      }finally{
        await queryRunner.release();
      }
  }

  async getOne( id: string, user: User){
  
      const schema = user.compania.schema;
  
      const queryRunner = this.dataSource.createQueryRunner();
      await queryRunner.connect()
  
      try{
        
        await queryRunner.query(`SET search_path TO ${schema}, public`);
  
        const repoCotizacion = queryRunner.manager.getRepository(Cotizacion);
      
        const query = repoCotizacion.createQueryBuilder('cotizacion')
        
        query.leftJoinAndSelect('cotizacion.cliente', 'cliente')
        query.leftJoinAndSelect('cotizacion.empresa', 'empresa')
        query.leftJoinAndSelect('cotizacion.vehiculo', 'vehiculo')
        query.leftJoinAndSelect('vehiculo.modelo', 'modelo')
        query.leftJoinAndSelect('modelo.marca', 'marca')
        query.leftJoinAndSelect('cotizacion.modelo', 'modelo2')
        query.leftJoinAndSelect('modelo2.marca', 'marca2')
        
        query.leftJoinAndSelect('cotizacion.conceptos', 'conceptos')
        query.leftJoin('conceptos.productoServicio', 'productoServicio')
        query.addSelect(['productoServicio.id','productoServicio.descripcion'])
  
        query.leftJoin('productoServicio.satProductoServicio', 'satProductoServicio')
        query.addSelect(['satProductoServicio.descripcion'])
        query.leftJoin('satProductoServicio.satTipoProductoServicio', 'satTipoProductoServicio')
        query.addSelect(['satTipoProductoServicio.tipo'])

        
        .leftJoin('cotizacion.orden', 'orden')
        .addSelect(['orden.id', 'orden.estatus'])
    
        query.andWhere('cotizacion.id LIKE :id', { id: `${ id }` })
        
        const data = await query.getOne()
  
        if(!data){
          throw new NotFoundException(`La cotizacion con el ID: ${ id.toUpperCase() } no fué encontrada`)
        }
        
        return data
  
      }finally{
        await queryRunner.release();
      }
      
  }

  async update(id: string, updateCotizacionDto: UpdateCotizacionDto, user: User) {
  
    const schema = user.compania.schema;

    const queryRunner = this.dataSource.createQueryRunner()
    await queryRunner.connect();

    try{

      await queryRunner.query(`SET search_path TO ${schema}, public`);

      const repoCotizacion = queryRunner.manager.getRepository(Cotizacion);           

      let orden = null      

      if( updateCotizacionDto.id_orden){
        
        const repoOrden = queryRunner.manager.getRepository(Orden)
        orden = await repoOrden.findOneBy({id: updateCotizacionDto.id_orden.toLowerCase()})
  
        if(!orden){
          throw new NotFoundException(`La orden con el ID: ${updateCotizacionDto.id_orden} no existe`)
        }

      }

      const result = await repoCotizacion.update(
        { id: id },
        { 
          descripcion: updateCotizacionDto.descripcion,
          orden: orden,
          updatedAtUser: user,

        }
      );      

      if(result.affected === 0){
        throw new NotFoundException(`La cotizacion con el ID: ${ id.toUpperCase() } no fué encontrada`)
      }

      return {
        id: id
      }

    }catch(error){    
      
      if( error instanceof NotFoundException ){
        throw error
      }
    
      if( error instanceof BadRequestException){
        throw error
      }
      
      throw new InternalServerErrorException('Ocurrió un error inesperado al actualizar la Cotizacion')
    }finally{
      await queryRunner.release();
    }
  }

  async updateConceptos(id: string, conceptosDto: CreateCotizacionConceptoDto[], user: User) {
  
    const schema = user.compania.schema;

    const queryRunner = this.dataSource.createQueryRunner()
    await queryRunner.connect();
    await queryRunner.startTransaction()

    try{

      await queryRunner.query(`SET search_path TO ${schema}, public`);

      const repoCotizacion = queryRunner.manager.getRepository(Cotizacion);

      const cotizacion = await repoCotizacion.findOne({
        where: {id: id},
        relations: ['conceptos']
      })

      if(!cotizacion){
        throw new NotFoundException(`La cotizacion con el ID: ${ id.toUpperCase() } no fué encontrada`)
      }

      if( !conceptosDto.length ){
        throw new NotFoundException(`Debes agregar al menos un concepto`)
      }

      const idsProductos = [
        ...new Set( conceptosDto.map( c => c.id_producto_servicio))
      ];

      const productosServicios = await queryRunner.manager.find(
        ProductoServicio,
        {
          where: { id: In(idsProductos) }
        }
      );

      const productosServiciosMap = new Map<string, ProductoServicio>();
      productosServicios.forEach( p => productosServiciosMap.set(p.id, p));

      const nuevosConceptos = conceptosDto.map( dto => {
        const productoServicio = productosServiciosMap.get( dto.id_producto_servicio )
        if( !productoServicio ){
          throw new BadRequestException(`No se encontró el producto ó servicio con el ID ${ dto.id_producto_servicio }`)
        }

        return {          
          cotizacion: { id } as Cotizacion,
          cantidad: dto.cantidad,
          productoServicio: productoServicio,
          valorUnitario: Number( dto.valorUnitario )
        }

      })            

      await queryRunner.manager.delete( CotizacionConcepto, { cotizacion: { id: id}} );

      await queryRunner.manager.insert( CotizacionConcepto, nuevosConceptos );      

      await queryRunner.commitTransaction()

      return {
        id: id
      }   

    }catch(error){

      await queryRunner.rollbackTransaction()
      
      if( error instanceof NotFoundException ){
        throw error
      }
    
      if( error instanceof BadRequestException){
        throw error
      }
      
      throw new InternalServerErrorException('Ocurrió un error inesperado al actualizar los conceptos de la Cotizacion')
    }finally{
      await queryRunner.release();
    }
  }
}
