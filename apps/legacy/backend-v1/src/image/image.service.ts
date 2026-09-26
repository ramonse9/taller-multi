import { Injectable } from '@nestjs/common';
import { CreateImageDto } from './dto/create-image.dto';
import { UpdateImageDto } from './dto/update-image.dto';
import { CloudinaryService } from './cloudinary.service';
import { forkJoin, map } from 'rxjs';

@Injectable()
export class ImageService {

  constructor( private readonly cloudinaryService: CloudinaryService){}

  uploadImage(file: Express.Multer.File, idNota: string){
    return this.cloudinaryService.uploadFile( file )
    /*.pipe(
      map( res => ({
        id_orden_nota: idNota,
        url: res.secure_url,
        public_id: res.public_id
      }))
    );*/
  }

  uploadImages( files: Express.Multer.File[] ){
    
    const cloudinaryResults = files.map( (file) => this.cloudinaryService.uploadFile(file) )

    return Promise.all( cloudinaryResults )
  }

    
  deleteImage( publicId: string):Promise<void>{
    return this.cloudinaryService.delete(publicId)
  }

  
}
