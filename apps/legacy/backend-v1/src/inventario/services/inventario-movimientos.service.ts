import { Injectable } from '@nestjs/common';
import { QueryRunner } from 'typeorm';
import {
  EnumMotivoMovimientoInventario,
  EnumPrefijoEntity,
  EnumTipoMovimientoInventario,
} from '../../commom/enums/general.enum';
import { generarEntityId } from '../../config/generarEntityId';
import { InventarioMovimiento } from '../entities/inventario-movimiento.entity';
import { InventarioLote } from '../entities/inventario-lote.entity';
import { Producto } from '../../productos/entities/producto.entity';

export interface RegistrarMovimientoParams {
  queryRunner: QueryRunner;
  idProducto: string;
  idLote?: string;
  tipoMovimiento: EnumTipoMovimientoInventario;
  motivo: EnumMotivoMovimientoInventario;
  cantidad: number;
  stockAnterior: number;
  stockNuevo: number;  
  referenciaTabla?: string;
  idReferencia?: string;
  observaciones?: string;
}

@Injectable()
export class InventarioMovimientosService {
  async registrar(
    params: RegistrarMovimientoParams,
  ): Promise<InventarioMovimiento> {
    const repo = params.queryRunner.manager.getRepository(InventarioMovimiento);
    const nuevoId = await generarEntityId(
      repo,
      EnumPrefijoEntity.INVENTARIOMOVIMIENTOS,
    );

    const movimiento = repo.create({
      id: nuevoId,
      producto: { id: params.idProducto } as Producto,
      lote: params.idLote
        ? ({ id: params.idLote } as InventarioLote)
        : undefined,
      tipoMovimiento: params.tipoMovimiento,
      motivoMovimiento: params.motivo,
      cantidad: params.cantidad,
      stockAnterior: params.stockAnterior,
      stockNuevo: params.stockNuevo,
      referenciaTabla: params.referenciaTabla,
      idReferencia: params.idReferencia,
      observaciones: params.observaciones,
      cancelado: false,
    });

    return await repo.save(movimiento);
  }

  async marcarCanceladoConReversa(
    queryRunner: QueryRunner,
    idMovimientoOriginal: string,
    idMovimientoReversa: string,
  ): Promise<void> {
    await queryRunner.manager.update(InventarioMovimiento, idMovimientoOriginal, {
      cancelado: true,
      movimientoReversa: { id: idMovimientoReversa } as InventarioMovimiento,
    });
  }
}
