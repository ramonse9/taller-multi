import { EnumPrefijoEntity } from './../commom/enums/general.enum';
import { CreateSatProductoServicioDto } from './../productos-servicios/dto/create-sat-producto-servicio.dto';
import { CompaniaTipoGiro } from './../companias/entities/compania-tipo-giro.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { Injectable, BadRequestException, NotFoundException, InternalServerErrorException } from '@nestjs/common';
import { User } from './../auth/entities/user.entity';
import { Compania } from './../companias/entities/compania.entity';
import { generarEntityId } from './../config/generarEntityId';
import { SatRegimenFiscal } from './../sat/entities/sat-regimen-fiscal.entity';
import { SatPais } from './../sat/entities/sat-pais.entity';
import { SatImpuestoPorcentaje } from './../sat/entities/sat-impuesto-porcentaje.entity';
import { SatImpuesto } from './../sat/entities/sat-impuesto.entity';
import { SatFormaPago } from './../sat/entities/sat-forma-pago.entity';
import { SatMetodoPago } from './../sat/entities/sat-metodo-pago.entity';
import { SatTipoComprobante } from './../sat/entities/sat-tipo-comprobante.entity';
import { SatClaveUnidad } from './../sat/entities/sat-clave-unidad.entity';
import { SatTipoProductoServicio } from './../sat/entities/sat-tipo-producto-servicio.entity';
import { SatProductoServicio } from '../sat/entities/sat-producto-servicio.entity';
import { SatUsoCFDI } from './../sat/entities/sat-uso-cfdi.entity';
import { CreateSatDto } from './dto/create-sat.dto';
import { UpdateSatDto } from './dto/update-sat.dto';
import { SatCancelacionMotivo } from './entities/sat-cancelacion-motivo.entity';

@Injectable()
export class SatService {

  constructor(
    private readonly dataSource: DataSource,
    @InjectRepository(Compania) private readonly companiaRepository: Repository<Compania>,
    @InjectRepository(CompaniaTipoGiro) private readonly companiaTipoGiroRepository: Repository<CompaniaTipoGiro>,
    @InjectRepository(SatTipoProductoServicio) private readonly satTipoProductoServicioRepository:  Repository<SatTipoProductoServicio>,
    @InjectRepository(SatProductoServicio) private readonly satProductoServicioRepository: Repository<SatProductoServicio>,
    @InjectRepository(SatClaveUnidad) private readonly satClaveUnidadRepository:  Repository<SatClaveUnidad>,
    @InjectRepository(SatTipoComprobante) private readonly satTipoComprobanteRepository:  Repository<SatTipoComprobante>,
    @InjectRepository(SatMetodoPago) private readonly satMetodoPagoRepository:  Repository<SatMetodoPago>,
    @InjectRepository(SatFormaPago) private readonly satFormaPagoRepository:  Repository<SatFormaPago>,
    @InjectRepository(SatImpuesto) private readonly satImpuestoRepository:  Repository<SatImpuesto>,
    @InjectRepository(SatImpuestoPorcentaje) private readonly satImpuestoPorcentajeRepository:  Repository<SatImpuestoPorcentaje>,
    @InjectRepository(SatPais) private readonly satPaisRepository:  Repository<SatPais>,
    @InjectRepository(SatCancelacionMotivo) private readonly satCancelacionMotivoRepository: Repository<SatCancelacionMotivo>
  ){}

  

  async getSatProductoServicioById( id: string){    

    const satProductoServicio = await this.satProductoServicioRepository.findOneBy({id: id})

    return satProductoServicio;

  }

