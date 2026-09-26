
import { Injectable, UnauthorizedException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { PassportStrategy } from '@nestjs/passport'
import { InjectRepository } from "@nestjs/typeorm";
import { ExtractJwt, Strategy } from "passport-jwt";
import { Repository } from "typeorm";
import { User } from '../entities/user.entity';
import { JwtPayload } from "../interfaces";
import { AuthenticatedUserDto } from "../dto/login-response.dto";

@Injectable()
export class JwtStrategy extends PassportStrategy( Strategy ){

    constructor( 
        @InjectRepository(User) private readonly userRepository: Repository<User> ,
        configService: ConfigService
    ){
        super({
            secretOrKey: configService.get('JWT_ACCESS_SECRET'),
            jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
            issuer: 'multiservicios247-api',
            audience: 'multiservicios247-web',
            ignoreExpiration: false
        })

    }
    
    async validate( payload: JwtPayload ): Promise<AuthenticatedUserDto>{
        
        const { sub } = payload      
        
        const user = await this.userRepository.findOne({
            where: { id: sub },
            select: {
                id: true,        
                password: true,
                fullName: true,
                isActive: true,
                role: true,
                compania: {
                    id: true, 
                    nombre: true,
                    schema: true,
                    isActive: true,
                    moduloInventario: true,
                    moduloFacturacion: true,
                    moduloGastos: true,
                    moduloNomina: true,
                    satTipoPersona: true
                },
                zonaHoraria: true,
                failedLoginAttempts: true,
                lockedUntil: true,
                refreshTokenHash: true,
            },
            relations: ['compania', 'compania.satTipoPersona'],
        });
        
        if(!user){
            throw new UnauthorizedException('Token no válido')
        }
        
        if( !user.isActive ){
            throw new UnauthorizedException('User es inactivo, habla con un administrador')
        }
        
        if( !user.compania ){
            throw new UnauthorizedException('User no tiene company, habla con un administrador')
        }

        if( !user.compania.isActive ){
            throw new UnauthorizedException('Company es inactiva, habla con un administrador')
        }
        
        if( !user.compania.schema ){
            throw new UnauthorizedException('User no tiene schema, habla con un administrador')
        }        
        
        return {
            id: user.id,
            fullName: user.fullName,            
            role: user.role,
            compania: user.compania,
            zonaHoraria: user.zonaHoraria,
        };
    }
    
}
