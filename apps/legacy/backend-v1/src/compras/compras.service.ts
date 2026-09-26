import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { DataSource, In } from 'typeorm';
import { User } from '../auth/entities/user.entity';
import {
  EnumEstatusCompra,
  EnumPrefijoEntity,
} from '../commom/enums/general.enum';
import { generarEntityId } from '../config/generarEntityId';
import { Producto } from '../productos/entities/producto.entity';
import { Proveedor } from '../proveedores/entities/proveedor.entity';
import { InventarioFifoService } from '../inventario/services/inventario-fifo.service';
import { Compra } from './entities/compra.entity';
import { CompraDetalle } from './entities/compra-detalle.entity';
import { CreateCompraDto } from './dto/create-compra.dto';
import { mapCompra } from './mappers/compra.mapper';

@Injectable()
export class ComprasService {
  constructor(
    private readonly dataSource: DataSource,
    private readonly fifoService: InventarioFifoService,
  ) {}

  async create(dto: CreateCompraDto, user: User) {
    const schema = user.compania.schema;
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();
    try {
      await queryRunner.query(`SET search_path TO ${schema}, public`);

      const repoCompra = queryRunner.manager.getRepository(Compra);
      /*const existente = await repoCompra.findOne({ where: { folio: dto.folio } });
      if (existente) {
        throw new BadRequestException(`Folio ${dto.folio} ya existe`);
      }
      */

      const proveedor = await queryRunner.manager.findOne(Proveedor, {
        where: { id: dto.id_proveedor, activo: true },
      });
      if (!proveedor) {
        throw new NotFoundException('Proveedor no encontrado o inactivo');
      }

      const idsProductos = dto.detalles.map((d) => d.id_producto);
      const productos = await queryRunner.manager.find(Producto, {
        where: { id: In(idsProductos) },
      });
      const mapProductos = new Map(productos.map((p) => [p.id, p]));

      let subtotal = 0;
      const detallesEntities: CompraDetalle[] = [];

      for (const d of dto.detalles) {
        const producto = mapProductos.get(d.id_producto);
        if (!producto) {
          throw new BadRequestException(
            `Producto ${d.id_producto} no encontrado`,
          );
        }
        const lineSubtotal = Number(d.cantidad) * Number(d.costoUnitario);
        subtotal += lineSubtotal;
        detallesEntities.push(
          queryRunner.manager.getRepository(CompraDetalle).create({
            producto,
            cantidad: d.cantidad,
            costoUnitario: Number(d.costoUnitario),
            subtotal: lineSubtotal,
          }),
        );
      }

      const iva = subtotal * 0.16;
      const total = subtotal + iva;
      const compraId = await generarEntityId(
        repoCompra,
        EnumPrefijoEntity.COMPRAS,
      );

      const compra = repoCompra.create({
        id: compraId,
        //folio: dto.folio,        
        proveedor,
        subtotal,
        iva,
        total,
        //observaciones: dto.observaciones,
        estatus: EnumEstatusCompra.BORRADOR,
        usuarioBorrador: user,
        createdAtUser: user,
        updatedAtUser: user,
      });

      const compraGuardada = await repoCompra.save(compra);

      for (const det of detallesEntities) {
        det.compra = compraGuardada;
      }
      await queryRunner.manager.save(CompraDetalle, detallesEntities);

      await queryRunner.commitTransaction();
      return { id: compraGuardada.id };
    } catch (e) {
      await queryRunner.rollbackTransaction();
      if (
        e instanceof NotFoundException ||
        e instanceof BadRequestException
      ) {
        throw e;
      }
      throw new InternalServerErrorException('Error al crear compra');
    } finally {
      await queryRunner.release();
    }
  }

  async confirmar(id: string, user: User) {
    const schema = user.compania.schema;
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();
        
    try {
      await queryRunner.query(`SET search_path TO ${schema}, public`);

      const compra = await queryRunner.manager.findOne(Compra, {
        where: { id: id.toLowerCase() },
        relations: ['detalles', 'detalles.producto', 'proveedor'],
      });

      if (!compra) {
        throw new NotFoundException(`Compra ${id} no encontrada`);
      }
      if (compra.estatus !== EnumEstatusCompra.BORRADOR) {
        throw new BadRequestException(
          'Solo se pueden confirmar compras en borrador',
        );
      }
      if (!compra.detalles?.length) {
        throw new BadRequestException('La compra no tiene detalles');
      }

      for (const detalle of compra.detalles) {
        await this.fifoService.entradaPorCompra(queryRunner, detalle);
      }

      compra.estatus = EnumEstatusCompra.CONFIRMADA;
      //compra.updatedAtUser = user;
      compra.usuarioConfirmacion = user;
      compra.fechaConfirmacion = new Date();

      await queryRunner.manager.save(Compra, compra);

      await queryRunner.commitTransaction();
      return { id: compra.id, estatus: compra.estatus };
    } catch (e) {
      await queryRunner.rollbackTransaction();
      if (
        e instanceof NotFoundException ||
        e instanceof BadRequestException
      ) {
        throw e;
      }
      throw new InternalServerErrorException('Error al confirmar compra');
    } finally {
      await queryRunner.release();
    }
  }

