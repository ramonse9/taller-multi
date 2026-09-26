import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { CacheModule } from '@nestjs/cache-manager';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { typeOrmConfig } from './config/typeorm.config';
import { ClientesModule } from './clientes/clientes.module';
import { MarcasModule } from './marcas/marcas.module';
import { ModelosModule } from './modelos/modelos.module';
import { VehiculosModule } from './vehiculos/vehiculos.module';
import { OrdenesModule } from './ordenes/ordenes.module';
import { EmpresasModule } from './empresas/empresas.module';
import { ImageModule } from './image/image.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { AuthModule } from './auth/auth.module';
import { TenantModule } from './tenant/tenant.module';
import { FacturasModule } from './facturas/facturas.module';
import { EmisoresModule } from './emisor/emisores.module';
import { CryptoModule } from './crypto/crypto.module';
import { CompaniasModule } from './companias/companias.module';
import { ProductosServiciosModule } from './productos-servicios/productos-servicios.module';
import { SatModule } from './sat/sat.module';
import { CotizacionesModule } from './cotizaciones/cotizaciones.module';
import { GastosModule } from './gastos/gastos.module';
import { NominaModule } from './nomina/nomina.module';
import { IAModule } from './ia/ia.module';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { InventarioModule } from './inventario/inventario.module';
import { EmpleadosModule } from './empleados/empleados.module';

@Module({
  imports: [
    ThrottlerModule.forRoot([
      {
        ttl: 60000,
        limit: 60
      }
    ]),
    CacheModule.register({
      ttl:3600,
      isGlobal: true
    }),
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: `.env.${process.env.NODE_ENV || 'development'}`,
      ignoreEnvFile: process.env.NODE_ENV === 'production'
    }),    
    TypeOrmModule.forRootAsync({
      useFactory: typeOrmConfig,
      inject: [ConfigService]
    }),    
    ClientesModule, MarcasModule, ModelosModule, VehiculosModule, OrdenesModule, EmpresasModule, ImageModule, DashboardModule, AuthModule, TenantModule, FacturasModule, EmisoresModule, CryptoModule, CompaniasModule, ProductosServiciosModule, SatModule, CotizacionesModule, GastosModule, NominaModule, EmpleadosModule, IAModule,
    InventarioModule,
  ],
  controllers: [AppController],
  providers: [AppService, { provide: APP_GUARD, useClass: ThrottlerGuard  }],
})
export class AppModule {}