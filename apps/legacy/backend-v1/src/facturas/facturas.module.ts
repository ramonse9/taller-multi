import { TypeOrmModule } from '@nestjs/typeorm';
import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';

import { Factura } from './entities/factura.entity';
import { AuthModule } from '../auth/auth.module';
import { FacturasService } from './facturas.service';
import { FacturasController } from './facturas.controller';
import { SatImpuestoPorcentaje } from './../sat/entities/sat-impuesto-porcentaje.entity';
import { SatImpuesto } from './../sat/entities/sat-impuesto.entity';
import { Orden } from './../ordenes/entities/orden.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Factura, SatImpuestoPorcentaje, SatImpuesto, Orden
    ]),
    AuthModule, HttpModule
  ],
  controllers: [FacturasController],
  providers: [FacturasService],
})
export class FacturasModule {}