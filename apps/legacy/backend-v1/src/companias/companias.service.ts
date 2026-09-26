import { EnumPrefijoEntity } from './../commom/enums/general.enum';
import { BadRequestException, ConflictException, Injectable, InternalServerErrorException, Logger, NotFoundException } from '@nestjs/common';
import { CreateCompaniaDto } from './dto/create-compania.dto';
import { UpdateCompaniaDto } from './dto/update-compania.dto';
import { DataSource, QueryFailedError, Repository } from 'typeorm';
import { Compania } from './entities/compania.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { TenantService } from '../tenant/tenant.service';
import { generarEntityId } from '../config/generarEntityId';
import { CompaniaTipoGiro } from './entities/compania-tipo-giro.entity';
import { SatTipoPersona } from '../sat/entities/sat-tipo-persona.entity';
import { SatRetencionISR } from '../sat/entities/sat-retencion-isr.entity';
import { SatRetencionIVA } from '../sat/entities/sat-retencion-iva.entity';

@Injectable()
export class CompaniasService {
  private readonly logger = new Logger(CompaniasService.name);

  constructor(
    @InjectRepository(Compania) private readonly companiaRepository: Repository<Compania>,
    private readonly tenantService: TenantService,
    private readonly dataSource: DataSource,
  ){}

  async create(createCompaniaDto: CreateCompaniaDto) {
    const queryRunner = this.dataSource.createQueryRunner();

    try {
      await queryRunner.connect();
      await queryRunner.startTransaction();
      const {
        nombre,
        tipo_compania_tipo_giro,
        tipo_sat_tipo_persona,
        id_sat_retencion_isr,
        id_sat_retencion_iva,
      } = createCompaniaDto;
      const schema = this.tenantService.normalizeSchemaName(createCompaniaDto.schema);
      const manager = queryRunner.manager;
      const companiaRepository = manager.getRepository(Compania);

      const registered = await companiaRepository.findOne({
        where: [{ nombre }, { schema }],
      });
      if (registered) {
        throw new ConflictException(
          registered.schema === schema
            ? `El schema ${schema} ya está registrado`
            : `Ya existe una compañía con el nombre ${nombre}`,
        );
      }

      if (await this.tenantService.schemaExists(schema, queryRunner)) {
        throw new ConflictException(`El schema ${schema} ya existe en la base de datos`);
      }

      const companiaTipoGiro = await manager.getRepository(CompaniaTipoGiro).findOneBy({tipo: tipo_compania_tipo_giro })

      if(!companiaTipoGiro){
        throw new NotFoundException(`No puede crearse la Compañía por que el Id de Tipo Giro: ${ tipo_compania_tipo_giro } no existe`)
      }

      const satTipoPersona = await manager.getRepository(SatTipoPersona).findOneBy({tipo: tipo_sat_tipo_persona })

      if(!satTipoPersona){
        throw new NotFoundException(`No puede crearse la Compañía por que el Id de Tipo Persona: ${ tipo_sat_tipo_persona } no existe`)
      }

      const satRetencionISR = await manager.getRepository(SatRetencionISR).findOneBy({id: id_sat_retencion_isr })

      if(!satRetencionISR){
        throw new NotFoundException(`No puede crearse la Compañía por que el Id de Retencion de ISR: ${ id_sat_retencion_isr } no existe`)
      }

      const satRetencionIVA = await manager.getRepository(SatRetencionIVA).findOneBy({id: id_sat_retencion_iva })

      if(!satRetencionIVA){
        throw new NotFoundException(`No puede crearse la Compañía por que el Id de Retencion de IVA: ${ id_sat_retencion_iva } no existe`)
      }

      const nuevoId = await generarEntityId(companiaRepository, EnumPrefijoEntity.COMPANIAS);

      const nuevaCompania = companiaRepository.create({
        id: nuevoId,
        nombre: nombre,
        schema,
        companiaTipoGiro: companiaTipoGiro,
        satTipoPersona:  satTipoPersona,
        satRetencionISR: satRetencionISR,
        satRetencionIVA: satRetencionIVA,        
      })

      const saved = await companiaRepository.save(nuevaCompania);
      await this.tenantService.provisionSchema(schema, queryRunner);
      await queryRunner.commitTransaction();

      return saved;
    } catch (error) {
      if (queryRunner.isTransactionActive) {
        await queryRunner.rollbackTransaction();
      }

      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException ||
        error instanceof ConflictException
      ) {
        throw error;
      }
      if (
        error instanceof QueryFailedError &&
        (error as QueryFailedError & { driverError?: { code?: string } }).driverError?.code === '23505'
      ) {
        throw new ConflictException('El nombre de compañía o schema ya está registrado');
      }

      this.logger.error(
        'Falló la creación transaccional de la compañía y su schema',
        error instanceof Error ? error.stack : String(error),
      );
      throw new InternalServerErrorException('Ocurrió un error inesperado al crear la Compañía.');
    } finally {
      if (!queryRunner.isReleased) {
        await queryRunner.release();
      }
    }
  }

  async getOne(id: string) {

    const query = this.companiaRepository.createQueryBuilder('compania')

    .leftJoinAndSelect('compania.companiaTipoGiro', 'companiaTipoGiro')
    .leftJoinAndSelect('compania.companiaInfo','companiaInfo')
    .andWhere('compania.id LIKE :id', { id: `${ id.toLowerCase() }`})

    const data = await query.getOne()

    if(!data){
      throw new NotFoundException(`La Compañía con el Id ${ id } no fué encontrada`)
    }

    return data
  }

  findAll() {
    return `This action returns all companias`;
  }

  findOne(id: number) {
    return `This action returns a #${id} compania`;
  }

  update(id: number, updateCompaniaDto: UpdateCompaniaDto) {
    return `This action updates a #${id} compania`;
  }

  remove(id: number) {
    return `This action removes a #${id} compania`;
  }
}
