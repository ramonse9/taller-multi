import { registerDecorator, ValidationArguments, ValidationOptions } from "class-validator";

export function AtLeastOneExists(property: string, validationOptions?: ValidationOptions){
    return function (object: Object, propertyName: string){
        registerDecorator({
            name: 'atLeastOneExists',
            target: object.constructor,
            propertyName: propertyName,
            constraints: [property],
            options: validationOptions,
            validator: {
                validate( value: any, args: ValidationArguments){
                    const [relatedPropertyName] = args.constraints;
                    const relatedValue = (args.object as any)[relatedPropertyName];
                    //Retorna true si al menos uno de los dos tiene valor
                    return value != true || relatedValue != null;
                },
                defaultMessage(args: ValidationArguments){
                    return `Debe existir al menos uno: {args.propertyName} o {args.contraints[0]}`;
                }
            }
        });
    }
}