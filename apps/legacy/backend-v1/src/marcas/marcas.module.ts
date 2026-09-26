import { Module } from '@nestjs/common';
import { MarcasService } from './marcas.service';
import { MarcasController } from './marcas.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Marca } from './entities/marca.entity';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [ 
    TypeOrmModule.forFeature([
      Marca
    ]),
    AuthModule
  ],
  controllers: [MarcasController],
  providers: [MarcasService],
})
export class MarcasModule {}