  async createSatProductoServicio( createSatProductoServicioDto: CreateSatProductoServicioDto, user: User){

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect()

    try{

      const { tipo_compania_tipo_giro, tipo_sat_tipo_producto_servicio, clave_sat_clave_unidad, ...nuevoCreateSatProductoServicioDto } = createSatProductoServicioDto;

      const companiaTipoGiro = await this.companiaTipoGiroRepository.findOneBy({tipo: tipo_compania_tipo_giro})

      if(!companiaTipoGiro){
        throw new NotFoundException(`No es posible guardar este producto ó servicio en el Catálogo, por que el tipo giro con el Id: ${ tipo_compania_tipo_giro } no existe`)
      }

      const satTipoProductoServicio = await this.satTipoProductoServicioRepository.findOneBy({tipo: tipo_sat_tipo_producto_servicio})

      if(!satTipoProductoServicio){
        throw new NotFoundException(`No es posible guardar este producto ó servicio en el Catálogo, por que el tipo con el Id: ${ tipo_sat_tipo_producto_servicio } no existe`)
      }

      const satClaveUnidad = await this.satClaveUnidadRepository.findOneBy({clave: clave_sat_clave_unidad})

      if(!satClaveUnidad){
        throw new NotFoundException(`No es posible guardar este producto ó servicio en el Catálogo, por que la unidad con el Id: ${ clave_sat_clave_unidad } no existe`)
      }

      const repoSatProductoServicio = queryRunner.manager.getRepository( SatProductoServicio );
                
      const nuevoId = await generarEntityId( repoSatProductoServicio, EnumPrefijoEntity.SATPRODUCTOSSERVICIOS);

      const nuevoProductoServicio = repoSatProductoServicio.create({
        id: nuevoId,
        ...CreateSatProductoServicioDto,
        companiaTipoGiro,
        satTipoProductoServicio,
        satClaveUnidad
      })      

      return await repoSatProductoServicio.save( nuevoProductoServicio )
    
    }catch(error){

      if( error instanceof NotFoundException ){
        throw error
      }

      if( error instanceof BadRequestException){
        throw error
      }
      
      throw new InternalServerErrorException('Ocurrió un error inesperado al crear el Catalogo Producto ó Servicio')
    }finally{
      await queryRunner.release()
    }

  } 
  
  async getPaginadoSatProductosServicios( page: number, limit: number, fSearch: string, tipo: string, user: User){

    const schema = user.compania.schema;

    const queryRunner = this.dataSource.createQueryRunner();

    await queryRunner.connect();

    try{

      await queryRunner.query(`SET search_path TO ${schema}, public`);
      
      const repoSatProductoServicio = queryRunner.manager.getRepository(SatProductoServicio);      

      const compania = await this.companiaRepository.findOne({
        where: {
          id: user.compania.id
        },
        relations: ['companiaTipoGiro']
      })

      const query = repoSatProductoServicio.createQueryBuilder('satProductosServicios');
      query.leftJoinAndSelect('satProductosServicios.companiaTipoGiro', 'companiaTipoGiro');
      query.leftJoinAndSelect('satProductosServicios.satTipoProductoServicio', 'satTipoProductoServicio');
      query.leftJoinAndSelect('satProductosServicios.satClaveUnidad', "satClaveUnidad");
      query.leftJoinAndSelect('satProductosServicios.satObjetoImpuesto', "satObjetoImpuesto");

      query.where('companiaTipoGiro.tipo = :tipoGiro', { tipoGiro: compania.companiaTipoGiro.tipo });
      
      if(fSearch !== ''){

        const search = `%${fSearch.trim().toLowerCase()}%`
        
        query.andWhere(
          `(
            LOWER( satProductosServicios.descripcion ) LIKE :search
            OR LOWER( satProductosServicios.clave ) LIKE :search
            OR LOWER( satProductosServicios.palabras_similares ) LIKE :search
            )`,
            {
              search: search
            }
        )

      }

      if (tipo) {
        query.andWhere('satTipoProductoServicio.tipo = :tipo', { tipo });
      }

      query.orderBy(`satProductosServicios.id`, 'ASC');

      const offset = ( page - 1) * limit;
      query.skip(offset).take(limit);

      const [ data, totalItems ] = await query.getManyAndCount();      

      return {
        count: totalItems, 
        pages: Math.ceil(totalItems / limit),
        satProductosServicios: data
      }

    }catch(error){
    
      if( error instanceof BadRequestException){
        throw error
      }

      if(error instanceof NotFoundException){
        throw error
      }
      
      throw new InternalServerErrorException('Ocurrió un error inesperado al obtener el Catalogo de Productos y Servicios')

    }finally{
      await queryRunner.release()
    }

  }

