import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PlatformUser } from './entities/platform-user.entity';

@Module({ imports: [TypeOrmModule.forFeature([PlatformUser])], exports: [TypeOrmModule] })
export class PlatformUsersModule {}
