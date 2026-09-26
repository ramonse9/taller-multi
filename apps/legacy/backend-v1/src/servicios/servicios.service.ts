import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { DataSource, ILike } from 'typeorm';
import { User } from '../auth/entities/user.entity';
import { EnumPrefijoEntity } from '../commom/enums/general.enum';
import { generarEntityId } from '../config/generarEntityId';
import { SatService } from '../sat/sat.service';
import { Servicio } from './entities/servicio.entity';
import { CreateServicioDto } from './dto/create-servicio.dto';
import { UpdateServicioDto } from './dto/update-servicio.dto';

@Injectable()
export class ServiciosService {
  constructor(
    private readonly dataSource: DataSource,
    private readonly satService: SatService,
  ) {}

  async create(dto: CreateServicioDto, user: User) {
    const schema = user.compania.schema;
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();
    try {
      await queryRunner.query(`SET search_path TO ${schema}, public`);
      const repo = queryRunner.manager.getRepository(Servicio);
      const sat = await this.satService.getSatProductoServicioById(
        dto.idSatProductoServicio,
      );
      if (!sat) throw new BadRequestException('Clave SAT no válida');
      const id = await generarEntityId(repo, EnumPrefijoEntity.SERVICIOS);
      const servicio = repo.create({
        id,
        descripcion: dto.descripcion,
        precioVenta: Number(dto.precioVenta),
        activo: true,
        satProductoServicio: sat,
        createdAtUser: user,
        updatedAtUser: user,
      });
      const guardado = await repo.save(servicio);
      await queryRunner.commitTransaction();
      return guardado;
    } catch (e) {
      await queryRunner.rollbackTransaction();
      if (e instanceof BadRequestException) throw e;
      throw new InternalServerErrorException('Error al crear servicio');
    } finally {
      await queryRunner.release();
    }
  }

  async findAll(page: number, limit: number, fSearch: string, user: User) {
    const schema = user.compania.schema;
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    try {
      await queryRunner.query(`SET search_path TO ${schema}, public`);
      const repo = queryRunner.manager.getRepository(Servicio);
      const where = fSearch ? { descripcion: ILike(`%${fSearch}%`) } : {};
      const [items, count] = await repo.findAndCount({
        where,
        relations: ['satProductoServicio'],
        order: { descripcion: 'ASC' },
        skip: (page - 1) * limit,
        take: limit,
      });
      return { items, count, pages: Math.ceil(count / limit) || 1 };
    } finally {
      await queryRunner.release();
    }
  }

  async findOne(id: string, user: User) {
    const schema = user.compania.schema;
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    try {
      await queryRunner.query(`SET search_path TO ${schema}, public`);
      const servicio = await queryRunner.manager.findOne(Servicio, {
        where: { id: id.toLowerCase() },
        relations: ['satProductoServicio'],
      });
      if (!servicio) {
        throw new NotFoundException(`Servicio ${id} no encontrado`);
      }
      return servicio;
    } finally {
      await queryRunner.release();
    }
  }

  async update(id: string, dto: UpdateServicioDto, user: User) {
    const schema = user.compania.schema;
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();    

    try {
      await queryRunner.query(`SET search_path TO ${schema}, public`);
      const repo = queryRunner.manager.getRepository(Servicio);
      const servicio = await repo.findOne({ where: { id: id.toLowerCase() } });
      if (!servicio) {
        throw new NotFoundException(`Servicio ${id} no encontrado`);
      }
      if (dto.descripcion !== undefined) servicio.descripcion = dto.descripcion;
      if (dto.precioVenta !== undefined) servicio.precioVenta = Number(dto.precioVenta);
      if (dto.idSatProductoServicio) {
        const sat = await this.satService.getSatProductoServicioById(
          dto.idSatProductoServicio,
        );
        if (!sat) throw new BadRequestException('Clave SAT no válida');
        servicio.satProductoServicio = sat;
      }
      servicio.updatedAtUser = user;
      servicio.activo = dto.activo;
      return await repo.save(servicio);
    } catch (e) {
      if (e instanceof NotFoundException || e instanceof BadRequestException) {
        throw e;
      }
      throw new InternalServerErrorException('Error al actualizar servicio');
    } finally {
      await queryRunner.release();
    }
  }
}
