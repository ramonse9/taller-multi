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
import { ProductoServicio } from '../productos-servicios/entities/producto-servicio.entity';
import { Producto } from './entities/producto.entity';
import { CreateProductoDto } from './dto/create-producto.dto';
import { UpdateProductoDto } from './dto/update-producto.dto';

@Injectable()
export class ProductosService {
  constructor(
    private readonly dataSource: DataSource,
    private readonly satService: SatService,
  ) {}

  async create(dto: CreateProductoDto, user: User) {
    const schema = user.compania.schema;
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();
    try {
      await queryRunner.query(`SET search_path TO ${schema}, public`);
      const repo = queryRunner.manager.getRepository(Producto);
      const sat = await this.satService.getSatProductoServicioById(
        dto.idSatProductoServicio,
      );
      if (!sat) {
        throw new BadRequestException('Clave SAT no válida');
      }
      const id = await generarEntityId(repo, EnumPrefijoEntity.PRODUCTOS);
      const producto = repo.create({
        id,
        descripcion: dto.descripcion,
        sku: dto.sku,
        codigoBarras: dto.codigoBarras,
        precioVenta: Number(dto.precioVenta),
        stockActual: 0,
        stockMinimo: Number(dto.stockMinimo ?? 0),
        //manejaInventario: dto.manejaInventario ?? true,
        permiteVentaSinStock: dto.permiteVentaSinStock ?? false,
        activo: true,
        satProductoServicio: sat,
        createdAtUser: user,
        updatedAtUser: user,
      });
      const guardado = await repo.save(producto);
      await queryRunner.commitTransaction();
      return guardado;
    } catch (e) {
      await queryRunner.rollbackTransaction();
      if (e instanceof BadRequestException) throw e;
      throw new InternalServerErrorException('Error al crear producto');
    } finally {
      await queryRunner.release();
    }
  }

  async migrarDesdeLegacy(legacyId: string, user: User) {
    const schema = user.compania.schema;
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();
    try {
      await queryRunner.query(`SET search_path TO ${schema}, public`);
      const repoPs = queryRunner.manager.getRepository(ProductoServicio);
      const legacy = await repoPs.findOne({
        where: { id: legacyId.toLowerCase() },
        relations: ['satProductoServicio'],
      });
      if (!legacy) {
        throw new NotFoundException(`Legacy ${legacyId} no encontrado`);
      }
      const repo = queryRunner.manager.getRepository(Producto);
      const existente = await repo.findOne({
        where: { productoServicioLegacy: { id: legacy.id } },
      });
      if (existente) {
        throw new BadRequestException('Ya existe producto migrado para este legacy');
      }
      const id = await generarEntityId(repo, EnumPrefijoEntity.PRODUCTOS);
      const producto = repo.create({
        id,
        descripcion: legacy.descripcion,
        precioVenta: Number(legacy.valorUnitario),
        stockActual: 0,
        stockMinimo: 0,
        //manejaInventario: true,
        permiteVentaSinStock: false,
        activo: true,
        satProductoServicio: legacy.satProductoServicio,
        productoServicioLegacy: legacy,
        createdAtUser: user,
        updatedAtUser: user,
      });
      const guardado = await repo.save(producto);
      await queryRunner.commitTransaction();
      return guardado;
    } catch (e) {
      await queryRunner.rollbackTransaction();
      if (e instanceof NotFoundException || e instanceof BadRequestException) {
        throw e;
      }
      throw new InternalServerErrorException('Error al migrar producto');
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
      
      const repo = queryRunner.manager.getRepository(Producto);
      
      const where = fSearch
        ? [
            { descripcion: ILike(`%${fSearch}%`) },
            //{ sku: ILike(`%${fSearch}%`) },
          ]
        : {};
      
        const [items, count] = await repo.findAndCount({
        where,
        relations: ['satProductoServicio'],
        order: { id: 'DESC' },
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
      
      const producto = await queryRunner.manager.findOne(Producto, {
        where: { id: id.toLowerCase() },
        relations: ['satProductoServicio', 'productoServicioLegacy'],
      });
      
      if (!producto) {
        throw new NotFoundException(`Producto ${id} no encontrado`);
      }
      return producto;
    } finally {
      await queryRunner.release();
    }
  }

  async update(id: string, dto: UpdateProductoDto, user: User) {
    const schema = user.compania.schema;
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    try {
      
      await queryRunner.query(`SET search_path TO ${schema}, public`);

      const repo = queryRunner.manager.getRepository(Producto);
      
      const producto = await repo.findOne({
        where: { id: id.toLowerCase() },
        relations: ['satProductoServicio'],
      });

      if (!producto) {
        throw new NotFoundException(`Producto ${id} no encontrado`);
      }
      if (dto.descripcion !== undefined) producto.descripcion = dto.descripcion;
      if (dto.sku !== undefined) producto.sku = dto.sku;
      if (dto.codigoBarras !== undefined) producto.codigoBarras = dto.codigoBarras;
      if (dto.precioVenta !== undefined) {
        producto.precioVenta = Number(dto.precioVenta);
      }
      if (dto.stockMinimo !== undefined) {
        producto.stockMinimo = Number(dto.stockMinimo);
      }
      /*if (dto.manejaInventario !== undefined) {
        producto.manejaInventario = dto.manejaInventario;
      }*/
      if (dto.permiteVentaSinStock !== undefined) {
        producto.permiteVentaSinStock = dto.permiteVentaSinStock;
      }
      if (dto.idSatProductoServicio) {
        const sat = await this.satService.getSatProductoServicioById(
          dto.idSatProductoServicio,
        );
        if (!sat) throw new BadRequestException('Clave SAT no válida');
        producto.satProductoServicio = sat;
      }
      producto.updatedAtUser = user;
      return await repo.save(producto);
    } catch (e) {
      if (e instanceof NotFoundException || e instanceof BadRequestException) {
        throw e;
      }
      throw new InternalServerErrorException('Error al actualizar producto');
    } finally {
      await queryRunner.release();
    }
  }
}
