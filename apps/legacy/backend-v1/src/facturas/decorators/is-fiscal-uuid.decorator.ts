import { registerDecorator, ValidationOptions, ValidationArguments } from 'class-validator';

export function IsFiscalUuid(validationOptions?: ValidationOptions){
    return function( object: Object, propertyName: string){
        registerDecorator({
            name: 'isFisicalUuid',
            target: object.constructor,
            propertyName: propertyName,
            options: validationOptions,
            validator: {
                validate( value: any, args: ValidationArguments){
                    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
                    return typeof value === 'string' && uuidRegex.test(value);
                },
                defaultMessage(args: ValidationArguments){
                    return `${args.property} debe ser un UUID fiscal válido`
                }
            }
        })
    }
}