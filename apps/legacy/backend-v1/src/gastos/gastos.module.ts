import { Module } from '@nestjs/common';
import { GastosService } from './gastos.service';
import { GastosController } from './gastos.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GastoMovimiento } from './entities/gasto_movimiento.entity';
import { Gasto } from './entities/gasto.entity';
import { GastoCategoria } from './entities/gasto_categoria.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Gasto, GastoMovimiento, GastoCategoria])],
  controllers: [GastosController],
  providers: [GastosService],
})
export class GastosModule {}
