import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { QueryRunner } from 'typeorm';
import {
  EnumMotivoMovimientoInventario,
  EnumPrefijoEntity,
  EnumTipoMovimientoInventario,
} from '../../commom/enums/general.enum';
import { generarEntityId } from '../../config/generarEntityId';
import { CompraDetalle } from '../../compras/entities/compra-detalle.entity';
import { Producto } from '../../productos/entities/producto.entity';
import { OrdenConcepto } from '../../ordenes/entities/orden_concepto.entity';
import { InventarioLote } from '../entities/inventario-lote.entity';
import { InventarioMovimiento } from '../entities/inventario-movimiento.entity';
import { OrdenConceptoInventario } from '../entities/orden-concepto-inventario.entity';
import { InventarioMovimientosService } from './inventario-movimientos.service';
import { InventarioStockService } from './inventario-stock.service';

export interface ResultadoConsumoProductoFifo {
  subtotalCostoSnapshot: number;
  costoUnitarioPromedioSnapshot: number;
}

/*
export interface ConsumirOrdenConceptoParams {
  queryRunner: QueryRunner;
  ordenConcepto: OrdenConcepto;
  idProducto: string;
  cantidad: number;
  valorUnitario: number;
}
  */

export interface AjusteManualParams {
  queryRunner: QueryRunner;
  idProducto: string;
  cantidad: number;
  observaciones?: string;
}

@Injectable()
export class InventarioFifoService {
  constructor(
    private readonly movimientosService: InventarioMovimientosService,
    private readonly stockService: InventarioStockService,
  ) {}

  async entradaPorCompra(
    queryRunner: QueryRunner,
    detalle: CompraDetalle,
    //fechaCaducidad?: Date,
  ): Promise<InventarioLote | null> {
    const idProducto = detalle.producto.id;
    const cantidad = Number(detalle.cantidad);

    const producto = await this.bloquearProducto(queryRunner, idProducto);

    //if (!producto.manejaInventario) {
    //  return null;
    //}

    const repoLote = queryRunner.manager.getRepository(InventarioLote);
    const idLote = await generarEntityId(
      repoLote,
      EnumPrefijoEntity.INVENTARIOLOTES,
    );

    const stockAnterior = Number(producto.stockActual);
    const stockNuevo = stockAnterior + cantidad;

    const lote = repoLote.create({
      id: idLote,
      producto: { id: idProducto } as Producto,
      compraDetalle: { id: detalle.id } as CompraDetalle,
      cantidadInicial: cantidad,
      cantidadDisponible: cantidad,
      costoUnitario: Number(detalle.costoUnitario),
      fechaEntrada: new Date(),
      //fechaCaducidad: fechaCaducidad ?? null,
      activo: true,
    });

    const loteGuardado = await repoLote.save(lote);

    const movimiento = await this.movimientosService.registrar({
      queryRunner,
      idProducto,
      idLote: loteGuardado.id,
      tipoMovimiento: EnumTipoMovimientoInventario.ENTRADA,
      motivo: EnumMotivoMovimientoInventario.COMPRA,
      cantidad,
      stockAnterior,
      stockNuevo,      
      referenciaTabla: 'pri_compras_detalle',
      idReferencia: String(detalle.id),
    });

    await queryRunner.manager.update(Producto, idProducto, {
      stockActual: stockNuevo,
    });

    return loteGuardado;
  }