  async getPaginadoSatRegimenesFiscalesByTipoPersona( page: number, limit: number = 20, fSearch: string, tipoPersona: string, user: User){

    const schema = user.compania.schema;

    const queryRunner = this.dataSource.createQueryRunner();

    await queryRunner.connect();

    try{

      await queryRunner.query(`SET search_path TO ${schema}, public`);

      const repoSatRegimenFiscal = queryRunner.manager.getRepository(SatRegimenFiscal);

      /*const compania = await this.companiaRepository.findOne({
        where: {
          id: user.compania.id
        },
        relations: ['satTipoPersona']
      })*/

      const query = repoSatRegimenFiscal.createQueryBuilder('satRegimenesFiscales');

      if( tipoPersona === 'fisica' ){
        query.where('satRegimenesFiscales.fisica = :aplica', { aplica: true })
      }else if( tipoPersona === 'moral' ){
        query.where('satRegimenesFiscales.moral = :aplica', { aplica: true })
      }

      query.orderBy(`satRegimenesFiscales.clave`, 'ASC');

      //const offset = ( page - 1 ) * limit;
      //query.skip(offset).take(limit);

      const [ data, totalItems ] = await query.getManyAndCount();

      return {
        count: totalItems, 
        pages: 1,
        satRegimenesFiscales: data
      }

    }catch(error){
    
      if( error instanceof BadRequestException){
        throw error
      }

      if(error instanceof NotFoundException){
        throw error
      }
      
      throw new InternalServerErrorException('Ocurrió un error inesperado al obtener el Catalogo de Regimenes Fiscales por Tipo Persona')

    }finally{
      await queryRunner.release()
    }

  }

  async getPaginadoSatUsoCfdiByTipoPersonaRegimenFiscal( page: number, limit: number = 20, fSearch: string, claveSatRegimenFiscal: string, user: User){

    const schema = user.compania.schema;

    const queryRunner = this.dataSource.createQueryRunner();

    await queryRunner.connect();

    try{

      await queryRunner.query(`SET search_path TO ${schema}, public`);

      const repoSatUsoCFDI = queryRunner.manager.getRepository(SatUsoCFDI);
      
      const compania = await this.companiaRepository.findOne({
        where: {
          id: user.compania.id
        },
        relations: ['satTipoPersona']
      })

      const query = repoSatUsoCFDI.createQueryBuilder('satUsoCFDI');      
      
      query.innerJoin('satUsoCFDI.regimenes', 'ur')      
      query.innerJoin('ur.regimenFiscal', 'regimen')
      query.andWhere('regimen.clave = :clave', {clave: claveSatRegimenFiscal})

      if( compania.satTipoPersona.tipo === 'fisica' ){
        query.andWhere('satUsoCFDI.fisica = :aplica', { aplica: true })
      }else if( compania.satTipoPersona.tipo === 'moral' ){
        query.andWhere('satUsoCFDI.moral = :aplica', { aplica: true })
      }
      
      const offset = ( page - 1 ) * limit;
      query.skip(offset).take(limit);

      const [ data, totalItems ] = await query.getManyAndCount();

      return {
        count: totalItems, 
        pages: 1,
        satUsoCFDI: data
      }

    }catch(error){
    
      if( error instanceof BadRequestException){
        throw error
      }

      if(error instanceof NotFoundException){
        throw error
      }
      
      throw new InternalServerErrorException('Ocurrió un error inesperado al obtener el Catalogo de Uso CFDI por Tipo Persona y Regimen Fiscal')

    }finally{
      await queryRunner.release()
    }

  }  

  async getPaginadoSatTipoComprobante( page: number, limit: number, fSearch: string, user: User){    

    try{

      const [ data, totalItems ] = await this.satTipoComprobanteRepository.findAndCount()

      return {
        count: totalItems, 
        pages: 1,
        satTiposComprobantes: data
      }

    }catch(error){
    
      if( error instanceof BadRequestException){
        throw error
      }

      if(error instanceof NotFoundException){
        throw error
      }      
      
      throw new InternalServerErrorException('Ocurrió un error inesperado al obtener el Catalogo de Tipos De Comprobantes')

    }

  }  

