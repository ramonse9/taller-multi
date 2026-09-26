import { SatUsoCFDI } from './../sat/entities/sat-uso-cfdi.entity';
import { SatRegimenFiscal } from './../sat/entities/sat-regimen-fiscal.entity';
import { Module } from '@nestjs/common';
import { EmpresasService } from './empresas.service';
import { EmpresasController } from './empresas.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Empresa } from './entities/empresa.entity';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Empresa, SatRegimenFiscal, SatUsoCFDI
    ]),
    AuthModule
  ],
  controllers: [EmpresasController],
  providers: [EmpresasService],
})
export class EmpresasModule {}