  async consumirProductoFIFO(
    queryRunner: QueryRunner,
    idOrdenConcepto: number,
    idProducto: string,
    cantidad: number
  ): Promise<ResultadoConsumoProductoFifo> {

    /*
    const {
      queryRunner,
      idOrdenConcepto,
      idProducto,
      cantidad,
    } = params;*/

    if (cantidad <= 0) {
      throw new BadRequestException(
        'La cantidad a consumir debe ser mayor a cero',
      );
    }

    // 1. Bloquear producto
    const producto = await this.bloquearProducto(
      queryRunner,
      idProducto,
    );

    const stockActual = Number(producto.stockActual);

    // 2. Validar existencia de inventario suficiente
    if (stockActual < cantidad) {
      throw new BadRequestException(
        `Stock insuficiente para el producto ${producto.descripcion}. ` +
        `Disponible: ${stockActual}, solicitado: ${cantidad}`,
      );
    }

    // 3. Obtener lotes FIFO y bloquearlos
    const lotes = await queryRunner.manager
      .getRepository(InventarioLote)
      .createQueryBuilder('lote')
      .setLock('pessimistic_write')
      .where('lote.id_producto = :idProducto', {
        idProducto,
      })
      .andWhere('lote.activo = true')
      .andWhere('lote.cantidad_disponible > 0')
      .orderBy('lote.fecha_entrada', 'ASC')
      .addOrderBy('lote.id', 'ASC')
      .getMany();

    let pendiente = cantidad;
    let subtotalCostoSnapshot = 0;
    let stockActualMovimiento = stockActual;

    const repoConsumo =
      queryRunner.manager.getRepository(
        OrdenConceptoInventario,
      );

    // 4. Consumir lotes FIFO
    for (const lote of lotes) {

      if (pendiente <= 0) {
        break;
      }

      const disponible = Number(
        lote.cantidadDisponible,
      );

      const cantidadTomar = Math.min(
        pendiente,
        disponible,
      );

      if (cantidadTomar <= 0) {
        continue;
      }

      const costoUnitario =
        Number(lote.costoUnitario);

      const subtotalLote =
        cantidadTomar * costoUnitario;

      // Acumulamos el costo real del consumo
      subtotalCostoSnapshot += subtotalLote;

      // --------------------------------
      // Actualizar lote
      // --------------------------------

      lote.cantidadDisponible =
        disponible - cantidadTomar;

      if (lote.cantidadDisponible <= 0) {
        lote.cantidadDisponible = 0;
      }

      await queryRunner.manager.save(
        InventarioLote,
        lote,
      );

      // --------------------------------
      // Registrar consumo del lote
      // --------------------------------

      const consumo = repoConsumo.create({
        ordenConcepto: {
          id: idOrdenConcepto,
        } as OrdenConcepto,

        lote: {
          id: lote.id,
        } as InventarioLote,

        cantidad: cantidadTomar,

        costoUnitario,

        subtotalCosto: subtotalLote,

        cancelado: false,
      });

      await repoConsumo.save(consumo);

      // --------------------------------
      // Registrar movimiento
      // --------------------------------

      const stockAnterior =
        stockActualMovimiento;

      const stockNuevo =
        stockAnterior - cantidadTomar;

      await this.movimientosService.registrar({
        queryRunner,
        idProducto,
        idLote: lote.id,
        tipoMovimiento:
          EnumTipoMovimientoInventario.SALIDA,
        motivo:
          EnumMotivoMovimientoInventario.ORDEN_SERVICIO,
        cantidad: cantidadTomar,
        stockAnterior,
        stockNuevo,
        referenciaTabla:
          'pri_ordenes_conceptos',
        idReferencia:
          String(idOrdenConcepto),
      });

      stockActualMovimiento = stockNuevo;

      pendiente -= cantidadTomar;
    }

    // 5. Validación de seguridad
    if (pendiente > 0) {
      throw new BadRequestException(
        `No fue posible cubrir la cantidad solicitada. ` +
        `Faltan ${pendiente} unidades.`,
      );
    }

    // 6. Actualizar stock consolidado del producto
    await queryRunner.manager.update(
      Producto,
      idProducto,
      {
        stockActual: stockActualMovimiento,
      },
    );

    // 7. Calcular costo unitario promedio ponderado
    const costoUnitarioPromedioSnapshot =
      subtotalCostoSnapshot / cantidad;

    return {
      subtotalCostoSnapshot,
      costoUnitarioPromedioSnapshot,
    };
  }

