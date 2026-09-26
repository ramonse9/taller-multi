import {
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { DataSource, ILike } from 'typeorm';
import { User } from '../auth/entities/user.entity';
import { EnumPrefijoEntity } from '../commom/enums/general.enum';
import { generarEntityId } from '../config/generarEntityId';
import { Proveedor } from './entities/proveedor.entity';
import { CreateProveedorDto } from './dto/create-proveedor.dto';
import { UpdateProveedorDto } from './dto/update-proveedor.dto';

@Injectable()
export class ProveedoresService {
  constructor(private readonly dataSource: DataSource) {}

  async create(dto: CreateProveedorDto, user: User) {
    const schema = user.compania.schema;
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();
    try {
      await queryRunner.query(`SET search_path TO ${schema}, public`);
      const repo = queryRunner.manager.getRepository(Proveedor);
      const id = await generarEntityId(repo, EnumPrefijoEntity.PROVEEDORES);
      const proveedor = repo.create({
        id,
        ...dto,
        activo: true,
        createdAtUser: user,
        updatedAtUser: user,
      });
      const guardado = await repo.save(proveedor);
      await queryRunner.commitTransaction();
      return guardado;
    } catch {
      await queryRunner.rollbackTransaction();
      throw new InternalServerErrorException('Error al crear proveedor');
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
      const repo = queryRunner.manager.getRepository(Proveedor);
      const where = fSearch
        ? [
            { nombre: ILike(`%${fSearch}%`) },
            { rfc: ILike(`%${fSearch}%`) },
          ]
        : {};
      const [items, count] = await repo.findAndCount({
        where,
        order: { nombre: 'ASC' },
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
      const proveedor = await queryRunner.manager.findOne(Proveedor, {
        where: { id: id.toLowerCase() },
      });
      if (!proveedor) {
        throw new NotFoundException(`Proveedor ${id} no encontrado`);
      }
      return proveedor;
    } finally {
      await queryRunner.release();
    }
  }

  async update(id: string, dto: UpdateProveedorDto, user: User) {
    const schema = user.compania.schema;
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    try {
      await queryRunner.query(`SET search_path TO ${schema}, public`);
      const repo = queryRunner.manager.getRepository(Proveedor);
      const proveedor = await repo.findOne({ where: { id: id.toLowerCase() } });
      if (!proveedor) {
        throw new NotFoundException(`Proveedor ${id} no encontrado`);
      }
      Object.assign(proveedor, dto);
      proveedor.updatedAtUser = user;
      return await repo.save(proveedor);
    } catch (e) {
      if (e instanceof NotFoundException) throw e;
      throw new InternalServerErrorException('Error al actualizar proveedor');
    } finally {
      await queryRunner.release();
    }
  }
}
