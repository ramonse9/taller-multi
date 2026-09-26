import { EnumPrefijoEntity } from './../commom/enums/general.enum';
import { BadRequestException, Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { CreateClienteDto } from './dto/create-cliente.dto';
import { UpdateClienteDto } from './dto/update-cliente.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Cliente } from './entities/cliente.entity';
import { DataSource, Repository} from 'typeorm';
import { User } from '../auth/entities/user.entity';
import { generarEntityId } from '../config/generarEntityId';
import { SatUsoCFDI } from './../sat/entities/sat-uso-cfdi.entity';
import { SatRegimenFiscal } from '../sat/entities/sat-regimen-fiscal.entity';


@Injectable()
export class ClientesService {

  constructor(
    //@InjectRepository(Cliente) private readonly clienteRepository: Repository<Cliente>,
    @InjectRepository(SatRegimenFiscal) private readonly satRegimenFiscalRepository: Repository<SatRegimenFiscal>,
    @InjectRepository(SatUsoCFDI) private readonly satUsoCFDIRepository: Repository<SatUsoCFDI>,
    private readonly dataSource: DataSource
  ){
  }

  async create(createClienteDto: CreateClienteDto, user: User) {    
        
    const schema = user.compania.schema;
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect()

    try{      
      
      await queryRunner.query(`SET search_path TO ${schema}, public`);

      let satRegimenFiscal: SatRegimenFiscal | null = null
      let satUsoCFDI: SatUsoCFDI | null = null

      if( createClienteDto.claveSatRegimenFiscal ){
        
        satRegimenFiscal = await this.satRegimenFiscalRepository.findOne({
          where: { 
            clave: createClienteDto.claveSatRegimenFiscal,
            fisica: true
          }
        })
  
        if( !satRegimenFiscal ){
          throw new NotFoundException('Regimen Fiscal no encontrado')
        }

        if( createClienteDto.claveSatUsoCFDI ){
          
          satUsoCFDI = await this.satUsoCFDIRepository.findOne({
            where: {
              clave: createClienteDto.claveSatUsoCFDI,
              fisica: true
            }
          })
    
          if( !satUsoCFDI ){
            throw new NotFoundException('Uso CFDI no encontrado')
          }

        }

      }


      const repoCliente = queryRunner.manager.getRepository( Cliente );
      
      const nuevoId = await generarEntityId(repoCliente, EnumPrefijoEntity.CLIENTES);

      const nuevoCliente = repoCliente.create({
        id: nuevoId,
        ...createClienteDto,
        satRegimenFiscal: satRegimenFiscal,
        satUsoCFDI: satUsoCFDI,
        createdAtUser: user,
        updatedAtUser: user        
      })   
      
      await repoCliente.save( nuevoCliente )   

      const clienteGuardado = await repoCliente.findOne({
        where: { id: nuevoId},
        relations: ['satRegimenFiscal','satUsoCFDI']
      })

      return clienteGuardado;
      
    }catch(error){      

      if( error instanceof NotFoundException ){
        throw error
      }
    
      if( error instanceof BadRequestException){
        throw error
      }
       
      throw new InternalServerErrorException('Ocurrió un error inesperado al crear el Cliente')
    }finally{
      await queryRunner.release()
    }

  }  

  async getPaginado( page: number, limit: number, fSearch: string, user: User ) {    
    
    const schema = user.compania.schema;

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect()

    try{

      await queryRunner.query(`SET search_path TO ${schema}, public`);

      const repoCliente = queryRunner.manager.getRepository(Cliente)

      const query = repoCliente.createQueryBuilder('cliente');
      query.leftJoin('cliente.createdAtUser', 'createdAtUser');
      query.leftJoin('cliente.updatedAtUser', 'updatedAtUser');
      query.leftJoinAndSelect('cliente.satRegimenFiscal', 'satRegimenFiscal')
      query.leftJoinAndSelect('cliente.satUsoCFDI', 'usoCfdi')
      query.addSelect(['createdAtUser.id', 'createdAtUser.email', 'createdAtUser.full_name']);
      query.addSelect(['updatedAtUser.id', 'updatedAtUser.email', 'updatedAtUser.full_name']);

      if(fSearch !== ''){

        const search = `%${fSearch.trim().toLowerCase()}%`

        query.andWhere(
          `(
          cliente.id ILIKE :search OR
          unaccent(cliente.nombre) ILIKE :search OR
          cliente.telefono ILIKE :search OR
          cliente.email ILIKE :search OR
          cliente.rfc ILIKE :search OR
          cliente.razon_social ILIKE :search
          )`,
          {
            search: search
          }
        )
      }

      query.orderBy(`cliente.id`, 'DESC');

      const offset = (page - 1) * limit;

      query.skip(offset).take(limit);

      const [ data, totalItems ] = await query.getManyAndCount()
      
      return {
        count: totalItems,
        pages: Math.ceil(totalItems / limit),
        clientes: data, 
      }

    }finally{
      await queryRunner.release()      
    }
  }

  async findCliente( pagina: number, recordsPorPagina: number,
        fCliente: string,
        sortBy: string, order: 'ASC' | 'DESC' = 'DESC',
        user: User
   ){
    
    const schema = user.compania.schema;
    const queryRunner = this.dataSource.createQueryRunner()
    await queryRunner.connect();    

    try{

      await queryRunner.query(`SET search_path TO ${schema}, public`);

      const skip = (pagina - 1) * recordsPorPagina
      
      const query = queryRunner.manager.getRepository(Cliente).createQueryBuilder()

      if(fCliente){

        query.where(
            `(cliente.id ILIKE :id OR
              cliente.nombre ILIKE :nombre OR 
              cliente.telefono ILIKE :telefono OR 
              cliente.email ILIKE :email)`,
              {
                id: `%${fCliente}%`,
                nombre: `%${fCliente}%`,                
                telefono: `%${fCliente}%`,
                email: `%${fCliente}%`,              
              })
      }

      query.orderBy(`cliente.${sortBy}`, order);
      query.skip(skip).take(recordsPorPagina);

      const [data, totalItems] = await query.getManyAndCount()

      return {
        data,
        totalItems
      }
    }finally{

      await queryRunner.release()
      
    }    

  }

  async getOne(id: string, user: User) {
    
    const schema = user.compania.schema;

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect()

    try{

      await queryRunner.query(`SET search_path TO ${schema}, public`);

      const repoCliente =  queryRunner.manager.getRepository(Cliente)
      const cliente = await repoCliente.findOne({
        where: { id },
        relations: [ 'satRegimenFiscal', 'satUsoCFDI' ]
      })

      if(!cliente){
        throw new NotFoundException(`El Cliente con el Id ${ id } no fué encontrado`)
      }

      return cliente

    }finally{

      await queryRunner.release()

    }
   
  }

  async getTotalClientes(user: User) {
    const schema = user.compania.schema;
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();

    try {

      await queryRunner.query(`SET search_path TO ${schema}, public`);

      const repoCliente = queryRunner.manager.getRepository(Cliente);

      const total = await repoCliente.count()

      return{
        total: total
      }

    } finally {
      await queryRunner.release();
    }
  }

  async update(id: string, updateClienteDto: UpdateClienteDto, user: User) {

    const schema = user.compania.schema;
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect()

    try{

      await queryRunner.query(`SET search_path TO ${schema}, public`);
      
      const repoCliente = queryRunner.manager.getRepository(Cliente)
      
      const cliente = await repoCliente.findOneBy({id:id})

      if(!cliente){
        throw new NotFoundException(`El Cliente con el Id ${ id.toUpperCase() } no fué encontrado`)
      }

      let satRegimenFiscal: SatRegimenFiscal | null = null
      let satUsoCFDI: SatUsoCFDI | null = null

      if( updateClienteDto.claveSatRegimenFiscal ){
        
        satRegimenFiscal = await this.satRegimenFiscalRepository.findOne({
          where: { 
            clave: updateClienteDto.claveSatRegimenFiscal,
            fisica: true
          }
        })
  
        if( !satRegimenFiscal ){
          throw new NotFoundException('Regimen Fiscal no encontrado')
        }

        if( updateClienteDto.claveSatUsoCFDI ){
          
          satUsoCFDI = await this.satUsoCFDIRepository.findOne({
            where: {
              clave: updateClienteDto.claveSatUsoCFDI,
              fisica: true
            }
          })
    
          if( !satUsoCFDI ){
            throw new NotFoundException('Uso CFDI no encontrado')
          }

        }

      }
      
      Object.assign( cliente, updateClienteDto)
      cliente.updatedAtUser = user
      cliente.satRegimenFiscal = satRegimenFiscal
      cliente.satUsoCFDI = satUsoCFDI
      
      return await repoCliente.save( cliente )
    
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