import { AuthModule } from './../auth/auth.module';
import { SatPais } from './../sat/entities/sat-pais.entity';
import { SatImpuestoPorcentaje } from './../sat/entities/sat-impuesto-porcentaje.entity';
import { SatImpuesto } from './../sat/entities/sat-impuesto.entity';
import { SatFormaPago } from './../sat/entities/sat-forma-pago.entity';
import { SatMetodoPago } from './../sat/entities/sat-metodo-pago.entity';
import { SatTipoComprobante } from './../sat/entities/sat-tipo-comprobante.entity';
import { Compania } from './../companias/entities/compania.entity';
import { SatRegimenFiscal } from './../sat/entities/sat-regimen-fiscal.entity';
import { SatProductoServicio } from './../sat/entities/sat-producto-servicio.entity';
import { SatTipoProductoServicio } from './../sat/entities/sat-tipo-producto-servicio.entity';
import { SatClaveUnidad } from './../sat/entities/sat-clave-unidad.entity';
import { ProductoServicio } from './../productos-servicios/entities/producto-servicio.entity';
import { CompaniaTipoGiro } from './../companias/entities/compania-tipo-giro.entity';
import { Module } from '@nestjs/common';
import { SatService } from './sat.service';
import { SatController } from './sat.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SatCancelacionMotivo } from './entities/sat-cancelacion-motivo.entity';

@Module({
  imports: [ TypeOrmModule.forFeature(
    [ Compania, CompaniaTipoGiro, ProductoServicio, SatClaveUnidad, SatTipoProductoServicio, SatProductoServicio, SatRegimenFiscal,
      SatTipoComprobante, SatMetodoPago, SatFormaPago, SatImpuesto, SatImpuestoPorcentaje, SatPais, SatCancelacionMotivo]), AuthModule ],
  controllers: [SatController],
  providers: [SatService],
  exports: [SatService]
})
export class SatModule {}