  /*
  async consumirParaOrdenConcepto(
    params: ConsumirOrdenConceptoParams,
  ): Promise<OrdenConcepto> {
    const { queryRunner, ordenConcepto, idProducto, cantidad, valorUnitario } =
      params;

    const producto = await this.bloquearProducto(queryRunner, idProducto);

    const stockActual = Number(producto.stockActual);
    if (!producto.permiteVentaSinStock && stockActual < cantidad) {
      throw new BadRequestException(
        `Stock insuficiente para el producto ${producto.descripcion}. Disponible: ${stockActual}, solicitado: ${cantidad}`,
      );
    }

    const lotes = await queryRunner.manager
      .getRepository(InventarioLote)
      .createQueryBuilder('lote')
      .setLock('pessimistic_write')
      .where('lote.id_producto = :idProducto', { idProducto })
      .andWhere('lote.activo = true')
      .andWhere('lote.cantidad_disponible > 0')
      .orderBy('lote.fecha_entrada', 'ASC')
      .addOrderBy('lote.id', 'ASC')
      .getMany();

    let pendiente = cantidad;
    let costoTotal = 0;
    const repoConsumo = queryRunner.manager.getRepository(
      OrdenConceptoInventario,
    );

    for (const lote of lotes) {
      if (pendiente <= 0) break;

      const disponible = Number(lote.cantidadDisponible);
      const tomar = Math.min(pendiente, disponible);
      if (tomar <= 0) continue;

      const costoLote = Number(lote.costoUnitario);
      const subtotalLote = tomar * costoLote;
      costoTotal += subtotalLote;

      lote.cantidadDisponible = disponible - tomar;
      if (lote.cantidadDisponible <= 0) {
        lote.cantidadDisponible = 0;
      }
      await queryRunner.manager.save(InventarioLote, lote);

      const consumo = repoConsumo.create({
        ordenConcepto: { id: ordenConcepto.id } as OrdenConcepto,
        lote: { id: lote.id } as InventarioLote,
        cantidad: tomar,
        costoUnitario: costoLote,
        subtotalCosto: subtotalLote,
        cancelado: false,
      });
      await repoConsumo.save(consumo);

      const stockAntesMov = await this.stockService.obtenerStockActual(
        queryRunner,
        idProducto,
      );
      const stockDespuesMov = stockAntesMov - tomar;

      await this.movimientosService.registrar({
        queryRunner,
        idProducto,
        idLote: lote.id,
        tipoMovimiento: EnumTipoMovimientoInventario.SALIDA,
        motivo: EnumMotivoMovimientoInventario.ORDEN_SERVICIO,
        cantidad: tomar,
        stockAnterior: stockAntesMov,
        stockNuevo: stockDespuesMov,        
        referenciaTabla: 'pri_ordenes_conceptos',
        idReferencia: String(ordenConcepto.id),
      });

      await queryRunner.manager.update(Producto, idProducto, {
        stockActual: stockDespuesMov,
      });

      pendiente -= tomar;
    }

    if (pendiente > 0) {
      throw new BadRequestException(
        `No hay lotes suficientes para cubrir la cantidad solicitada (${cantidad}). Faltan ${pendiente} unidades.`,
      );
    }

    const costoUnitarioPromedio = costoTotal / cantidad;
    const subtotalCosto = costoTotal;
    const utilidad = Number(valorUnitario) * cantidad - subtotalCosto;

    ordenConcepto.costoUnitario = costoUnitarioPromedio;
    ordenConcepto.subtotalCosto = subtotalCosto;
    ordenConcepto.utilidad = utilidad;

    return queryRunner.manager.save(OrdenConcepto, ordenConcepto);
  }
  */

