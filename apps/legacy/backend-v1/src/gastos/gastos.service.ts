import { User } from './../auth/entities/user.entity';
import { BadRequestException, Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { EnumPrefijoEntity } from './../commom/enums/general.enum';
import { generarEntityId } from './../config/generarEntityId';
import { Gasto } from './entities/gasto.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { GastoCategoria } from './entities/gasto_categoria.entity';
import { CreateGastoMovimientoDto } from './dto/create-gasto-movimiento.dto';
import { GastoMovimiento } from './entities/gasto_movimiento.entity';
import { CreateGastoDto } from './dto/create-gasto.dto';
import { UpdateGastoMovimientoDto } from './dto/update-gasto-movimiento.dto';
import { UpdateGastoDto } from './dto/update-gasto-concepto.dto';
//import { UpdateGastoDto } from './dto/update-gasto.dto';

@Injectable()
export class GastosService {

  constructor(
    private dataSource: DataSource,
    @InjectRepository(GastoCategoria) private readonly gastoCategoriaRepository: Repository<GastoCategoria>,
    @InjectRepository(Gasto) private readonly gastoRepository: Repository<Gasto>,
  ){}

  async createGasto( createGastoDto: CreateGastoDto, user: User){       
    
      const schema = user.compania.schema;
  
      const queryRunner = this.dataSource.createQueryRunner();
  
      await queryRunner.connect();
  
      await queryRunner.startTransaction();
  
      try{
  
        await queryRunner.query(`SET search_path TO ${schema}, public`);
        
        const repoGastoCategoria = queryRunner.manager.getRepository(GastoCategoria);

        const gastoCategoria = await repoGastoCategoria.findOne({
          where: { id: createGastoDto.id_gasto_categoria },
        });

        if (!gastoCategoria) {
          throw new NotFoundException(
            `El gasto categoria con el ID: ${createGastoDto.id_gasto_categoria} no fue encontrado`
          );
        }

        const repoGasto = queryRunner.manager.getRepository(Gasto);
        
        const nuevoId = await generarEntityId( repoGasto, EnumPrefijoEntity.GASTOS );
  
        const gasto = repoGasto.create({
          id: nuevoId,
          nombre: createGastoDto.nombre,
          recurrente: createGastoDto.recurrente,
          gastoCategoria: gastoCategoria,
          activo: true,
          createdAtUser: user,
          updatedAtUser: user
        })
  
        const gastoBD = await repoGasto.save( gasto )

        await queryRunner.commitTransaction();
  
        return gastoBD
  
      }catch(error){
  
        await queryRunner.rollbackTransaction();
  
        if(error instanceof NotFoundException ){
          throw error
        }
  
        if(error instanceof BadRequestException){
          throw error
        }
  
        throw new InternalServerErrorException(`Ocurrió un error inesperado al intentar guardar el Gasto: ${error}`)
  
      }finally{
        await queryRunner.release();
      }
  
  }
  
  async createGastoMovimiento( createGastoMovimientoDto: CreateGastoMovimientoDto, user: User){
  
    const schema = user.compania.schema;

    const queryRunner = this.dataSource.createQueryRunner();

    await queryRunner.connect();

    await queryRunner.startTransaction();

    try{

      await queryRunner.query(`SET search_path TO ${schema}, public`);

      const repoGasto = queryRunner.manager.getRepository(Gasto);

      const gasto = await repoGasto.findOne({
        where: { id: createGastoMovimientoDto.id_gasto },
      });

      if (!gasto) {
        throw new NotFoundException(
          `El gasto con el ID: ${createGastoMovimientoDto.id_gasto.toUpperCase()} no fue encontrado`
        );
      }
      
      if( !gasto ){
        throw new BadRequestException(`El Movimiento necesita un Gasto válido`);
      }

      const repoGastoMovimiento = queryRunner.manager.getRepository(GastoMovimiento);
      
      const nuevoId = await generarEntityId( repoGastoMovimiento, EnumPrefijoEntity.GASTOSMOVIMIENTOS );

      const gastoMovimiento = repoGastoMovimiento.create({
        id: nuevoId,
        monto:          Number( createGastoMovimientoDto.monto ),
        fecha:          createGastoMovimientoDto.fecha,        
        tipoPago:       createGastoMovimientoDto.tipoPago,
        gasto:          gasto,
        referencia:     createGastoMovimientoDto.referencia,
        createdAtUser:  user,
        updatedAtUser:  user
      })

      const gastoBD = await repoGastoMovimiento.save( gastoMovimiento )

      await queryRunner.commitTransaction();

      return gastoBD

    }catch(error){

      await queryRunner.rollbackTransaction();

      if(error instanceof NotFoundException ){
        throw error
      }

      if(error instanceof BadRequestException){
        throw error
      }

      throw new InternalServerErrorException(`Ocurrió un error inesperado al intentar guardar el movimiento del Gasto: ${error}`)

    }finally{
      await queryRunner.release();
    }
  
  }

  async getPaginadoGastos( page: number = 1, limit: number, fSearch: string, user: User ) {
      
    const schema = user.compania.schema;

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect()

    try{

      await queryRunner.query(`SET search_path TO ${schema}, public`);

      const repoGasto = queryRunner.manager.getRepository(Gasto);

      const offset = (page - 1) * limit;

      const baseQuery = repoGasto.createQueryBuilder('gasto')
      .leftJoinAndSelect('gasto.gastoCategoria', 'gasto_categoria')

      if (fSearch?.trim()) {
        const search = `%${fSearch.trim().toLowerCase()}%`;
        baseQuery.where('unaccent(gasto.nombre) ILIKE :search', { search });
      }

      const [gastos, totalItems] = await baseQuery

        .addOrderBy('gasto.id', 'ASC')
        .skip(offset)
        .take(limit)
        .getManyAndCount();

      return {
        count: totalItems,
        pages: Math.ceil(totalItems / limit),
        gastos,
      };  

    }finally{
      await queryRunner.release();
    }
  }


  /*
        const fechaInicio = new Date(anio, mes - 1, 1);
      const fechaFin = new Date(anio, mes, 1);

      //'EXTRACT(YEAR FROM movimiento.fecha) = :anio AND EXTRACT(MONTH FROM movimiento.fecha) = :mes',
      //{ anio, mes }
      
      //'movimiento.fecha >= :fechaInicio AND movimiento.fecha < :fechaFin',
      //{ fechaInicio, fechaFin }
  */
  async getGastosConMovimientosPorMes(
    fSearch: string,
    user: User,
    anio: number,
    mes: number,
  ) {
    const schema = user.compania.schema;

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();

    try {
      await queryRunner.query(`SET search_path TO ${schema}, public`);

      const repoGasto = queryRunner.manager.getRepository(Gasto);      
       
      const fechaInicio = new Date( anio, mes - 1, 1);
      const fechaFin    = new Date(anio, mes, 1);
     
      const baseQuery = repoGasto
        .createQueryBuilder('gasto')
        .leftJoinAndSelect(
          'gasto.gastosMovimientos',
          'movimiento',
          'movimiento.fecha BETWEEN :fechaInicio AND :fechaFin',
          { fechaInicio, fechaFin }
        )
        .leftJoinAndSelect(
          'gasto.gastoCategoria',
          'gasto_categoria',
        );
     

      if (fSearch?.trim()) {
        const search = `%${fSearch.trim().toLowerCase()}%`;
        baseQuery.where('unaccent(gasto.nombre) ILIKE :search', { search });
      }

      const gastos = await baseQuery
        .addOrderBy('gasto.id', 'ASC')
        .addOrderBy('movimiento.fecha', 'ASC')
        .getMany();

      const totalGastadoMes = gastos.reduce((acc, gasto) => {
      const subtotal = gasto.gastosMovimientos?.reduce((sum, mov) => sum + Number(mov.monto), 0) || 0;
        return acc + subtotal;
      }, 0);

      return { totalGastadoMes, gastos };
      
    } finally {
      await queryRunner.release();
    }
  }  
  
  /*
  async getGastosConMovimientosPorMesOLD(
    fSearch: string,
    user: User,
    mes: number,
    anio: number
  ) {
    const schema = user.compania.schema;
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();

    try {
      await queryRunner.query(`SET search_path TO ${schema}, public`);

      const repoGasto = queryRunner.manager.getRepository(Gasto);

      // Calcular fechas de inicio y fin del mes
      const fechaInicio = new Date(anio, mes - 1, 1);
      const fechaFin = new Date(anio, mes, 0, 23, 59, 59);

      // PRIMERO: Obtener todos los gastos activos (sin paginación)
      const gastosQuery = repoGasto.createQueryBuilder('gasto')
        .where('gasto.activo = :activo', { activo: true });

      if (fSearch?.trim()) {
        const search = `%${fSearch.trim().toLowerCase()}%`;
        gastosQuery.andWhere('unaccent(gasto.nombre) ILIKE :search', { search });
      }

      const gastos = await gastosQuery
        .orderBy('gasto.nombre', 'ASC')
        .getMany();

      const gastosIds = gastos.map(c => c.id);

      if(gastosIds.length === 0) {
        return {
          count: 0,
          gastos: [],
        };
      }

      // SEGUNDO: Obtener el total de gastos (sin paginación)
      const totalItems = await gastosQuery.getCount();

      // TERCERO: Obtener los gastos completos con sus movimientos filtrados
      const gastosMovimientos = await repoGasto.createQueryBuilder('gasto')
        .leftJoinAndSelect('gasto.gastoCategoria', 'gasto_categoria')
        .leftJoinAndSelect(
          'gasto.gastosMovimientos',
          'gasto',
          'gasto.fecha BETWEEN :fechaInicio AND :fechaFin',
          { fechaInicio, fechaFin }
        )
        .where('gasto.id IN (:...ids)', { ids: gastosIds })
        .orderBy('gasto.nombre', 'ASC')
        .addOrderBy('gastoMovimiento.fecha', 'DESC')
        .addOrderBy('gastoMovimiento.createdAt', 'DESC')
        .getMany();

      // Calcular totales por gasto
      const gastosMovimientosConTotales = gastosMovimientos.map(movimiento => {
        const totalGastado = gastosmovimientosConTotales.gastos?.reduce(
          (sum, gasto) => sum + Number(gasto.monto),
          0
        ) || 0;

        return {
          ...concepto,
          totalGastado
        };
      });

      return {
        count: totalItems,
        gastosConceptos: gastosMovimientosConTotales,
      };

    } finally {
      await queryRunner.release();
    }
  }*/
  
  async getTotalesGastosUltimos6Meses(user: User) {
    const schema = user.compania.schema;
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();

    try {
      await queryRunner.query(`SET search_path TO ${schema}, public`);

      const repoGastoMovimiento = queryRunner.manager.getRepository(GastoMovimiento);

      // Fecha actual
      const hoy = new Date();
      // Fecha de inicio: hace 6 meses
      const fechaInicio = new Date(hoy.getFullYear(), hoy.getMonth() - 5, 1);
      const fechaFin = new Date(hoy.getFullYear(), hoy.getMonth() + 1, 0, 23, 59, 59);

      // Query agrupando por mes y año
      const resultados = await repoGastoMovimiento.createQueryBuilder('gastoMovimiento')
        .select([
          `EXTRACT(YEAR FROM gasto.fecha) AS anio`,
          `EXTRACT(MONTH FROM gasto.fecha) AS mes`,
          `SUM(gasto.monto) AS total`
        ])
        .where('gasto.fecha BETWEEN :fechaInicio AND :fechaFin', { fechaInicio, fechaFin })
        .groupBy('anio')
        .addGroupBy('mes')
        .orderBy('anio', 'ASC')
        .addOrderBy('mes', 'ASC')
        .getRawMany();

      // Normalizar salida: convertir a objetos con mes, año y total
      const totalesPorMes = resultados.map(r => ({
        anio: Number(r.anio),
        mes: Number(r.mes),
        total: Number(r.total)
      }));

      return totalesPorMes;

    } finally {
      await queryRunner.release();
    }
  }  

  
  async getPaginadoGastosMovimientos( page: number = 1, limit: number, fSearch: string, user: User ) {
      
      const schema = user.compania.schema;
  
      const queryRunner = this.dataSource.createQueryRunner();
      await queryRunner.connect()
  
      try{

        await queryRunner.query(`SET search_path TO ${schema}, public`);

        const repoGastoMovimiento = queryRunner.manager.getRepository(GastoMovimiento);

        const offset = (page - 1) * limit;

        const baseQuery = repoGastoMovimiento.createQueryBuilder('gastoMovimiento')

        //if (fSearch?.trim()) {
        //  const search = `%${fSearch.trim().toLowerCase()}%`;
        //  baseQuery.where('unaccent(gasto_mensual.descripcion) ILIKE :search', { search });
        //}

        const [gastosMovimientos, totalItems] = await baseQuery
          .addOrderBy('gasto.id', 'DESC')        
          .skip(offset)
          .take(limit)
          .getManyAndCount();

        return {
          count: totalItems,
          pages: Math.ceil(totalItems / limit),
          gastosMovimientos,
        };  
  
      }finally{
        await queryRunner.release();
      }
  }
  
  
  
  async getOneGasto( id: string, user: User){

    const schema = user.compania.schema;

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect()

    try{
      
      await queryRunner.query(`SET search_path TO ${schema}, public`);

      const repoGasto = queryRunner.manager.getRepository(Gasto);
    
      const query = repoGasto.createQueryBuilder('gasto')  
      .leftJoinAndSelect('gasto.gastoCategoria', 'gasto_categoria')

      query.andWhere('gasto.id LIKE :id', { id: `${ id }` })
              
      const data = await query.getOne()

      if(!data){
        throw new NotFoundException(`El gasto con el ID: ${ id.toUpperCase() } no fué encontrado`)
      }
      
      return data

    }finally{
      await queryRunner.release();
    }
    
  }
  
  async getOneGastoMovimiento( id: string, user: User){

    const schema = user.compania.schema;

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect()

    try{
      
      await queryRunner.query(`SET search_path TO ${schema}, public`);

      const repoGastoMovimiento = queryRunner.manager.getRepository(GastoMovimiento);
    
      const query = repoGastoMovimiento.createQueryBuilder('gastoMovimiento')  

      query.andWhere('gastoMovimiento.id LIKE :id', { id: `${ id }` })
              
      const data = await query.getOne()

      if(!data){
        throw new NotFoundException(`El movimiento del gasto con el ID: ${ id.toUpperCase() } no fué encontrado`)
      }
      
      return data

    }finally{
      await queryRunner.release();
    }
    
  }

  async updateGasto(id: string, updateGastoDto: UpdateGastoDto, user: User) {

    const schema = user.compania.schema;

    const queryRunner = this.dataSource.createQueryRunner()
    await queryRunner.connect();

    try{

      await queryRunner.query(`SET search_path TO ${schema}, public`);
      
      const gastoCategoria = await this.getGastoCategoriaById( updateGastoDto.id_gasto_categoria );

      if( !gastoCategoria){
        throw new BadRequestException(`El gasto necesita una categoría válida`)
      }

      const repoGasto = queryRunner.manager.getRepository(Gasto);

      const result = await repoGasto.update(
        { id: id },
        { 
          nombre: updateGastoDto.nombre,
          //monto: Number( updateGastoConceptoDto.monto ),
          recurrente: updateGastoDto.recurrente,
          activo: updateGastoDto.activo,
          gastoCategoria: gastoCategoria
        }
      );      

      if(result.affected === 0){
        throw new NotFoundException(`El gasto con el ID: ${ id.toUpperCase() } no fué encontrado`)
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
      
      throw new InternalServerErrorException('Ocurrió un error inesperado al actualizar el Gasto')

    }finally{
      await queryRunner.release();
    }
  }
  
  async updateGastoMovimiento(id: string, updateGastoMovimientoDto: UpdateGastoMovimientoDto, user: User) {

    const schema = user.compania.schema;

    const queryRunner = this.dataSource.createQueryRunner()
    await queryRunner.connect();

    try{

      await queryRunner.query(`SET search_path TO ${schema}, public`);

      const repoGasto = queryRunner.manager.getRepository(Gasto);

      const gasto = await repoGasto.findOne({
        where: { id: updateGastoMovimientoDto.id_gasto },
      });

      if (!gasto) {
        throw new NotFoundException(
          `El gasto con el ID: ${updateGastoMovimientoDto.id_gasto.toUpperCase()} no fue encontrado`
        );
      }      

      const repoGastoMovimiento = queryRunner.manager.getRepository(GastoMovimiento);

      const result = await repoGastoMovimiento.update(
        { id: id },
        { 
          fecha: updateGastoMovimientoDto.fecha,
          tipoPago: updateGastoMovimientoDto.tipoPago,
          referencia: updateGastoMovimientoDto.referencia,
          gasto: gasto,          
          monto: Number( updateGastoMovimientoDto.monto ),
        }
      );      

      if(result.affected === 0){
        throw new NotFoundException(`El Movimiento del Gasto con el ID: ${ id.toUpperCase() } no fué encontrado`)
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
      
      throw new InternalServerErrorException('Ocurrió un error inesperado al actualizar el Movimiento del Gasto')
    }finally{
      await queryRunner.release();
    }
  }
  

  
  async getGastoCategoriaById( id: number){    

    const gastoCategoria = await this.gastoCategoriaRepository.findOneBy({id: id})

    return gastoCategoria;

  }  

  async getPaginadoGastosCategorias( page: number, limit: number, fSearch: string, user: User){
  
      const schema = user.compania.schema;
  
      const queryRunner = this.dataSource.createQueryRunner();
  
      await queryRunner.connect();
  
      try{
  
        await queryRunner.query(`SET search_path TO ${schema}, public`);
        
        const repoGastoCategoria = queryRunner.manager.getRepository(GastoCategoria);        

        const query = repoGastoCategoria.createQueryBuilder('gastoCategoria');
  
        if(fSearch !== ''){
  
          const search = `%${fSearch.trim().toLowerCase()}%`
          
          query.andWhere(
            `(
              LOWER( gastoCategoria.nombre ) LIKE :search
              OR LOWER( gastoCategoria.descripcion ) LIKE :search
              )`,
              {
                search: search
              }
          )
  
        }
  
        query.orderBy(`gastoCategoria.id`, 'ASC');
  
        const offset = ( page - 1) * limit;
        query.skip(offset).take(limit);
  
        const [ data, totalItems ] = await query.getManyAndCount();      
  
        return {
          count: totalItems, 
          pages: Math.ceil(totalItems / limit),
          gastosCategorias: data
        }
  
      }catch(error){
      
        if( error instanceof BadRequestException){
          throw error
        }
  
        if(error instanceof NotFoundException){
          throw error
        }
        
        throw new InternalServerErrorException('Ocurrió un error inesperado al obtener el Catalogo de Categorias de Gastos')
  
      }finally{
        await queryRunner.release()
      }
  
  }  

}
