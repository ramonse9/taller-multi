import { Transform } from "class-transformer";


export function ToUpperCase(){
    return Transform( ({value}) => value.trim().toUpperCase() );
}