  async revertirPorCancelacionConcepto(
    queryRunner: QueryRunner,
    idOrdenConcepto: number,
  ): Promise<void> {
    const repoConsumo = queryRunner.manager.getRepository(
      OrdenConceptoInventario,
    );

    const consumos = await repoConsumo.find({
      where: { ordenConcepto: { id: idOrdenConcepto }, cancelado: false },
      relations: ['lote', 'lote.producto'],
      order: { id: 'DESC' },
    });

    if (!consumos.length) return;

    const idProducto = consumos[0].lote.producto.id;
    await this.bloquearProducto(queryRunner, idProducto);

    for (const consumo of consumos) {
      const lote = await queryRunner.manager
        .getRepository(InventarioLote)
        .createQueryBuilder('lote')
        .setLock('pessimistic_write')
        .where('lote.id = :id', { id: consumo.lote.id })
        .getOne();

      if (!lote) continue;

      const cantidad = Number(consumo.cantidad);
      const stockAnterior = await this.stockService.obtenerStockActual(
        queryRunner,
        idProducto,
      );
      const stockNuevo = stockAnterior + cantidad;

      lote.cantidadDisponible = Number(lote.cantidadDisponible) + cantidad;
      lote.activo = true;
      await queryRunner.manager.save(InventarioLote, lote);

      const movimientoReversa = await this.movimientosService.registrar({
        queryRunner,
        idProducto,
        idLote: lote.id,
        tipoMovimiento: EnumTipoMovimientoInventario.ENTRADA,
        motivo: EnumMotivoMovimientoInventario.CANCELACION,
        cantidad,
        stockAnterior,
        stockNuevo,
        referenciaTabla: 'pri_ordenes_conceptos',
        idReferencia: String(idOrdenConcepto),
        observaciones: `Reversa consumo #${consumo.id}`,
      });

      const movimientosSalida = await queryRunner.manager.find(
        InventarioMovimiento,
        {
          where: {
            referenciaTabla: 'pri_ordenes_conceptos',
            idReferencia: String(idOrdenConcepto),
            cancelado: false,
            motivoMovimiento: EnumMotivoMovimientoInventario.ORDEN_SERVICIO,
            lote: { id: lote.id },
          },
        },
      );

      for (const mov of movimientosSalida) {
        if (Number(mov.cantidad) === cantidad) {
          await this.movimientosService.marcarCanceladoConReversa(
            queryRunner,
            mov.id,
            movimientoReversa.id,
          );
          break;
        }
      }

      consumo.cancelado = true;
      await repoConsumo.save(consumo);

      await queryRunner.manager.update(Producto, idProducto, {
        stockActual: stockNuevo,
      });
    }

    await this.stockService.sincronizarDesdeLotes(queryRunner, idProducto);
  }

  async revertirConsumosDeOrden(
    queryRunner: QueryRunner,
    idOrden: string,
  ): Promise<void> {
    const conceptos = await queryRunner.manager.find(OrdenConcepto, {
      where: { orden: { id: idOrden } },
    });

    for (const concepto of conceptos) {
      await this.revertirPorCancelacionConcepto(queryRunner, concepto.id);
    }
  }

  async ajusteManual(params: AjusteManualParams): Promise<void> {
    const { queryRunner, idProducto, cantidad, observaciones } = params;

    if (cantidad === 0) {
      throw new BadRequestException('La cantidad de ajuste no puede ser cero');
    }

    const producto = await this.bloquearProducto(queryRunner, idProducto);
    const stockAnterior = Number(producto.stockActual);
    const stockNuevo = stockAnterior + cantidad;

    if (stockNuevo < 0) {
      throw new BadRequestException(
        'El ajuste dejaría el stock en negativo',
      );
    }

    const tipo =
      cantidad > 0
        ? EnumTipoMovimientoInventario.ENTRADA
        : EnumTipoMovimientoInventario.SALIDA;

    await this.movimientosService.registrar({
      queryRunner,
      idProducto,
      tipoMovimiento: tipo,
      motivo: EnumMotivoMovimientoInventario.AJUSTE_MANUAL,
      cantidad: Math.abs(cantidad),
      stockAnterior,
      stockNuevo,
      referenciaTabla: 'pri_productos',
      idReferencia: idProducto,
      observaciones,
    });

    await queryRunner.manager.update(Producto, idProducto, {
      stockActual: stockNuevo,
    });
  }

  private async bloquearProducto(
    queryRunner: QueryRunner,
    idProducto: string,
  ): Promise<Producto> {
    const producto = await queryRunner.manager
      .getRepository(Producto)
      .createQueryBuilder('p')
      .setLock('pessimistic_write')
      .where('p.id = :id', { id: idProducto })
      .getOne();

    if (!producto) {
      throw new NotFoundException(`Producto ${idProducto} no encontrado`);
    }

    return producto;
  }
}
