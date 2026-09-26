import { EnumPrefijoEntity } from './../commom/enums/general.enum';
import { generarEntityId } from './../config/generarEntityId';
import { ZonaHoraria } from './entities/zona-horaria.entity';
import { BadRequestException, Injectable, InternalServerErrorException, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';

import * as bcrypt from 'bcrypt';

import { User } from './entities/user.entity';
import { LoginUserDto, CreateUserDto } from './dto';
import { JwtPayload } from './interfaces';
import { TenantService } from '../tenant/tenant.service';
import { Compania } from '../companias/entities/compania.entity';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AuthService {

  constructor(
    @InjectRepository(User) private readonly userRepository: Repository<User>,
    private readonly jwtService: JwtService,
    private readonly tenantService: TenantService,
    private readonly dataSource: DataSource,
    private readonly configService: ConfigService
    
  ){}

  private async ensureMinResponseTime(
    start: number,
  ) {

    const MIN_RESPONSE_TIME = 2500;

    const elapsed = Date.now() - start;

    if (elapsed < MIN_RESPONSE_TIME) {

      await new Promise((res) =>
        setTimeout(res, MIN_RESPONSE_TIME - elapsed),
      );
    }
  }
  
  async create(createUsuarioDto: CreateUserDto) {
              
     const queryRunner = this.dataSource.createQueryRunner();
     await queryRunner.connect()

     await queryRunner.startTransaction();
 
     try{

       const { password, ...userData} = createUsuarioDto;
 
       const repoUsuario = queryRunner.manager.getRepository( User );
       
       const nuevoId = await generarEntityId(repoUsuario, EnumPrefijoEntity.USUARIOS)
 
       const nuevoUsuario = repoUsuario.create({
        id: nuevoId,
        password: await bcrypt.hash( password, 10 ),
        compania: { id: 'com000001'} as Compania,
        zonaHoraria: { clave: 'America/Mazatlan'} as ZonaHoraria,
        ...userData,
       })   
       
       await repoUsuario.save( nuevoUsuario )   
 
       const usuarioGuardado = await repoUsuario.findOne({
         where: { id: nuevoId},         
       })

       await queryRunner.commitTransaction();
 
       return this.information( usuarioGuardado );
       
     }catch(error){   
      
       await queryRunner.rollbackTransaction();
 
       if( error instanceof NotFoundException ){
         throw error
       }
     
       if( error instanceof BadRequestException){
         throw error
       }
        
       throw new InternalServerErrorException('Ocurrió un error inesperado al crear un Usuario')
     }finally{
       await queryRunner.release()
     }
 
  }

  async login(loginUserDto: LoginUserDto) {

    const { email, password } = loginUserDto;

    const start = Date.now();

    const MAX_FAILED_ATTEMPTS = 5;
    const LOCK_TIME_MINUTES = 15;

    const fakeHash =
      '$2b$10$CwTycUXWue0Thq9StjUM0uJ8J5YhXz2u9G$5x5kH1sZxYq9eR9yZK';

    const user = await this.userRepository.findOne({
      where: { email },
      select: {
        id: true,        
        password: true,
        fullName: true,
        isActive: true,
        role: true,
        compania: {
          id: true, 
          nombre: true,        
        },
        zonaHoraria: true,
        failedLoginAttempts: true,
        lockedUntil: true,
        refreshTokenHash: true,
      },
      relations: {
        compania: true
      }
    });   
    
    if (!user) {

      await this.ensureMinResponseTime(
        start
      );

      throw new UnauthorizedException('Credenciales inválidas');
    }

    if (
      user?.lockedUntil &&
      user.lockedUntil > new Date()
    ) {

      await this.ensureMinResponseTime(
        start
      );

      throw new UnauthorizedException(
        'Credenciales inválidas'
      );
    }

    if (!user.isActive) {

      await this.ensureMinResponseTime(
        start
      );

      throw new UnauthorizedException(
        'Credenciales inválidas'
      );
    }

    const passwordIsValid = await bcrypt.compare(
      password,
      user?.password ?? fakeHash
    );
    
    if (!passwordIsValid) {

      const attempts = user.failedLoginAttempts + 1;

      const updateData: Partial<User> = {
        failedLoginAttempts: attempts,
      };
     
      if (attempts >= MAX_FAILED_ATTEMPTS) {

        const lockedUntil = new Date();

        lockedUntil.setMinutes(
          lockedUntil.getMinutes() + LOCK_TIME_MINUTES
        );

        updateData.lockedUntil = lockedUntil;
      }

      await this.userRepository.update(user.id, updateData);

      await this.ensureMinResponseTime(
        start
      );

      throw new UnauthorizedException('Credenciales inválidas');
    }
    
    const payload: JwtPayload = {
      sub: user.id,
      role: user.role,
      companiaId: user.compania.id,
    };
    
    const accessToken = this.jwtService.sign(payload, {
      secret: this.configService.get('JWT_ACCESS_SECRET'),
      expiresIn: this.configService.get('JWT_ACCESS_EXPIRES_IN'),
    });

    const refreshToken = this.jwtService.sign(payload, {
      secret: this.configService.get('JWT_REFRESH_SECRET'),
      expiresIn: this.configService.get('JWT_REFRESH_EXPIRES_IN'),
    });
    
    const refreshTokenHash = await bcrypt.hash(refreshToken, 10);
    
    await this.userRepository.update(user.id, {
      failedLoginAttempts: 0,
      lockedUntil: null,
      refreshTokenHash,
    });
    
    delete user.password;

    return {
      user: {
        id: user.id,
        fullName: user.fullName,        
        role: user.role,
        compania: {
          id: user.compania.id,
          nombre: user.compania.nombre,
          moduloInventario: user.compania.moduloInventario,
          moduloFacturacion: user.compania.moduloFacturacion,
          moduloGastos: user.compania.moduloGastos,
          moduloNomina: user.compania.moduloNomina
        },
        zonaHoraria: user.zonaHoraria,
      },
      accessToken,
      refreshToken,
    };
  }
  
  async checkAuthStatus( user: User){

    return this.information(user)    
    
  }

  information(user: User){
    
    return {
      user:{
        id: user.id,
        fullName: user.fullName,
        role: user.role,
        compania: {
          id: user.compania.id,
          nombre: user.compania.nombre,
          moduloInventario: user.compania.moduloInventario,
          moduloFacturacion: user.compania.moduloFacturacion,
          moduloGastos: user.compania.moduloGastos,
          moduloNomina: user.compania.moduloNomina
        },
        zonaHoraria: {
          clave: user.zonaHoraria.clave,
          descripcion: user.zonaHoraria.descripcion
        }
      },    
    }
  }

  async refresh(refreshToken: string) {

    if (!refreshToken) {
      throw new UnauthorizedException('Refresh token requerido');
    }

    try {

      const payload = this.jwtService.verify(refreshToken, {
        secret: this.configService.get('JWT_REFRESH_SECRET'),
      });

      const user = await this.userRepository.findOne({
        where: {
          id: payload.sub,
        },
        select: {
          id: true,
          isActive: true,
          role: true,
          refreshTokenHash: true,
        },
        relations: ['compania', 'zonaHoraria'],
      });

      if (!user || !user.refreshTokenHash) {
        throw new UnauthorizedException('Access denied');
      }

      if (!user.isActive) {
        throw new UnauthorizedException('Usuario inactivo');
      }

      const refreshTokenMatches = await bcrypt.compare(
        refreshToken,
        user.refreshTokenHash,
      );

      if (!refreshTokenMatches) {
        throw new UnauthorizedException('Access denied');
      }

      const newPayload: JwtPayload = {
        sub: user.id,
        role: user.role,
        companiaId: user.compania.id,
      };

      const accessToken = this.jwtService.sign(newPayload, {
        secret: this.configService.get('JWT_ACCESS_SECRET'),
        expiresIn: this.configService.get('JWT_ACCESS_EXPIRES_IN'),
      });

      const nuevoRefreshToken = this.jwtService.sign(newPayload, {
        secret: this.configService.get('JWT_REFRESH_SECRET'),
        expiresIn: this.configService.get('JWT_REFRESH_EXPIRES_IN'),
      });

      const newRefreshTokenHash = await bcrypt.hash(nuevoRefreshToken, 10);

      await this.userRepository.update(user.id, {
        refreshTokenHash: newRefreshTokenHash,
      });

      return {
        accessToken,
        refreshToken: nuevoRefreshToken
      };

    } catch (error) {

      throw new UnauthorizedException('Refresh token inválido');

    }
  }

  async logout(userId: string){
    await this.userRepository.update( userId, {
      refreshTokenHash: null
    });

    return true;

  }

  async changePassword(
    userId: string,
    currentPassword: string,
    newPassword: string
  ) {

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {

      const repo = queryRunner.manager.getRepository(User);

      const user = await repo.findOne({
        where: { id: userId },
        select: { id: true, password: true }
      });

      if (!user) throw new NotFoundException('Usuario no encontrado');

      const isMatch = await bcrypt.compare(currentPassword, user.password);

      if (!isMatch) {
        throw new BadRequestException('La contraseña actual es incorrecta');
      }

      const hashedPassword = await bcrypt.hash(newPassword, 10);

      await repo.update(userId, { 
        password: hashedPassword, 
        refreshTokenHash: null,
        failedLoginAttempts: 0,
        lockedUntil: null,
      });

      await queryRunner.commitTransaction();

      return { message: 'Contraseña actualizada correctamente' };

    } catch (error) {

      await queryRunner.rollbackTransaction();
      throw error;

    } finally {
      await queryRunner.release();
    }
    
  }

}
