import { Column, Entity, PrimaryColumn } from "typeorm";

@Entity({name:'pub_zonas_horarias', schema: 'public'})
export class ZonaHoraria{
    @PrimaryColumn()
    clave: string;

    @Column()
    descripcion: string;    

}