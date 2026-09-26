import { Module } from '@nestjs/common';
import { ClientesService } from './clientes.service';
import { ClientesController } from './clientes.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Cliente } from './entities/cliente.entity';
import { AuthModule } from '../auth/auth.module';
import { SatUsoCFDI } from './../sat/entities/sat-uso-cfdi.entity';
import { SatRegimenFiscal } from './../sat/entities/sat-regimen-fiscal.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Cliente, SatRegimenFiscal, SatUsoCFDI
    ]),
    AuthModule
  ],
  controllers: [ClientesController],
  providers: [ClientesService],
})
export class ClientesModule {}
