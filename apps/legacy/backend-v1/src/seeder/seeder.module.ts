import { SatUsoCFDI } from './../sat/entities/sat-uso-cfdi.entity';
import { SatUsoCFDIRegimenFiscal } from './../sat/entities/sat-uso-cfdi-regimen-fiscal.entity';
import { SatTipoProductoServicio } from './../sat/entities/sat-tipo-producto-servicio.entity';
import { SatTipoPersona } from './../sat/entities/sat-tipo-persona.entity';
import { SatTipoComprobante } from './../sat/entities/sat-tipo-comprobante.entity';
import { SatRetencionIVA } from './../sat/entities/sat-retencion-iva.entity';
import { SatRetencionISR } from './../sat/entities/sat-retencion-isr.entity';
import { SatRegimenFiscal } from './../sat/entities/sat-regimen-fiscal.entity';
import { SatProductoServicio } from './../sat/entities/sat-producto-servicio.entity';
import { SatPais } from './../sat/entities/sat-pais.entity';
import { SatMetodoPago } from './../sat/entities/sat-metodo-pago.entity';
import { SatFormaPago } from './../sat/entities/sat-forma-pago.entity';
import { SatEstado } from './../sat/entities/sat-estado.entity';
import { SatClaveUnidad } from './../sat/entities/sat-clave-unidad.entity';
import { CompaniaTipoGiro } from './../companias/entities/compania-tipo-giro.entity';
import { Compania } from './../companias/entities/compania.entity';
import { Module } from '@nestjs/common';
import { SeederService } from './seeder.service';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { typeOrmConfig } from '../config/typeorm.config';
import { Marca } from '../marcas/entities/marca.entity';
import { Modelo } from '../modelos/entities/modelo.entity';
import { User } from '../auth/entities/user.entity';
import { TenantModule } from '../tenant/tenant.module';

@Module({
    imports: [
        ConfigModule.forRoot({
            isGlobal: true
        }),
        TypeOrmModule.forRootAsync({
            useFactory: typeOrmConfig,
            inject: [ConfigService]
        }),
        TypeOrmModule.forFeature([
            //Orden, OrdenNotaImagen, OrdenNota, OrdenConcepto, Cliente, Empresa, Vehiculo, ProductoServicio, Emisor, Factura,
            User, Marca, Modelo, Compania, CompaniaTipoGiro, 
            SatClaveUnidad, SatEstado, SatFormaPago, SatMetodoPago, SatPais, SatProductoServicio, SatRegimenFiscal, SatRetencionISR, SatRetencionIVA, 
            SatTipoComprobante, SatTipoPersona, SatTipoProductoServicio, SatUsoCFDIRegimenFiscal, SatUsoCFDI 
        ]),
        TenantModule
    ],    
    providers: [SeederService]
})
export class SeederModule {}
