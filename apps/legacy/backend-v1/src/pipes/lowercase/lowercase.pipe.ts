import { ArgumentMetadata, Injectable, PipeTransform } from "@nestjs/common";

@Injectable()
export class LowercasePipe implements PipeTransform{    

    transform(value: any, metadata: ArgumentMetadata){

        /*{
            type: 'body' | 'query' | 'param' | 'custom',
            metatype?: Type<unknown>,
            data?: string
        }*/

        if(typeof value === 'string'){
            return value.toLowerCase().trim()
        }
        return value;
    }
    
}