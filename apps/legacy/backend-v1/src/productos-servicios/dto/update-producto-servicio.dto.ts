import { PartialType } from '@nestjs/swagger';
import { CreateProductoServicioDto } from './create-producto-servicio.dto';

export class UpdateProductoServicioDto extends PartialType(CreateProductoServicioDto) {}
