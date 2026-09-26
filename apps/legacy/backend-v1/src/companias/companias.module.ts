import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CompaniasService } from './companias.service';
import { CompaniasController } from './companias.controller';
import { TenantModule } from '../tenant/tenant.module';
import { AuthModule } from '../auth/auth.module';
import { SatRetencionIVA } from '../sat/entities/sat-retencion-iva.entity';
import { SatRetencionISR } from '../sat/entities/sat-retencion-isr.entity';
import { SatTipoPersona } from '../sat/entities/sat-tipo-persona.entity';
import { Compania } from './entities/compania.entity';
import { CompaniaTipoGiro } from './entities/compania-tipo-giro.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Compania, CompaniaTipoGiro, SatTipoPersona, SatRetencionISR, SatRetencionIVA]),
    TenantModule, AuthModule
  ],
  controllers: [CompaniasController],
  providers: [CompaniasService],
})
export class CompaniasModule {}