  async getPaginadoSatMetodoPago( page: number, limit: number, fSearch: string, user: User){    

    try{

     const [ data, totalItems ] = await this.satMetodoPagoRepository.findAndCount()

    return {
      count: totalItems, 
      pages: 1,
      satMetodosPagos: data
    }

    }catch(error){
    
      if( error instanceof BadRequestException){
        throw error
      }

      if(error instanceof NotFoundException){
        throw error
      }      
      
      throw new InternalServerErrorException('Ocurrió un error inesperado al obtener el Catalogo de Metodos Pagos')

    }

  }  

  async getPaginadoSatFormaPago( page: number, limit: number, fSearch: string, user: User){    

    try{

     const [ data, totalItems ] = await this.satFormaPagoRepository.findAndCount()

    return {
      count: totalItems, 
      pages: 1,
      satFormasPagos: data
    }

    }catch(error){
    
      if( error instanceof BadRequestException){
        throw error
      }

      if(error instanceof NotFoundException){
        throw error
      }      
      
      throw new InternalServerErrorException('Ocurrió un error inesperado al obtener el Catalogo de Formas Pagos')

    }

  }

  async getPaginadoSatImpuesto( page: number, limit: number, fSearch: string, user: User){    

    try{

     const [ data, totalItems ] = await this.satImpuestoRepository.findAndCount()

    return {
      count: totalItems, 
      pages: 1,
      satImpuestos: data
    }

    }catch(error){
    
      if( error instanceof BadRequestException){
        throw error
      }

      if(error instanceof NotFoundException){
        throw error
      }
      
      throw new InternalServerErrorException('Ocurrió un error inesperado al obtener el Catalogo de Impuestos')

    }

  }
  
  async getPaginadoSatImpuestoPorcentaje( page: number, limit: number, fSearch: string, user: User){

    try{

     const [ data, totalItems ] = await this.satImpuestoPorcentajeRepository.findAndCount()

    return {
      count: totalItems, 
      pages: 1,
      satImpuestosPorcentajes: data
    }

    }catch(error){
    
      if( error instanceof BadRequestException){
        throw error
      }

      if(error instanceof NotFoundException){
        throw error
      }
      
      throw new InternalServerErrorException('Ocurrió un error inesperado al obtener el Catalogo de Impuestos y Porcentajes')

    }

  }

  async getPaginadoSatPais( page: number, limit: number, fSearch: string, user: User){

    try{

     const [ data, totalItems ] = await this.satPaisRepository.findAndCount()

    return {
      count: totalItems, 
      pages: 1,
      satPaises: data
    }

    }catch(error){
    
      if( error instanceof BadRequestException){
        throw error
      }

      if(error instanceof NotFoundException){
        throw error
      }      
      
      throw new InternalServerErrorException('Ocurrió un error inesperado al obtener el Catalogo de Países')

    }

  }

  async getPaginadoSatCancelacionMotivo(page: number, limit: number, fSearch: string, user: User){
    try{

      const [data, totalItems ] = await this.satCancelacionMotivoRepository.findAndCount({
        order: {
          clave: 'ASC'          
        }
      });

      return {
        count: totalItems, 
        pages: 1,
        satCancelacionesMotivos: data
      }

    }catch(error){
      
      if( error instanceof BadRequestException){
        throw error
      }

      if(error instanceof NotFoundException){
        throw error
      }
      
      throw new InternalServerErrorException('Ocurrió un error inesperado al obtener el Catalogo de Motivos Cancelación')

    }

  }

  create(createSatDto: CreateSatDto) {
    return 'This action adds a new sat';
  }

  findAll() {
    return `This action returns all sat`;
  }

  findOne(id: number) {
    return `This action returns a #${id} sat`;
  }

  update(id: number, updateSatDto: UpdateSatDto) {
    return `This action updates a #${id} sat`;
  }

  remove(id: number) {
    return `This action removes a #${id} sat`;
  }
}
