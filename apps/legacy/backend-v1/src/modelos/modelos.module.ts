import { Module } from '@nestjs/common';
import { ModelosService } from './modelos.service';
import { ModelosController } from './modelos.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Marca } from '../marcas/entities/marca.entity';
import { Modelo } from './entities/modelo.entity';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [ TypeOrmModule.forFeature([Modelo, Marca]), AuthModule ],
  controllers: [ModelosController],
  providers: [ModelosService],
})
export class ModelosModule {}
