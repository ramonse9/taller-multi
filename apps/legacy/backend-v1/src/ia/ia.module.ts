import { Module } from "@nestjs/common";
import { AuthModule } from '../auth/auth.module';
import { IAController } from "./ia.controller";
import { IAService } from "./ia.service";
import { Modelo } from '../modelos/entities/modelo.entity';
import { TypeOrmModule } from "@nestjs/typeorm";

@Module({
    imports: [
        TypeOrmModule.forFeature([Modelo]),
        AuthModule,
    ],
    controllers: [ IAController ],
    providers: [ IAService ]
})
export class IAModule{}