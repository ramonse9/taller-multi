import { EnumRole } from './../../commom/enums/general.enum';
export interface JwtPayload {
    sub: string
    role: EnumRole
    companiaId: string
}
//TODO añadir todo lo que quieran grabar