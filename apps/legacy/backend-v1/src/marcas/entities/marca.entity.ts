import { Column, Entity, OneToMany, PrimaryColumn } from "typeorm"
import { Modelo } from "../../modelos/entities/modelo.entity";
import { AuditableEntity } from "../../auth/entities/auditable.entity";

@Entity({name:'pub_marcas', schema:'public'})
export class Marca extends AuditableEntity {
    
    @PrimaryColumn()
    id:string    
    
    @Column({type: 'varchar', length: 30})
    nombre: string

    @OneToMany( () => Modelo, (modelo) => modelo.marca )
    modelos: Modelo[];
}
