import { CreateDateColumn, Entity, PrimaryColumn } from "typeorm";

@Entity({name: 'pub_companias_tipos_giros', schema:'public'})
export class CompaniaTipoGiro{

    @PrimaryColumn()
    tipo: string;

    @CreateDateColumn({type: 'timestamptz'})        
    createdAt: Date;

}
