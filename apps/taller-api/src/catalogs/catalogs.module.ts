import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { CatalogsController } from './catalogs.controller';

@Module({ imports: [AuthModule], controllers: [CatalogsController] })
export class CatalogsModule {}
