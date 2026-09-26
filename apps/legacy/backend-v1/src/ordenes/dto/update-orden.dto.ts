import { OmitType } from '@nestjs/swagger';
import { PartialType } from '@nestjs/swagger';
import { CreateOrdenDto } from './create-orden.dto';

export class UpdateOrdenDto extends OmitType( PartialType(CreateOrdenDto), ['conceptos'] as const ){ 
}