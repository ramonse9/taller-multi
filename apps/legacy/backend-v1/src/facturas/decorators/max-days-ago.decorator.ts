import { registerDecorator, ValidationOptions, ValidationArguments } from "class-validator";

export function MaxDaysAgo(days: number, validationoptions?: ValidationOptions){
    return function (object: Object, propertyName: string){
        registerDecorator({
            name: 'maxDaysAgo',
            target: object.constructor,
            propertyName,
            constraints: [days],
            options: validationoptions,
            validator: {
                validate(value: Date, args: ValidationArguments){
                    
                    const [maxDays] = args.constraints;
                    if( !(value instanceof Date) || isNaN(value.getTime()) ) return false;

                    const now = new Date();
                    const limitDate = new Date(now);

                    limitDate.setDate(now.getDate() - maxDays);

                    return value >= limitDate && value <= now;
                },
                defaultMessage(args: ValidationArguments){
                    const [maxDays] = args.constraints;
                    return `La fecha no puede ser mayor a ${maxDays} días naturales`
                }
            }
        })
    }
}