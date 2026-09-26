import { Module } from '@nestjs/common';
import { DashboardService } from './dashboard.service';
import { DashboardController } from './dashboard.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Orden } from '../ordenes/entities/orden.entity';
import { Vehiculo } from '../vehiculos/entities/vehiculo.entity';
import { Cliente } from '../clientes/entities/cliente.entity';
import { Empresa } from '../empresas/entities/empresa.entity';
import { Marca } from '../marcas/entities/marca.entity';
import { Modelo } from '../modelos/entities/modelo.entity';
import { AuthModule } from '../auth/auth.module';


@Module({
  imports: [ TypeOrmModule.forFeature([Orden, Vehiculo, Cliente, Empresa, Marca, Modelo]), AuthModule ],
  controllers: [DashboardController],
  providers: [DashboardService],
})
export class DashboardModule {}
