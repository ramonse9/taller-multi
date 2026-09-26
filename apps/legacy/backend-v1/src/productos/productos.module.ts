import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../auth/auth.module';
import { SatModule } from '../sat/sat.module';
import { Producto } from './entities/producto.entity';
import { ProductosController } from './productos.controller';
import { ProductosService } from './productos.service';
import { SatService } from '../sat/sat.service';

@Module({
  imports: [TypeOrmModule.forFeature([Producto]), AuthModule, SatModule],
  controllers: [ProductosController],
  providers: [ProductosService ],
  exports: [ProductosService],
})
export class ProductosModule {}
