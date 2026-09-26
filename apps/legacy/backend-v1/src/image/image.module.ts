import { Module } from '@nestjs/common';
import { ImageService } from './image.service';
import { CloudinaryService } from './cloudinary.service';

@Module({
  providers: [ImageService,CloudinaryService],
  exports: [ImageService]
})
export class ImageModule {}
