import { SatRegimenFiscal } from './../sat/entities/sat-regimen-fiscal.entity';
import { Module } from '@nestjs/common';
import { EmisoresService } from './emisores.service';
import { EmisoresController } from './emisores.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Emisor } from './entities/emisor.entity';
import { AuthModule } from '../auth/auth.module';
import { CryptoModule } from '../crypto/crypto.module';
import { HttpModule } from '@nestjs/axios';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Emisor, SatRegimenFiscal
    ]),
    AuthModule, CryptoModule, HttpModule
  ],
  controllers: [EmisoresController],
  providers: [EmisoresService],
})
export class EmisoresModule {}
