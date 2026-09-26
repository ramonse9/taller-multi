import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import * as crypto from 'crypto';
//import { encryptData } from '../utils/crypto-utils';

@Injectable()
export class CryptoService {

    private readonly key: Buffer;
    private readonly algorithm = 'aes-256-cbc';

    constructor( private readonly configService: ConfigService ){

        const secret = this.configService.get<string>('ENCRYPTION_SECRET');
        if(!secret){
            throw new Error('ENCRYPTION_SECRET is not defined');            
        }
        this.key = crypto.scryptSync(secret, 'salt', 32);

    }

    encryptData(data: Buffer | string):{ encrypted: string, iv: string}{
        const iv = crypto.randomBytes(16);
        const cipher = crypto.createCipheriv(this.algorithm, this.key, iv);
        const encrypted = Buffer.concat([cipher.update(data), cipher.final()]);
        return {
            encrypted: encrypted.toString('base64'),
            iv: iv.toString('hex')
        }
    }

    decryptData( encryptedBase64: string, ivHex: string ): Buffer{
        const iv = Buffer.from(ivHex, 'hex');
        const encrypted = Buffer.from(encryptedBase64, 'base64');
        const decipher = crypto.createDecipheriv(this.algorithm, this.key, iv);
        return Buffer.concat([decipher.update(encrypted), decipher.final()]);
    }

}