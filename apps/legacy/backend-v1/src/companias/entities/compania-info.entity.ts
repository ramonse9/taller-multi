import { Column, Entity, JoinColumn, OneToOne, PrimaryGeneratedColumn } from "typeorm";
import { Compania } from "./compania.entity";

@Entity({name: 'pub_compania_info', schema: 'public'})
export class CompaniaInfo{
    @PrimaryGeneratedColumn()
    id:number;

    @Column('text')
    telefono: string;

    @Column('text')
    calle: string;

    @Column('text')
    numeroLocal: string;

    @Column('text')
    colonia: string;
    
    @Column('text')
    ciudad: string;

    @Column('text')
    codigoPostal: string;

    @Column('text')
    correoElectronico: string;

    @OneToOne(() => Compania, { onDelete: 'CASCADE'})
    @JoinColumn({name: 'id_compania'})
    compania: Compania;

}