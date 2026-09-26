import { SatCancelacionMotivo } from './../sat/entities/sat-cancelacion-motivo.entity';
import { SatService } from './../sat/sat.service';
import { Compania } from './../companias/entities/compania.entity';
import { Module } from '@nestjs/common';
import { ProductosServiciosService } from './productos-servicios.service';
import { ProductosServiciosController } from './productos-servicios.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProductoServicio } from './entities/producto-servicio.entity';
import { AuthModule } from '../auth/auth.module';
import { CompaniaTipoGiro } from '../companias/entities/compania-tipo-giro.entity';
import { SatClaveUnidad } from './../sat/entities/sat-clave-unidad.entity';
import { SatProductoServicio } from './../sat/entities/sat-producto-servicio.entity';
import { SatTipoProductoServicio } from './../sat/entities/sat-tipo-producto-servicio.entity';
import { SatRegimenFiscal } from './../sat/entities/sat-regimen-fiscal.entity';
import { SatTipoComprobante } from './../sat/entities/sat-tipo-comprobante.entity';
import { SatMetodoPago } from './../sat/entities/sat-metodo-pago.entity';
import { SatFormaPago } from './../sat/entities/sat-forma-pago.entity';
import { SatPais } from './../sat/entities/sat-pais.entity';
import { SatImpuesto } from './../sat/entities/sat-impuesto.entity';
import { SatImpuestoPorcentaje } from './../sat/entities/sat-impuesto-porcentaje.entity';

@Module({
  imports: [ TypeOrmModule.forFeature(
    [Compania, CompaniaTipoGiro, ProductoServicio, SatClaveUnidad, SatTipoProductoServicio, SatProductoServicio, SatRegimenFiscal,
      SatTipoComprobante, SatMetodoPago, SatFormaPago, SatImpuesto, SatImpuestoPorcentaje, SatPais, SatCancelacionMotivo ]), AuthModule ],
  controllers: [ProductosServiciosController],
  providers: [ProductosServiciosService, SatService],
})
export class ProductosServiciosModule {}
