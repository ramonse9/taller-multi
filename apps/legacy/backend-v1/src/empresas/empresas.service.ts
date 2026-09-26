import { EnumPrefijoEntity } from './../commom/enums/general.enum';
import { SatUsoCFDI } from './../sat/entities/sat-uso-cfdi.entity';
import { SatRegimenFiscal } from './../sat/entities/sat-regimen-fiscal.entity';
import { BadRequestException, Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { CreateEmpresaDto } from './dto/create-empresa.dto';
import { UpdateEmpresaDto } from './dto/update-empresa.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Empresa } from './entities/empresa.entity';
import { DataSource, Repository } from 'typeorm';
import { User } from '../auth/entities/user.entity';
import { generarEntityId } from '../config/generarEntityId';

@Injectable()
export class EmpresasService {

  constructor(
    //@InjectRepository(Empresa) private readonly empresaRepository: Repository<Empresa>,
    @InjectRepository(SatRegimenFiscal) private readonly satRegimenFiscalRepository: Repository<SatRegimenFiscal>,
    @InjectRepository(SatUsoCFDI) private readonly satUsoCFDIRepository: Repository<SatUsoCFDI>,
    private readonly dataSource: DataSource
  ){    
  }

  async create(createEmpresaDto: CreateEmpresaDto, user: User) {

    const schema = user.compania.schema;
    
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect()    

    try{

      await queryRunner.query(`SET search_path TO ${schema}, public`);

      let satRegimenFiscal: SatRegimenFiscal | null
      let satUsoCFDI: SatUsoCFDI | null

      if( createEmpresaDto.claveSatRegimenFiscal ){

        satRegimenFiscal = await this.satRegimenFiscalRepository.findOne({
          where: { 
            clave: createEmpresaDto.claveSatRegimenFiscal,
            moral: true
          }
        })
  
        if( !satRegimenFiscal ){
          throw new NotFoundException('Regimen Fiscal no encontrado')
        }

        if( createEmpresaDto.claveSatUsoCFDI ){

          satUsoCFDI = await this.satUsoCFDIRepository.findOne({
            where: { 
              clave: createEmpresaDto.claveSatUsoCFDI,
              moral: true
            }
          })
          
          if( !satUsoCFDI ){
            throw new NotFoundException('Uso CFDI no encontrado')
          }

        }

      }

      const repoEmpresa = queryRunner.manager.getRepository(Empresa);

      const nuevoId = await generarEntityId( repoEmpresa, EnumPrefijoEntity.EMPRESAS );

      const nuevaEmpresa = repoEmpresa.create({
        id: nuevoId,
        ...createEmpresaDto,
        satRegimenFiscal: satRegimenFiscal,
        satUsoCFDI: satUsoCFDI,
        createdAtUser: user,
        updatedAtUser: user
      })

      await repoEmpresa.save( nuevaEmpresa )
      
      const empresaGuardada = await repoEmpresa.findOne({
        where: { id: nuevoId},
        relations: ['satRegimenFiscal','satUsoCFDI']
      })

      return empresaGuardada;
      
    }catch(error){      
    
      if( error instanceof BadRequestException){
        throw error
      }
        
      throw new InternalServerErrorException('Ocurrió un error inesperado al crear la Empresa')

    }finally{
      await queryRunner.release();
    }
  }

  async getPaginado( page: number, limit: number, fSearch: string, user: User ){
    
    const schema = user.compania.schema;

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();

    try{

      await queryRunner.query(`SET search_path TO ${schema}, public`);

      const repoEmpresa = queryRunner.manager.getRepository(Empresa)

      const query = repoEmpresa.createQueryBuilder('empresa');
      query.leftJoin('empresa.createdAtUser', 'createdAtUser');
      query.leftJoin('empresa.updatedAtUser', 'updatedAtUser');
      query.leftJoinAndSelect('empresa.satRegimenFiscal', 'satRegimenFiscal')
      query.leftJoinAndSelect('empresa.satUsoCFDI', 'usoCfdi')
      query.addSelect(['createdAtUser.id', 'createdAtUser.email', 'createdAtUser.full_name']);
      query.addSelect(['updatedAtUser.id', 'updatedAtUser.email', 'updatedAtUser.full_name']);

      if(fSearch !== ''){

        const search = `%${fSearch.trim().toLowerCase()}%`

        query.andWhere(
          `(
          empresa.id LIKE :search OR
          unaccent(empresa.nombre) LIKE :search OR
          empresa.telefono LIKE :search OR
          empresa.email LIKE :search OR
          empresa.rfc LIKE :search OR
          empresa.razon_social LIKE :search
          )`,
          {
            search: search
          }
        )
      }

      //query.orderBy(`cliente.${sortBy}`, order);
      query.orderBy(`empresa.id`, 'DESC');

      const offset = (page - 1 ) * limit;

      query.skip(offset).take(limit);

      const [ data, totalItems ] = await query.getManyAndCount()
      
      return {
        count: totalItems,
        pages: Math.ceil(totalItems / limit),
        empresas: data, 
      }

    }finally{
      await queryRunner.release()
    }
    
  }

  async getOne(id: string, user: User) {

    const schema = user.compania.schema;
    const queryRunner = this.dataSource.createQueryRunner()
    await queryRunner.connect()

    try{

      await queryRunner.query(`SET search_path TO ${schema}, public`);

      const repoEmpresa = queryRunner.manager.getRepository(Empresa);
      
      const empresa = await repoEmpresa.findOne({
        where: { id },
        relations: [ 'satRegimenFiscal', 'satUsoCFDI' ]
      })
      //const empresa = await repoEmpresa.findOneBy({id:id.toLowerCase().trim()})
  
      if( !empresa ){
        throw new NotFoundException(`La Empresa con el Id ${ id } no fué encontrada`)
      }
  
      return empresa;

    }finally{
      await queryRunner.release()
    }

  }

  async getTotalEmpresas(user: User) {
      const schema = user.compania.schema;
      const queryRunner = this.dataSource.createQueryRunner();
      await queryRunner.connect();
  
      try {
  
        await queryRunner.query(`SET search_path TO ${schema}, public`);
  
        const repoEmpresa = queryRunner.manager.getRepository(Empresa);
  
        const total = await repoEmpresa.count()
  
        return{
          total: total
        }
  
      } finally {
        await queryRunner.release();
      }
  }

  async update(id: string, updateEmpresaDto: UpdateEmpresaDto, user: User) {

    const schema = user.compania.schema;
    const queryRunner = this.dataSource.createQueryRunner()
    await queryRunner.connect();
    
    try{      

      await queryRunner.query(`SET search_path TO ${schema}, public`);

      const repoEmpresa = queryRunner.manager.getRepository(Empresa);

      const empresa = await this.getOne(id, user )
      
      let satRegimenFiscal: SatRegimenFiscal | null
      let satUsoCFDI: SatUsoCFDI | null

      if( updateEmpresaDto.claveSatRegimenFiscal ){

        satRegimenFiscal = await this.satRegimenFiscalRepository.findOne({
          where: { 
            clave: updateEmpresaDto.claveSatRegimenFiscal,
            moral: true
          }
        })
  
        if( !satRegimenFiscal ){
          throw new NotFoundException('Regimen Fiscal no encontrado')
        }

        if( updateEmpresaDto.claveSatUsoCFDI ){

          satUsoCFDI = await this.satUsoCFDIRepository.findOne({
            where: { 
              clave: updateEmpresaDto.claveSatUsoCFDI,
              moral: true
            }
          })
    
          if( !satUsoCFDI ){
            throw new NotFoundException('Uso CFDI no encontrado')
          }

        }

      }

      Object.assign( empresa, updateEmpresaDto)
      empresa.updatedAtUser = user;
      empresa.satRegimenFiscal = satRegimenFiscal
      empresa.satUsoCFDI = satUsoCFDI
      
      return await repoEmpresa.save( empresa )
    
    }catch(error){      
    
      if( error instanceof BadRequestException){
        throw error
      }

      if(error instanceof NotFoundException){
        throw error
      }
      
      throw new InternalServerErrorException('Ocurrió un error inesperado al actualizar la Empresa')
    }finally{
      await queryRunner.release()
    }
  }

}
