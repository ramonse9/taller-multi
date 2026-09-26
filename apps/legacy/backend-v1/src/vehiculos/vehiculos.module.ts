import { Module } from '@nestjs/common';
import { VehiculosService } from './vehiculos.service';
import { VehiculosController } from './vehiculos.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Marca } from '../marcas/entities/marca.entity';
import { Modelo } from '../modelos/entities/modelo.entity';
import { Vehiculo } from './entities/vehiculo.entity';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [ TypeOrmModule.forFeature([ Marca, Modelo, Vehiculo ]), AuthModule ],
  controllers: [VehiculosController],
  providers: [VehiculosService],
})
export class VehiculosModule {}
