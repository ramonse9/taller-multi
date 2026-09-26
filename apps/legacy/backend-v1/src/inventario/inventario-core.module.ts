import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { InventarioLote } from './entities/inventario-lote.entity';
import { InventarioMovimiento } from './entities/inventario-movimiento.entity';
import { OrdenConceptoInventario } from './entities/orden-concepto-inventario.entity';
import { InventarioFifoService } from './services/inventario-fifo.service';
import { InventarioMovimientosService } from './services/inventario-movimientos.service';
import { InventarioSnapshotsService } from './services/inventario-snapshots.service';
import { InventarioStockService } from './services/inventario-stock.service';
import { InventarioController } from './inventario.controller';
import { InventarioConsultaService } from './inventario-consulta.service';
import { Producto } from '../productos/entities/producto.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      InventarioLote,
      InventarioMovimiento,
      OrdenConceptoInventario,
      Producto,
    ]),
  ],
  controllers: [InventarioController],
  providers: [
    InventarioFifoService,
    InventarioMovimientosService,
    InventarioSnapshotsService,
    InventarioStockService,
    InventarioConsultaService,
  ],
  exports: [
    InventarioFifoService,
    InventarioMovimientosService,
    InventarioSnapshotsService,
    InventarioStockService,
  ],
})
export class InventarioCoreModule {}
