import { Injectable } from '@nestjs/common';
import { QueryRunner } from 'typeorm';
import { OrdenConcepto } from '../../ordenes/entities/orden_concepto.entity';
import { Producto } from '../../productos/entities/producto.entity';
import { ProductoServicio } from '../../productos-servicios/entities/producto-servicio.entity';
import { Servicio } from '../../servicios/entities/servicio.entity';

export interface SnapshotData {
  descripcionSnapshot: string;
  precioVentaSnapshot: number;
  satClaveSnapshot: string;
  satDescripcionSnapshot: string;
}

@Injectable()
export class InventarioSnapshotsService {
  
  /*
  async construirDesdeProducto(
    queryRunner: QueryRunner,
    productoId: string,
    precioVenta: number,
  ): Promise<SnapshotData> {
    const producto = await queryRunner.manager.findOne(Producto, {
      where: { id: productoId },
      relations: ['satProductoServicio'],
    });

    if (!producto) {
      throw new Error(`Producto ${productoId} no encontrado para snapshot`);
    }

    return {
      descripcionSnapshot: producto.descripcion,
      precioVentaSnapshot: precioVenta,
      satClaveSnapshot: producto.satProductoServicio?.clave ?? '',
      satDescripcionSnapshot: producto.satProductoServicio?.descripcion ?? '',
    };
  }
  */

  /*
  async construirDesdeServicio(
    queryRunner: QueryRunner,
    servicioId: string,
    precioVenta: number,
  ): Promise<SnapshotData> {
    const servicio = await queryRunner.manager.findOne(Servicio, {
      where: { id: servicioId },
      relations: ['satProductoServicio'],
    });

    if (!servicio) {
      throw new Error(`Servicio ${servicioId} no encontrado para snapshot`);
    }

    return {
      descripcionSnapshot: servicio.descripcion,
      precioVentaSnapshot: precioVenta,
      satClaveSnapshot: servicio.satProductoServicio?.clave ?? '',
      satDescripcionSnapshot: servicio.satProductoServicio?.descripcion ?? '',
    };
  }
  */

  /*
  async construirDesdeProductoServicio(
    queryRunner: QueryRunner,
    productoServicioId: string,
    precioVenta: number,
  ): Promise<SnapshotData> {
    const ps = await queryRunner.manager.findOne(ProductoServicio, {
      where: { id: productoServicioId },
      relations: ['satProductoServicio'],
    });

    if (!ps) {
      throw new Error(
        `Producto/servicio ${productoServicioId} no encontrado para snapshot`,
      );
    }

    return {
      descripcionSnapshot: ps.descripcion,
      precioVentaSnapshot: precioVenta,
      satClaveSnapshot: ps.satProductoServicio?.clave ?? '',
      satDescripcionSnapshot: ps.satProductoServicio?.descripcion ?? '',
    };
  }
  */

  /*
  aplicarAConcepto(
    concepto: OrdenConcepto,
    snapshot: SnapshotData,
  ): OrdenConcepto {
    concepto.descripcionSnapshot = snapshot.descripcionSnapshot;
    concepto.precioVentaSnapshot = snapshot.precioVentaSnapshot;
    concepto.satClaveSnapshot = snapshot.satClaveSnapshot;
    concepto.satDescripcionSnapshot = snapshot.satDescripcionSnapshot;
    return concepto;
  }
  */
 
}
