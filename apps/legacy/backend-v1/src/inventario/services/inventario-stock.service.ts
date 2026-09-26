import { Injectable } from '@nestjs/common';
import { QueryRunner } from 'typeorm';
import { Producto } from '../../productos/entities/producto.entity';
import { InventarioLote } from '../entities/inventario-lote.entity';

@Injectable()
export class InventarioStockService {
  async sincronizarDesdeLotes(
    queryRunner: QueryRunner,
    productoId: string,
  ): Promise<number> {
    const repoLote = queryRunner.manager.getRepository(InventarioLote);
    const resultado = await repoLote
      .createQueryBuilder('lote')
      .select('COALESCE(SUM(lote.cantidad_disponible), 0)', 'total')
      .where('lote.producto_id = :productoId', { productoId })
      .andWhere('lote.activo = true')
      .getRawOne<{ total: string }>();

    const stock = Number(resultado?.total ?? 0);
    await queryRunner.manager.update(Producto, productoId, {
      stockActual: stock,
    });
    return stock;
  }

  async obtenerStockActual(
    queryRunner: QueryRunner,
    productoId: string,
  ): Promise<number> {
    const producto = await queryRunner.manager.findOne(Producto, {
      where: { id: productoId },
    });
    return Number(producto?.stockActual ?? 0);
  }
}
