
import { Injectable } from '@nestjs/common';
import { v2 as cloudinary, UploadApiResponse } from 'cloudinary';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class CloudinaryService {
    
    constructor( private config: ConfigService){
       cloudinary.config({
         cloud_name: config.get('CLOUDINARY_CLOUD_NAME'),
         api_key: config.get('CLOUDINARY_API_KEY'),
         api_secret: config.get('CLOUDINARY_API_SECRET')
       });
    }

    uploadFile( file: Express.Multer.File):Promise<UploadApiResponse>{
        
        
        return new Promise<UploadApiResponse>( (resolve, reject) => {

                cloudinary.uploader.upload_stream( 
                    { folder: 'taller_cp'}, 
                    (err, result) => {
                    if(err) reject(err);
                    else resolve(result);
                }).end(file.buffer)
            })
        
    }

    //Observable
    /*uploadFile( file: Express.Multer.File):Observable<UploadApiResponse>{
        
        return from(
            new Promise<UploadApiResponse>( (resolve, reject) => {

                cloudinary.uploader.upload_stream( 
                    { folder: 'taller_cp'}, 
                    (err, result) => {
                    if(err) reject(err);
                    else resolve(result);
                }).end(file.buffer)
            })
        )
    }*/

    delete(publicId: string){
        return cloudinary.uploader.destroy(publicId)
    }

    //Observable
    /*delete(publicId: string){
        return from(cloudinary.uploader.destroy(publicId))
    }*/
}