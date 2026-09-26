import { EnumPrefijoEntity } from './../commom/enums/general.enum';
import { BadRequestException, Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { Repository, DataSource } from 'typeorm';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';

import { CreateEmisorDto } from './dto/create-emisor.dto';
import { UpdateEmisorDto } from './dto/update-emisor.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Emisor } from './entities/emisor.entity';
//import * as crypto from 'crypto';
//import { encryptData } from '../utils/crypto-utils';
import { User } from '../auth/entities/user.entity';
import { generarEntityId } from '../config/generarEntityId';
import { EmisorResponseDto } from './dto/emisor-response.dto';
import { EmisorAllDto } from './dto/emisor-all.dto';
import { EmisorPaginationDto } from './dto/emisor-pagination.dto';
import { CryptoService } from '../crypto/crypto.service';
import { ConfigService } from '@nestjs/config';
//import { url } from 'inspector';
import * as forge from 'node-forge';
import { SatRegimenFiscal } from './../sat/entities/sat-regimen-fiscal.entity';
import { ApiFactura } from './../facturas/facturas.service';
import { Response } from 'express';

interface ValidationResult {
  valid: boolean;
  rfc: string;
  razonSocial: string,
  notBefore: Date;
  notAfter: Date;
}

/*interface ApiFactura {
  url: string,
  clientId: string,
  token: string
}*/

interface RespuestaGuardadoPAC {
  Codigo: number,
  Mensaje: string,
  Categoria: string | null,
  CodigoSat: string,
  MensajeSat: string | null ,
  Valores: string | null
}

/*interface BodyCreateEmisorPAC {
  RfcEmisor: string,
  Base64Cer: string,
  Base64Key: string,
  Contrasena: string
}*/

@Injectable()
export class EmisoresService {

  constructor(
    private readonly cryptoService: CryptoService,
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
    @InjectRepository(SatRegimenFiscal) private readonly satRegimenFiscalRepository: Repository<SatRegimenFiscal>,
    private dataSource: DataSource
  ){}

  async getOne( user: User){

    const schema = user.compania.schema;
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();

    try{

      await queryRunner.query(`SET search_path TO ${schema}, public`);

      const repoEmisor = queryRunner.manager.getRepository(Emisor);

      const query = repoEmisor.createQueryBuilder('emisor')
      query.leftJoinAndSelect('emisor.satRegimenFiscal', 'satRegimenFiscal')

      query.andWhere(
        `emisor.is_active = true`
      )

      query.orderBy(`emisor.id`, 'DESC')      

      const data = await query.getOne()

      if (!data) {       
        throw new NotFoundException('No se encontró algún emisor activo, favor de contactar al Administrador.');
      }

      return {
        rfc: data.rfc, 
        razonSocial: data.razonSocial,
        satRegimenFiscal: data.satRegimenFiscal,
        codigoPostal: data.codigoPostal,
        validFrom: data.validFrom,
        validTo: data.validTo,
        updatedAt: data.updatedAt
      }

    }catch(error){

       if( error instanceof BadRequestException){
        throw error
      }

      if(error instanceof NotFoundException){
        throw error
      }
      
      throw new InternalServerErrorException('Ocurrió un error inesperado al obtener al Emisor')

    }finally{
      await queryRunner.release();
    }

  }

  async getPaginado( page: number, limit: number, fSearch: string, user: User ) {
    
    const schema = user.compania.schema;

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect()

    try{

      await queryRunner.query(`SET search_path TO ${schema}, public`);

      const repoEmisor = queryRunner.manager.getRepository(Emisor);
    
      const querySkip = repoEmisor.createQueryBuilder('emisor')
      querySkip.select('emisor.id')
      querySkip.orderBy(`emisor.id`, 'DESC')
      const offset = (page - 1) * limit;
      querySkip.skip(offset).take(limit)
      
      const query = repoEmisor.createQueryBuilder('emisor')

      query.orderBy('emisor.id', 'DESC')    
    
      const [ data, totalItems] = await query.getManyAndCount()    

      return {
        count: totalItems,
        pages: Math.ceil( totalItems / limit ),
        emisores: data
      }

    }finally{
      await queryRunner.release();
    }
  }
  
  /*
  async createEmisorCompleto(  updateEmisorDto: UpdateEmisorDto, user: User, cerBuffer: Buffer, keyBuffer: Buffer ){

    const schema = user.compania.schema;

    const queryRunner = this.dataSource.createQueryRunner();

    await queryRunner.connect();

    await queryRunner.startTransaction();

    let info: ValidationResult;

    try{ 

    
      //TODO
      info = this.validateAndExtractBuffer(
        cerBuffer,
        keyBuffer,
        updateEmisorDto.contrasena
      )
      
      if( info.rfc.slice(0,10) !== updateEmisorDto.rfc.slice(0,10) ){
       
        throw new BadRequestException(`El RFC ingresado no coincide con los archivos.` )
      }
      
      if( info.razonSocial != updateEmisorDto.razonSocial ){
    
        throw new BadRequestException(`La Razón Social ingresada no coincide con los archivos.` )
      }     

      const emisorGuardadoPAC: RespuestaGuardadoPAC = await this.createEmisorPAC( updateEmisorDto, cerBuffer, keyBuffer );

      //TODO
      if( emisorGuardadoPAC.Codigo !== 200  ){
        throw new BadRequestException(`Error al registrar el emisor en el PAC: ${emisorGuardadoPAC.Mensaje || 'Error desconocido'}`);
      }

    
      
      await queryRunner.query(`SET search_path TO ${schema}, public`);
      
      const { encrypted: cerFileEncrypted, iv: cerFileIV } = this.cryptoService.encryptData(cerBuffer);
      const { encrypted: keyFileEncrypted, iv: keyFileIV } = this.cryptoService.encryptData(keyBuffer);
      const { encrypted: passwordEncrypted, iv: passwordIV } = this.cryptoService.encryptData( updateEmisorDto.contrasena );

      const repoEmisor = queryRunner.manager.getRepository(Emisor)

      const nuevoId = await generarEntityId( repoEmisor, EnumPrefijoEntity.EMISORES )

      const emisor = repoEmisor.create({
        id: nuevoId,
        rfc: updateEmisorDto.rfc,
        razonSocial: updateEmisorDto.razonSocial,
        //usoCFDI: updateEmisorDto.usoCFDI,
        claveSatRegimenFiscal: updateEmisorDto.regimenFiscal,
        codigoPostal: updateEmisorDto.codigoPostal,
        cerFileEncrypted,
        keyFileEncrypted,
        passwordEncrypted,
        cerFileIV,
        keyFileIV,
        passwordIV,   
        validFrom: info.notBefore,
        validTo: info.notAfter,
        usuario: user,        
        createdAtUser: user,
        updatedAtUser: user
      });

      const emisorGuardadoBD = await repoEmisor.save(emisor);

      await queryRunner.commitTransaction()

      return {

        rfc: emisorGuardadoBD.rfc,
        razon_social: emisorGuardadoBD.razonSocial,
        id: emisorGuardadoBD.id

      }

    }catch(error){

      await queryRunner.rollbackTransaction();

      if(error instanceof NotFoundException ){
        throw error
      }

      if(error instanceof BadRequestException){
        throw error
      }

      throw new InternalServerErrorException(`Ocurrió un error inesperado al intentar guardar al Emisor: ${error}`)

    }finally{
      await queryRunner.release()
    }

  }
  */
  
  async createEmisor( createEmisorDto: CreateEmisorDto, user: User ){

    const schema = user.compania.schema;

    const queryRunner = this.dataSource.createQueryRunner();

    await queryRunner.connect();

    await queryRunner.startTransaction();

    //let info: ValidationResult;

    try{ 

      // Validar que los archivos, password, rfc y fechas esten correctas
      //TODO
      /*info = this.validateAndExtractBuffer(
        cerBuffer,
        keyBuffer,
        createEmisorDto.contrasena_key
      )*/
      
      /*if( info.rfc.slice(0,10) !== createEmisorDto.rfc.slice(0,10) ){
      
        throw new BadRequestException(`El RFC ingresado no coincide con los archivos.` )
      }
      
      if( info.razonSocial != createEmisorDto.razon_social ){
       
        throw new BadRequestException(`La Razón Social ingresada no coincide con los archivos.` )
      }     

      const emisorGuardadoPAC: RespuestaGuardadoPAC = await this.createEmisorPAC( createEmisorDto, cerBuffer, keyBuffer );
      */

      //TODO
      /*if( emisorGuardadoPAC.Codigo !== 200  ){
        throw new BadRequestException(`Error al registrar el emisor en el PAC: ${emisorGuardadoPAC.Mensaje || 'Error desconocido'}`);
      }*/

      //controlar errores emisorGuardadoPAC
      
      await queryRunner.query(`SET search_path TO ${schema}, public`);
      
      /*const { encrypted: cerFileEncrypted, iv: cerFileIV } = this.cryptoService.encryptData(cerBuffer);
      const { encrypted: keyFileEncrypted, iv: keyFileIV } = this.cryptoService.encryptData(keyBuffer);
      const { encrypted: passwordEncrypted, iv: passwordIV } = this.cryptoService.encryptData( createEmisorDto.contrasena_key );
      */

      const satRegimenFiscal = await this.satRegimenFiscalRepository.findOne({
        where: { clave: createEmisorDto.claveSatRegimenFiscal}
      })

      if( !satRegimenFiscal ){
        throw new NotFoundException('Regimen Fiscal no encontrado')
      }

      /*const satUsoCFDI = await this.satUsoCFDIRepository.findOne({
        where: { clave: createEmisorDto.claveSatUsoCFDI }
      })

      if( !satUsoCFDI ){
        throw new NotFoundException('Uso CFDI no encontrado')
      }*/

      const repoEmisor = queryRunner.manager.getRepository(Emisor)

      const nuevoId = await generarEntityId( repoEmisor, EnumPrefijoEntity.EMISORES );

      const emisor = repoEmisor.create({
        id: nuevoId,
        rfc: createEmisorDto.rfc,
        razonSocial: createEmisorDto.razonSocial,
        //satRegimenFiscal: createEmisorDto.claveSatRegimenFiscal,
        codigoPostal: createEmisorDto.codigoPostal,
        satRegimenFiscal: satRegimenFiscal,
        usuario: user,        
        createdAtUser: user,
        updatedAtUser: user
      });
      
      //usoCFDI: createEmisorDto.usoCFDI,
      //cerFileEncrypted,
      //keyFileEncrypted,
      //passwordEncrypted,
      //cerFileIV,
      //keyFileIV,
      //passwordIV,   
      //validFrom: info.notBefore,
      //validTo: info.notAfter,
      const emisorGuardadoBD = await repoEmisor.save(emisor);

      await queryRunner.commitTransaction()

      return {

        rfc: emisorGuardadoBD.rfc,
        razonSocial: emisorGuardadoBD.razonSocial,
        id: emisorGuardadoBD.id


      }

    }catch(error){

      await queryRunner.rollbackTransaction();

      if(error instanceof NotFoundException ){
        throw error
      }

      if(error instanceof BadRequestException){
        throw error
      }

      throw new InternalServerErrorException(`Ocurrió un error inesperado al intentar guardar al Emisor: ${error}`)

    }finally{
      await queryRunner.release()
    }

  }

  async updateArchivos( updateEmisorDto: UpdateEmisorDto, user: User, cerBuffer: Buffer, keyBuffer: Buffer ){

    const schema = user.compania.schema;

    const queryRunner = this.dataSource.createQueryRunner();

    await queryRunner.connect();

    await queryRunner.startTransaction();

    let info: ValidationResult;

    try{ 

      // Validar que los archivos, password, rfc y fechas esten correctas
      info = this.validateAndExtractBuffer(
        cerBuffer,
        keyBuffer,
        updateEmisorDto.contrasena
      )

      if( info.rfc.toLowerCase() !== updateEmisorDto.rfc.toLowerCase() ){
    
        throw new BadRequestException(`El RFC ingresado no coincide con los archivos.` )
      }
      
      if( info.razonSocial.toLowerCase() != updateEmisorDto.razonSocial.toLowerCase() ){
     
        throw new BadRequestException(`La Razón Social ingresada no coincide con los archivos.` )
      }      
     
      

      
              //throw new BadRequestException(`Error TEST`);
      
      //TODO
      //@follow-up
      //const emisorGuardadoPAC: RespuestaGuardadoPAC = await this.createEmisorPAC( updateEmisorDto, cerBuffer, keyBuffer );      
      
      
      await queryRunner.query(`SET search_path TO ${schema}, public`);
      
      const { encrypted: cerFileEncrypted, iv: cerFileIV } = this.cryptoService.encryptData(cerBuffer);
      const { encrypted: keyFileEncrypted, iv: keyFileIV } = this.cryptoService.encryptData(keyBuffer);
      const { encrypted: passwordEncrypted, iv: passwordIV } = this.cryptoService.encryptData( updateEmisorDto.contrasena );

      const repoEmisor = queryRunner.manager.getRepository(Emisor)

      const emisor = await repoEmisor.findOneBy({rfc: updateEmisorDto.rfc.toLowerCase() })

      if(!emisor){
        throw new NotFoundException(`El Emisor con el RFC: ${ updateEmisorDto.rfc.toUpperCase() } no fué encontrado`)
      }

      await repoEmisor.update( {rfc: updateEmisorDto.rfc.toLowerCase()}, { 
        cerFileEncrypted: cerFileEncrypted,
        keyFileEncrypted: keyFileEncrypted, 
        passwordEncrypted: passwordEncrypted,
        cerFileIV: cerFileIV,
        keyFileIV: keyFileIV,
        passwordIV: passwordIV,
        validFrom: info.notBefore,
        validTo: info.notAfter,
        updatedAtUser: user
      })

      await queryRunner.commitTransaction()

      return {

        rfc: updateEmisorDto.rfc,
        razon_social: updateEmisorDto.razonSocial,        

      }

    }catch(error: any){

      await queryRunner.rollbackTransaction();

      if( error?.Mensaje ){
        throw new BadRequestException(`Error al registrar el emisor en el PAC: ${ error.Mensaje} `);
      }

      if(error instanceof NotFoundException ){
        throw error
      }

      if(error instanceof BadRequestException){        
        throw error
      }

      throw new InternalServerErrorException(`Ocurrió un error inesperado al intentar guardar al Emisor: ${error}`)

    }finally{
      await queryRunner.release()
    }

  }

  async createEmisorPAC( updateEmisorDto: UpdateEmisorDto, cerBuffer: Buffer, keyBuffer: Buffer){

    const body = {
      "RfcEmisor": updateEmisorDto.rfc,
      "Base64Cer": cerBuffer.toString('base64'),
      "Base64Key": keyBuffer.toString('base64'),
      "Contrasena": updateEmisorDto.contrasena
    }

    const apiFactura: ApiFactura = {
      url: '',
      clientId: '',
      token: ''
    }
      
    if( this.configService.get<string>('STAGE') === 'dev' ){
      apiFactura.url = this.configService.get<string>('TECH_API_URL_DEV')
      apiFactura.clientId = this.configService.get<string>('TECH_X_CLIENT_ID_DEV')
      apiFactura.token = this.configService.get<string>('TECH_API_TOKEN_DEV')
    }else{
      apiFactura.url = this.configService.get<string>('TECH_API_URL_DEV')
      apiFactura.clientId = this.configService.get<string>('TECH_X_CLIENT_ID_DEV')
      apiFactura.token = this.configService.get<string>('TECH_API_TOKEN_DEV')
    }

    let emisorGuardadoPAC: RespuestaGuardadoPAC;

    try{
      
      const respuesta =  await firstValueFrom( this.httpService.post<RespuestaGuardadoPAC>( `${apiFactura.url}/v1/compatibilidad/${apiFactura.clientId}/RegistraEmisor`, body ) );
 

      emisorGuardadoPAC = respuesta.data

      return emisorGuardadoPAC   
    
    }catch(error: any){

      const data = error?.response?.data      

      if( data ){

        throw{

          Mensaje: data.Mensaje,
          Codigo: data.Codigo,
          Categoria: '',
          CodigoSat: '',
          MensajeSat: '',
          Valores: ''
        }

        /*return {
          Mensaje: data.Mensaje || 'Error desconocido al registrar al emisor',
          Codigo: data.Codigo || '500',
          Categoria: '',
          CodigoSat: '',
          MensajeSat: '',
          Valores: ''
        }*/

      }else{        

        throw error;

      }
    }

  } 
  
  validateAndExtractBuffer(
    cerBuffer: Buffer,
    keyBuffer: Buffer,
    password: string,
  ): ValidationResult {
    try {
      //
      // 1) Convertir cerBuffer a “binary” y parsear certificado (.cer)
      //
      //    - cerBuffer ya es un Buffer con los bytes DER del .cer.
      //    - .toString('binary') arroja un string donde cada carácter
      //      representa un byte. Forge puede convertirlo a ASN.1 directo.
      //
      //
      // 1) Procesar el certificado (.cer)
      //
      const certAsn1 = forge.asn1.fromDer(forge.util.createBuffer(cerBuffer.toString('binary')));
      const certificate = forge.pki.certificateFromAsn1(certAsn1);

      //
      // 2) Detectar y desencriptar la llave privada (.key)
      //
      let privateKey: forge.pki.PrivateKey | null = null;

      const keyAsString = keyBuffer.toString(); // Detectar si tiene encabezado PEM

     


      if (keyAsString.includes('-----BEGIN')) {
        // Caso: llave en formato PEM
        try {
          privateKey = forge.pki.decryptRsaPrivateKey(keyAsString, password);
        } catch (e) {
          throw new Error('PASSWORD_INCORRECT_OR_KEY_NOT_PEM');
        }
      } else {
        // Caso: llave en formato DER (PKCS#8 cifrado)
        try {
          const forgeBuffer = forge.util.createBuffer(keyBuffer.toString('binary'));
          const asn1 = forge.asn1.fromDer(forgeBuffer);
          const decryptedKeyInfo = forge.pki.decryptPrivateKeyInfo(asn1, password);

          if (!decryptedKeyInfo) {
            throw new Error('PASSWORD_INCORRECT_OR_KEY_NOT_PKCS8');
          }

          privateKey = forge.pki.privateKeyFromAsn1(decryptedKeyInfo);
        } catch (e) {
          throw new Error('PASSWORD_INCORRECT_OR_KEY_NOT_PKCS8');
        }
      }    

      //
      // 3) Comparar la clave pública del certificado vs. la pública de la clave privada
      //
      const publicKeyFromCert = certificate.publicKey as forge.pki.rsa.PublicKey;
      const publicKeyFromPriv = forge.pki.setRsaPublicKey(
        (privateKey as any).n,
        (privateKey as any).e,
      );

      const keysMatch =
        publicKeyFromCert.n.equals((publicKeyFromPriv as forge.pki.rsa.PublicKey).n) &&
        publicKeyFromCert.e.equals((publicKeyFromPriv as forge.pki.rsa.PublicKey).e);

      if (!keysMatch) {
        throw new Error('KEY_MISMATCH');
      }

      //
      // 4) Extraer RFC (Common Name) y fechas de vigencia (notBefore / notAfter)
      //
      //console.log("certificate.subject.attributes: ", certificate.subject.attributes )

      //const cnAttributeSerialNumber = certificate.subject.attributes.find(
      //  (attr) => attr.name === 'serialNumber',
      //);
      //const rfc = cnAttributeSerialNumber?.value?.toString().trim();
      const cnAttributeRFC = certificate.subject.attributes.find(
        (attr) => attr.type === '2.5.4.45',
      );
      const rfc = cnAttributeRFC?.value?.toString().trim();
      if (!rfc) {
        throw new Error('RFC_NOT_FOUND');
      }

      const cnAttribute = certificate.subject.attributes.find(
        (attr) => attr.name === 'commonName',
      );
      const razonSocial = cnAttribute?.value?.toString().trim();
      if (!razonSocial) {
        throw new Error('COMMON_NAME_NOT_FOUND');
      }

      const notBefore: Date = certificate.validity.notBefore;
      const notAfter: Date  = certificate.validity.notAfter;
      const now = new Date();
      
      if (now < notBefore) {
        throw new BadRequestException('El certificado aún no es válido (vigencia futura).');
      }

      if (now > notAfter) {
        throw new BadRequestException('El certificado ha expirado.');
      }

      return {
        valid: true,
        rfc: rfc,
        razonSocial: razonSocial, 
        notBefore,
        notAfter,
      };
    } catch (error) {
      //
      // Mapear errores internos a BadRequestException con mensajes claros
      //
      if ((error as Error).message === 'PASSWORD_INCORRECT_OR_KEY_NOT_PKCS8') {
        throw new BadRequestException(
          'El password es incorrecto o la .key no está en formato PKCS#8 cifrado.',
        );
      } else if ((error as Error).message === 'KEY_MISMATCH') {
        throw new BadRequestException(
          'El certificado (.cer) y la clave privada (.key) no coinciden entre sí.',
        );
      } else if ((error as Error).message === 'COMMON_NAME_NOT_FOUND') {
        throw new BadRequestException(
          'No se pudo extraer la Razon Social (Common Name) del certificado.',
        );
      } else if ((error as Error).message === 'SERIAL_NUMBER_NOT_FOUND') {
        throw new BadRequestException(
          'No se pudo extraer el RFC (Serial Number) del certificado.',
        );
      } else if( (error as Error).message === 'RFC_NOT_FOUND'){
        throw new BadRequestException(
          'No se pudo extraer el RFC del certificado.',
          );      
      };

      // Cualquier otro error de parsing lo devolvemos genérico:
      throw new BadRequestException(
        `Error validando certificado y clave: ${(error as Error).message}`,
      );
    }
  }


}