import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { DataSource, ILike } from 'typeorm';
import { User } from '../auth/entities/user.entity';
import { CreateAjusteInventarioDto } from './dto/create-ajuste-inventario.dto';
import { InventarioFifoService } from './services/inventario-fifo.service';
import { InventarioLote } from './entities/inventario-lote.entity';
import { InventarioMovimiento } from './entities/inventario-movimiento.entity';

@Injectable()
export class InventarioConsultaService {
  constructor(
    private readonly dataSource: DataSource,
    private readonly fifoService: InventarioFifoService,
  ) {}

  async getLotesPorProducto(idProducto: string, user: User) {
    const schema = user.compania.schema;
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    try {
      await queryRunner.query(`SET search_path TO ${schema}, public`);
      return queryRunner.manager.find(InventarioLote, {
        where: { producto: { id: idProducto.toLowerCase() } },
        relations: ['producto', 'compraDetalle'],
        order: { fechaEntrada: 'ASC' },
      });
    } finally {
      await queryRunner.release();
    }
  }

  async getPaginadoLotes(page: number, limit: number, fSearch: string, user: User) {
    const schema = user.compania.schema;
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    try {
      await queryRunner.query(`SET search_path TO ${schema}, public`);
      const repo = queryRunner.manager.getRepository(InventarioLote);
      //const where = fSearch
      //  ? [
      //      { descripcion: ILike(`%${fSearch}%`) },
      //      { sku: ILike(`%${fSearch}%`) },
      //    ]
      //  : {};
      const [items, count] = await repo.findAndCount({
        //where,
        relations: ['producto'],
        order: { id: 'DESC' },
        skip: (page - 1) * limit,
        take: limit,
      });
      return { inventarioLotes: items, count, pages: Math.ceil(count / limit) || 1 };
    } finally {
      await queryRunner.release();
    }
  }

  async getMovimientosOLD(productoId: string | undefined, user: User) {
    const schema = user.compania.schema;
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    try {
      await queryRunner.query(`SET search_path TO ${schema}, public`);
      const where = productoId
        ? { producto: { id: productoId.toLowerCase() } }
        : {};
      return queryRunner.manager.find(InventarioMovimiento, {
        where,
        relations: ['producto', 'lote'],
        order: { createdAt: 'DESC' },
        take: 200,
      });
    } finally {
      await queryRunner.release();
    }  
  }

  async getPaginadoMovimientos(page: number, limit: number, fSearch: string, user: User) {
    const schema = user.compania.schema;
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    try {
      await queryRunner.query(`SET search_path TO ${schema}, public`);
      const repo = queryRunner.manager.getRepository(InventarioMovimiento);
      //const where = fSearch
      //  ? [
      //      { descripcion: ILike(`%${fSearch}%`) },
      //      { sku: ILike(`%${fSearch}%`) },
      //    ]
      //  : {};
      const [items, count] = await repo.findAndCount({
        //where,
        relations: ['producto','lote'],
        order: { id: 'DESC' },
        skip: (page - 1) * limit,
        take: limit,
      });
      return { inventarioMovimientos: items, count, pages: Math.ceil(count / limit) || 1 };
    } finally {
      await queryRunner.release();
    }
  }

  async crearAjuste(dto: CreateAjusteInventarioDto, user: User) {
    const schema = user.compania.schema;
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();
    try {
      await queryRunner.query(`SET search_path TO ${schema}, public`);
      await this.fifoService.ajusteManual({
        queryRunner,
        idProducto: dto.id_producto.toLowerCase(),
        cantidad: Number(dto.cantidad),
        observaciones: dto.observaciones,
      });
      await queryRunner.commitTransaction();
      return { ok: true };
    } catch (error) {
      await queryRunner.rollbackTransaction();
      if (error instanceof BadRequestException) throw error;
      throw new InternalServerErrorException(
        'Error al registrar ajuste de inventario',
      );
    } finally {
      await queryRunner.release();
    }
  }
}