  async cancelar(id: string, user: User) {
    const schema = user.compania.schema;
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();
    try {
      await queryRunner.query(`SET search_path TO ${schema}, public`);

      const compra = await queryRunner.manager.findOne(Compra, {
        where: { id: id.toLowerCase() },
        relations: ['detalles', 'detalles.producto'],
      });

      if (!compra) {
        throw new NotFoundException(`Compra ${id} no encontrada`);
      }
      if (compra.estatus === EnumEstatusCompra.CANCELADA) {
        throw new BadRequestException('La compra ya está cancelada');
      }
      if (compra.estatus === EnumEstatusCompra.CONFIRMADA) {
        throw new BadRequestException(
          'No se puede cancelar una compra confirmada con lotes activos desde este endpoint. Use ajustes de inventario.',
        );
      }

      compra.estatus = EnumEstatusCompra.CANCELADA;
      compra.updatedAtUser = user;
      compra.usuarioCancelacion = user;
      compra.fechaCancelacion = new Date();

      await queryRunner.manager.save(Compra, compra);
      await queryRunner.commitTransaction();
      return { id: compra.id, estatus: compra.estatus };
    } catch (e) {
      await queryRunner.rollbackTransaction();
      if (
        e instanceof NotFoundException ||
        e instanceof BadRequestException
      ) {
        throw e;
      }
      throw new InternalServerErrorException('Error al cancelar compra');
    } finally {
      await queryRunner.release();
    }
  }
  
  async getPaginado( page: number = 1, limit: number, fSearch: string, estatus: string[] = [], user: User ) {
    
    const schema = user.compania.schema;

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect()

    try {
      await queryRunner.query(`SET search_path TO ${schema}, public`);      

      const repoCompra = queryRunner.manager.getRepository(Compra);

      // Query base para obtener solo IDs
      const baseQuery = repoCompra.createQueryBuilder('compra')
        .select(['compra.id', "compra.createdAt"])
        .innerJoin('compra.proveedor', 'proveedor')
        .leftJoin('compra.usuarioBorrador', 'usuarioBorrador')
        .leftJoin('compra.usuarioConfirmacion', 'usuarioConfirmacion')
        .leftJoin('compra.usuarioCancelacion', 'usuarioCancelacion');

      if (fSearch !== '') {
        const search = `%${fSearch.trim().toLowerCase()}%`;

        //compra.observaciones ILIKE :search OR
        baseQuery.where(`(
          compra.folio ILIKE :search OR
          unaccent(proveedor.nombre) ILIKE :search OR
          
          unaccent(usuarioBorrador.fullName) ILIKE :search OR
          unaccent(usuarioConfirmacion.fullName) ILIKE :search OR
          unaccent(usuarioCancelacion.fullName) ILIKE :search
        )`, { search });
      }

      if( estatus && estatus.length > 0 && !estatus.includes('todos')){
        baseQuery.andWhere('compra.estatus IN (:...estatus)', {estatus} );
      }

      const offset = (page - 1) * limit;

      const [idsResults, totalItems] = await baseQuery
        .orderBy('compra.createdAt', 'DESC')
        .skip(offset)
        .take(limit)
        .getManyAndCount();

      if (totalItems === 0) {
        return { count: 0, pages: 0, compras: [] };
      }      

      const ids = idsResults.map(c => c.id);

      // Query completo con joins
      const compras = await repoCompra.createQueryBuilder('compra')
        .innerJoinAndSelect('compra.proveedor', 'proveedor')
        .leftJoinAndSelect('compra.usuarioBorrador', 'usuarioBorrador')
        .leftJoinAndSelect('compra.usuarioConfirmacion', 'usuarioConfirmacion')
        .leftJoinAndSelect('compra.usuarioCancelacion', 'usuarioCancelacion')
        .leftJoinAndSelect('compra.detalles', 'detalles')
        .leftJoinAndSelect('detalles.producto', 'producto')
        .where('compra.id IN (:...ids)', { ids })
        .orderBy('compra.createdAt', 'DESC')
        .addOrderBy('detalles.id', 'ASC')
        .getMany();

      return {
        count: totalItems,
        pages: Math.ceil(totalItems / limit),
        compras: compras.map( mapCompra ),
        //compras: compras,
      };
    }finally{
      await queryRunner.release();
    }
  }
  
  async findOne(id: string, user: User) {
    const schema = user.compania.schema;
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    try {
      await queryRunner.query(`SET search_path TO ${schema}, public`);

      const compra = await queryRunner.manager
        .getRepository(Compra)
        .createQueryBuilder('compra')
        .innerJoinAndSelect('compra.proveedor', 'proveedor')
        .leftJoinAndSelect('compra.usuarioBorrador', 'usuarioBorrador')
        .leftJoinAndSelect('compra.usuarioConfirmacion', 'usuarioConfirmacion')
        .leftJoinAndSelect('compra.usuarioCancelacion', 'usuarioCancelacion')
        .leftJoinAndSelect('compra.detalles', 'detalles')
        .leftJoinAndSelect('detalles.producto', 'producto')
        .where('compra.id = :id', { id }) // sin toLowerCase si tus IDs son case-sensitive
        .orderBy('compra.createdAt', 'DESC')
        .addOrderBy('detalles.id', 'ASC') // ordena los detalles
        .getOne();

      if (!compra) {
        throw new NotFoundException(`Compra ${id} no encontrada`);
      }

      return mapCompra(compra); // mantener consistencia con getPaginado
    } finally {
      await queryRunner.release();
    }
  }

}
