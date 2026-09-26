import { Module } from '@nestjs/common';
import { OrdenesService } from './ordenes.service';
import { OrdenesController } from './ordenes.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Vehiculo } from '../vehiculos/entities/vehiculo.entity';
import { Cliente } from '../clientes/entities/cliente.entity';
import { Orden } from './entities/orden.entity';
import { OrdenNota } from './entities/orden_nota.entity';
import { Empresa } from '../empresas/entities/empresa.entity';
import { CloudinaryService } from '../image/cloudinary.service';
import { ImageService } from '../image/image.service';
import { AuthModule } from '../auth/auth.module';
import { InventarioCoreModule } from '../inventario/inventario-core.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Vehiculo, Cliente, Orden, OrdenNota, Empresa]),
    AuthModule,
    InventarioCoreModule,
  ],
  controllers: [OrdenesController],
  providers: [OrdenesService, CloudinaryService, ImageService],
})
export class OrdenesModule {}
