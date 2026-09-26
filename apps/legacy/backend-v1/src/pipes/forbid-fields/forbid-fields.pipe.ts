import { ArgumentMetadata, BadRequestException, Injectable, PipeTransform } from '@nestjs/common';

@Injectable()
export class ForbidFieldsPipe implements PipeTransform {
  
  constructor( private readonly forbiddenFields: string[] ){}
  
  transform(value: any) {

    if( typeof value !== 'object' || value === null ){
      throw new BadRequestException('El cuerpo de la solcitud debe ser un objeto JSON válido')
    }

    const found = this.forbiddenFields.filter( field => field in value );

    if ( found.length > 0 ) {
      throw new BadRequestException(
        `No se permite modificar los siguientes campos: ${ found.join(', ')}`,
      );
    }

    return value;
  }

}
